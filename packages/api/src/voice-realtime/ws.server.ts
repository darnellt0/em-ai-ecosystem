import type { IncomingMessage } from 'node:http';
import { Server as HttpServer } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { URL } from 'node:url';
import type { Express } from 'express';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import type { Duplex } from 'node:stream';
import { SttAdapter } from './adapters/stt.adapter';
import { TtsAdapter } from './adapters/tts.adapter';
import { VoiceIntentClient, VoiceRealtimeDependencies } from './intent.client';

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

type ServerFrame = SttPartialFrame | SttFinalFrame | TtsStartFrame | TtsChunkFrame | TtsEndFrame;

const enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

const isHttpServer = (candidate: Express | HttpServer): candidate is HttpServer => {
  return typeof (candidate as HttpServer).setTimeout === 'function';
};

const createAcceptKey = (key: string): string => {
  return createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
};

const parseClientFrame = (raw: Buffer): ClientFrame | null => {
  try {
    const decoded = raw.toString('utf8');
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

const createAdapters = (dependencies: VoiceRealtimeDependencies) => {
  const sttAdapter = dependencies.createSttAdapter ? dependencies.createSttAdapter() : new SttAdapter();
  const ttsAdapter = dependencies.createTtsAdapter ? dependencies.createTtsAdapter() : new TtsAdapter();
  const intentClient = dependencies.intentClient ?? new VoiceIntentClient();
  const now = dependencies.now ?? (() => Date.now());
  return { sttAdapter, ttsAdapter, intentClient, now };
};

interface VoiceSocketEvents {
  message: (data: Buffer) => void;
  pong: () => void;
  close: () => void;
  error: (error: Error) => void;
}

type UpgradeSocket = Duplex & { setNoDelay: (noDelay?: boolean) => void };

class VoiceWebSocketConnection extends EventEmitter {
  static readonly OPEN = SocketState.OPEN;

  static readonly CLOSING = SocketState.CLOSING;

  static readonly CLOSED = SocketState.CLOSED;

  private state: SocketState = SocketState.OPEN;

  private buffer = Buffer.alloc(0);

  constructor(private readonly socket: UpgradeSocket) {
    super();
    this.socket.setNoDelay(true);
    this.socket.on('data', (chunk) => this.handleData(chunk));
    this.socket.on('close', () => this.handleClose());
    this.socket.on('end', () => this.handleClose());
    this.socket.on('error', (error) => this.emit('error', error));
  }

  override on<T extends keyof VoiceSocketEvents>(event: T, listener: VoiceSocketEvents[T]): this {
    return super.on(event, listener);
  }

  override once<T extends keyof VoiceSocketEvents>(event: T, listener: VoiceSocketEvents[T]): this {
    return super.once(event, listener);
  }

  get readyState(): SocketState {
    return this.state;
  }

  send(payload: string): void {
    if (this.state !== SocketState.OPEN) {
      return;
    }
    const data = Buffer.from(payload, 'utf8');
    this.socket.write(this.createFrame(0x1, data));
  }

  ping(): void {
    if (this.state !== SocketState.OPEN) {
      return;
    }
    this.socket.write(this.createFrame(0x9, Buffer.alloc(0)));
  }

  close(code = 1000, reason?: string): void {
    if (this.state === SocketState.CLOSED) {
      return;
    }
    this.state = SocketState.CLOSING;
    const reasonBuffer = reason ? Buffer.from(reason, 'utf8') : Buffer.alloc(0);
    const payload = Buffer.alloc(2 + reasonBuffer.length);
    payload.writeUInt16BE(code, 0);
    reasonBuffer.copy(payload, 2);
    this.socket.write(this.createFrame(0x8, payload));
    this.socket.end();
  }

  terminate(): void {
    this.state = SocketState.CLOSED;
    this.socket.destroy();
  }

  feedInitialData(head: Buffer): void {
    if (head.length > 0) {
      this.handleData(head);
    }
  }

  private handleData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const opcode = firstByte & 0x0f;
      const secondByte = this.buffer[1];
      const isMasked = (secondByte & 0x80) === 0x80;
      if (!isMasked) {
        this.close(1002, 'Mask required');
        return;
      }
      let offset = 2;
      let payloadLength = secondByte & 0x7f;
      if (payloadLength === 126) {
        if (this.buffer.length < offset + 2) {
          return;
        }
        payloadLength = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (this.buffer.length < offset + 8) {
          return;
        }
        const high = this.buffer.readUInt32BE(offset);
        const low = this.buffer.readUInt32BE(offset + 4);
        if (high !== 0) {
          this.close(1009, 'Payload too large');
          return;
        }
        payloadLength = low;
        offset += 8;
      }
      if (this.buffer.length < offset + 4) {
        return;
      }
      const mask = this.buffer.slice(offset, offset + 4);
      offset += 4;
      if (this.buffer.length < offset + payloadLength) {
        return;
      }
      const payload = this.buffer.slice(offset, offset + payloadLength);
      this.buffer = this.buffer.slice(offset + payloadLength);
      const unmasked = Buffer.alloc(payloadLength);
      for (let index = 0; index < payloadLength; index += 1) {
        unmasked[index] = payload[index] ^ mask[index % 4];
      }

      switch (opcode) {
        case 0x1:
          this.emit('message', unmasked);
          break;
        case 0x8:
          this.handleClose();
          return;
        case 0x9:
          this.socket.write(this.createFrame(0xA, unmasked));
          break;
        case 0xA:
          this.emit('pong');
          break;
        default:
          break;
      }

      if ((firstByte & 0x80) === 0) {
        // Fragmented frames are not supported in this stub implementation.
        this.close(1003, 'Fragmented frames not supported');
        return;
      }
    }
  }

  private createFrame(opcode: number, payload: Buffer): Buffer {
    const payloadLength = payload.length;
    let headerLength = 2;
    if (payloadLength >= 126 && payloadLength <= 0xffff) {
      headerLength += 2;
    } else if (payloadLength > 0xffff) {
      headerLength += 8;
    }
    const frame = Buffer.alloc(headerLength + payloadLength);
    frame[0] = 0x80 | (opcode & 0x0f);
    if (payloadLength < 126) {
      frame[1] = payloadLength;
    } else if (payloadLength <= 0xffff) {
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
    } else {
      frame[1] = 127;
      frame.writeUInt32BE(0, 2);
      frame.writeUInt32BE(payloadLength, 6);
    }
    payload.copy(frame, headerLength);
    return frame;
  }

  private handleClose(): void {
    if (this.state === SocketState.CLOSED) {
      return;
    }
    this.state = SocketState.CLOSED;
    this.emit('close');
  }
}

class VoiceWebSocketServer extends EventEmitter {
  private readonly clients = new Set<VoiceWebSocketConnection>();

  handleConnection(socket: VoiceWebSocketConnection, request: IncomingMessage): void {
    this.clients.add(socket);
    socket.once('close', () => this.clients.delete(socket));
    this.emit('connection', socket, request);
  }

  close(callback?: () => void): void {
    for (const client of this.clients) {
      client.terminate();
    }
    this.clients.clear();
    if (callback) {
      callback();
    }
  }
}

const sendFrame = (socket: VoiceWebSocketConnection, frame: ServerFrame): void => {
  if (socket.readyState === SocketState.OPEN) {
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

  const wss = new VoiceWebSocketServer();

  appOrServer.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host ?? 'localhost';
      const url = new URL(request.url ?? '/', `http://${host}`);
      if (url.pathname !== '/ws/voice') {
        socket.destroy();
        return;
      }

      if (!verifyToken(request)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const keyHeader = request.headers['sec-websocket-key'];
      if (typeof keyHeader !== 'string') {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const acceptKey = createAcceptKey(keyHeader);
      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n',
      ].join('\r\n');
      socket.write(responseHeaders);

      const connection = new VoiceWebSocketConnection(socket as UpgradeSocket);
      connection.feedInitialData(head);
      wss.handleConnection(connection, request);
    } catch (error) {
      console.error('Failed to upgrade websocket request', error);
      socket.destroy();
    }
  });

  wss.on('connection', (socket) => {
    const { sttAdapter, ttsAdapter, intentClient, now } = createAdapters(dependencies);
    let lastActivity = now();

    const heartbeat = setInterval(() => {
      if (socket.readyState === SocketState.CLOSED || socket.readyState === SocketState.CLOSING) {
        clearInterval(heartbeat);
        return;
      }

      const idleDuration = now() - lastActivity;
      if (idleDuration > IDLE_TIMEOUT_MS) {
        socket.terminate();
        clearInterval(heartbeat);
        return;
      }

      socket.ping();
    }, HEARTBEAT_INTERVAL_MS);

    if (typeof (heartbeat as NodeJS.Timeout).unref === 'function') {
      (heartbeat as NodeJS.Timeout).unref();
    }

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
            if (socket.readyState !== SocketState.OPEN) {
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

    socket.on('message', async (raw) => {
      lastActivity = now();
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
      lastActivity = now();
    });

    socket.on('close', () => {
      clearInterval(heartbeat);
      unsubscribePartial();
      unsubscribeFinal();
    });

    socket.on('error', (error) => {
      console.error('WebSocket connection error', error);
    });
  });

  appOrServer.on('close', () => {
    wss.close();
  });

  return wss;
};
