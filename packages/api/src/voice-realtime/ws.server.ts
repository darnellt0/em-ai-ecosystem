import type { IncomingMessage } from 'node:http';
import { Server as HttpServer } from 'node:http';
import type { Express } from 'express';
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import type { Duplex } from 'node:stream';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import { SttAdapter } from './adapters/stt.adapter';
import type { SttAdapterContract } from './adapters/stt.adapter';
import { TtsAdapter } from './adapters/tts.adapter';
import type { TtsAdapterContract } from './adapters/tts.adapter';
import { VoiceIntentClient, VoiceRealtimeDependencies } from './intent.client';
import type { IntentClientContract } from './intent.client';

const HEARTBEAT_INTERVAL_MS = 10_000;
const IDLE_TIMEOUT_MS = 30_000;

interface AudioChunkFrame {
  readonly type: 'audio.chunk';
  readonly contentType: 'audio/pcm;rate=16000';
  readonly data: string;
}

type ClientFrame = AudioChunkFrame;

interface SttPartialFrame {
  readonly type: 'stt.partial';
  readonly text: string;
}

interface SttFinalFrame {
  readonly type: 'stt.final';
  readonly text: string;
}

interface TtsStartFrame {
  readonly type: 'tts.start';
  readonly streamId: string;
}

interface TtsChunkFrame {
  readonly type: 'tts.chunk';
  readonly streamId: string;
  readonly data: string;
}

interface TtsEndFrame {
  readonly type: 'tts.end';
  readonly streamId: string;
}

export type VoiceWebSocketServer = WebSocketServer;

type ServerFrame = SttPartialFrame | SttFinalFrame | TtsStartFrame | TtsChunkFrame | TtsEndFrame;

const isHttpServer = (candidate: Express | HttpServer): candidate is HttpServer => {
  return typeof (candidate as HttpServer).setTimeout === 'function';
};

const toUtf8String = (raw: RawData): string => {
  if (typeof raw === 'string') {
    return raw;
  }

  if (raw instanceof Buffer) {
    return raw.toString('utf8');
  }

  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString('utf8');
  }

  return Buffer.from(raw).toString('utf8');
};

const parseClientFrame = (raw: RawData): ClientFrame | null => {
  try {
    const decoded = toUtf8String(raw);
    const parsed = JSON.parse(decoded) as Partial<ClientFrame>;
    if (parsed?.type === 'audio.chunk' && parsed.data && parsed.contentType === 'audio/pcm;rate=16000') {
      return {
        type: 'audio.chunk',
        contentType: 'audio/pcm;rate=16000',
        data: parsed.data,
      };
    }
  } catch (error) {
    console.error('Failed to parse client frame', error);
  }

  return null;
};

const getTokenFromRequest = (request: IncomingMessage): string | null => {
  const host = request.headers.host ?? 'localhost';
  const requestUrl = request.url ?? '/';
  const url = new URL(requestUrl, `http://${host}`);
  return url.searchParams.get('token');
};

const verifyToken = (request: IncomingMessage): boolean => {
  const configuredToken = process.env.VOICE_WS_TOKEN;
  if (!configuredToken) {
    console.error('VOICE_WS_TOKEN is not configured');
    return false;
  }

  const providedToken = getTokenFromRequest(request);
  return providedToken === configuredToken;
};

const createAdapters = (
  dependencies: VoiceRealtimeDependencies,
): {
  sttAdapter: SttAdapterContract;
  ttsAdapter: TtsAdapterContract;
  intentClient: IntentClientContract;
  now: () => number;
} => {
  const sttAdapter = dependencies.createSttAdapter ? dependencies.createSttAdapter() : new SttAdapter();
  const ttsAdapter = dependencies.createTtsAdapter ? dependencies.createTtsAdapter() : new TtsAdapter();
  const intentClient = dependencies.intentClient ?? new VoiceIntentClient();
  const now = dependencies.now ?? (() => Date.now());
  return { sttAdapter, ttsAdapter, intentClient, now };
};

interface ConnectionState {
  lastActivity: number;
  awaitingPong: boolean;
  heartbeat: NodeJS.Timeout;
  unsubscribePartial: () => void;
  unsubscribeFinal: () => void;
}

const sendFrame = (socket: WebSocket, frame: ServerFrame): void => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(frame));
  }
};

export const initVoiceRealtimeWSS = (
  appOrServer: Express | HttpServer,
  dependencies: VoiceRealtimeDependencies = {},
): VoiceWebSocketServer => {
  if (!isHttpServer(appOrServer)) {
    throw new Error('initVoiceRealtimeWSS requires an HTTP server instance');
  }

  const wss = new WebSocketServer({ noServer: true });
  const connectionState = new WeakMap<WebSocket, ConnectionState>();

  const upgradeHandler = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const host = request.headers.host ?? 'localhost';
    const url = new URL(request.url ?? '/', `http://${host}`);

    if (url.pathname !== '/ws/voice') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    if (!verifyToken(request)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  };

  appOrServer.on('upgrade', upgradeHandler);

  wss.on('connection', (socket: WebSocket) => {
    const { sttAdapter, ttsAdapter, intentClient, now } = createAdapters(dependencies);
    const heartbeat = setInterval(() => {
      const state = connectionState.get(socket);
      if (!state) {
        return;
      }

      const idleDuration = now() - state.lastActivity;
      if (idleDuration > IDLE_TIMEOUT_MS) {
        socket.terminate();
        return;
      }

      if (state.awaitingPong) {
        socket.terminate();
        return;
      }

      state.awaitingPong = true;
      socket.ping();
    }, HEARTBEAT_INTERVAL_MS);

    heartbeat.unref?.();

    const unsubscribePartial = sttAdapter.onPartial((text) => {
      sendFrame(socket, { type: 'stt.partial', text });
    });

    const unsubscribeFinal = sttAdapter.onFinal((text) => {
      sendFrame(socket, { type: 'stt.final', text });
      void (async () => {
        try {
          const { humanSummary } = await intentClient.postIntent(text);
          const streamId = randomUUID();
          sendFrame(socket, { type: 'tts.start', streamId });

          for await (const chunk of ttsAdapter.start(humanSummary)) {
            if (socket.readyState !== WebSocket.OPEN) {
              break;
            }

            sendFrame(socket, {
              type: 'tts.chunk',
              streamId,
              data: chunk.toString('base64'),
            });
          }

          sendFrame(socket, { type: 'tts.end', streamId });
        } catch (error) {
          console.error('Failed to process intent/TTS pipeline', error);
        }
      })();
    });

    connectionState.set(socket, {
      lastActivity: now(),
      awaitingPong: false,
      heartbeat,
      unsubscribePartial,
      unsubscribeFinal,
    });

    socket.on('message', async (raw: RawData) => {
      const state = connectionState.get(socket);
      if (!state) {
        return;
      }

      state.lastActivity = now();
      state.awaitingPong = false;

      const frame = parseClientFrame(raw);
      if (!frame) {
        socket.close(1003, 'Invalid message');
        return;
      }

      try {
        const audioBuffer = Buffer.from(frame.data, 'base64');
        await sttAdapter.pushPcm(audioBuffer);
      } catch (error) {
        console.error('Failed to push PCM data', error);
        socket.close(1011, 'Unable to process audio');
      }
    });

    socket.on('pong', () => {
      const state = connectionState.get(socket);
      if (!state) {
        return;
      }

      state.awaitingPong = false;
      state.lastActivity = now();
    });

    const cleanup = () => {
      const state = connectionState.get(socket);
      if (!state) {
        return;
      }

      clearInterval(state.heartbeat);
      state.unsubscribePartial();
      state.unsubscribeFinal();
      connectionState.delete(socket);
    };

    socket.on('close', cleanup);
    socket.on('error', (error) => {
      console.error('WebSocket connection error', error);
    });
  });

  wss.on('close', () => {
    appOrServer.off('upgrade', upgradeHandler);
  });

  appOrServer.on('close', () => {
    wss.close();
  });

  return wss;
};
