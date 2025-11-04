import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';
import { initVoiceRealtimeWSS } from '../src/voice-realtime/ws.server';
import type { VoiceRealtimeDependencies } from '../src/voice-realtime/intent.client';
import type { SttPartialCallback, SttFinalCallback } from '../src/voice-realtime/adapters/stt.adapter';
import type { IntentResponse } from '../src/voice-realtime/intent.client';

const VOICE_TOKEN = 'integration-test-token';

type ServerFrame =
  | { readonly type: 'stt.partial'; readonly text: string }
  | { readonly type: 'stt.final'; readonly text: string }
  | { readonly type: 'tts.start'; readonly streamId: string }
  | { readonly type: 'tts.chunk'; readonly streamId: string; readonly data: string }
  | { readonly type: 'tts.end'; readonly streamId: string };

const isPartialFrame = (frame: ServerFrame): frame is Extract<ServerFrame, { type: 'stt.partial' }> => {
  return frame.type === 'stt.partial';
};

const isFinalFrame = (frame: ServerFrame): frame is Extract<ServerFrame, { type: 'stt.final' }> => {
  return frame.type === 'stt.final';
};

const isTtsChunkFrame = (frame: ServerFrame): frame is Extract<ServerFrame, { type: 'tts.chunk' }> => {
  return frame.type === 'tts.chunk';
};

class ScriptedSttAdapter {
  private readonly partialCallbacks = new Set<SttPartialCallback>();

  private readonly finalCallbacks = new Set<SttFinalCallback>();

  private invocation = 0;

  readonly receivedChunks: Buffer[] = [];

  constructor(private readonly partialScripts: string[], private readonly finalText: string) {}

  async pushPcm(buffer: Buffer): Promise<void> {
    this.receivedChunks.push(buffer);
    const index = this.invocation;
    this.invocation += 1;
    const partial = this.partialScripts[index] ?? this.partialScripts[this.partialScripts.length - 1];
    for (const callback of this.partialCallbacks) {
      callback(partial);
    }

    if (this.invocation === this.partialScripts.length) {
      for (const callback of this.finalCallbacks) {
        callback(this.finalText);
      }
    }
  }

  onPartial(callback: SttPartialCallback): () => void {
    this.partialCallbacks.add(callback);
    return () => this.partialCallbacks.delete(callback);
  }

  onFinal(callback: SttFinalCallback): () => void {
    this.finalCallbacks.add(callback);
    return () => this.finalCallbacks.delete(callback);
  }
}

class ScriptedTtsAdapter {
  readonly requests: string[] = [];

  constructor(private readonly chunks: string[]) {}

  async *start(text: string): AsyncGenerator<Buffer> {
    this.requests.push(text);
    for (const chunk of this.chunks) {
      yield Buffer.from(chunk, 'utf8');
    }
  }
}

class StubIntentClient {
  readonly received: string[] = [];

  async postIntent(text: string): Promise<IntentResponse> {
    this.received.push(text);
    return { humanSummary: `summary:${text}` };
  }
}

const createServer = async (dependencies: VoiceRealtimeDependencies = {}) => {
  const app = express();
  const server = http.createServer(app);
  initVoiceRealtimeWSS(server, dependencies);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  return { server, port };
};

describe('voice realtime websocket', () => {
  beforeEach(() => {
    process.env.VOICE_WS_TOKEN = VOICE_TOKEN;
  });

  afterEach(() => {
    delete process.env.VOICE_WS_TOKEN;
  });

  it('streams partial STT results and TTS audio in response to audio chunks', async () => {
    let sttAdapter: ScriptedSttAdapter | undefined;
    let ttsAdapter: ScriptedTtsAdapter | undefined;
    const intentClient = new StubIntentClient();

    const dependencies: VoiceRealtimeDependencies = {
      createSttAdapter: () => {
        sttAdapter = new ScriptedSttAdapter(['hello', 'there', 'friend'], 'final hello friend');
        return sttAdapter;
      },
      createTtsAdapter: () => {
        ttsAdapter = new ScriptedTtsAdapter(['chunk-a', 'chunk-b']);
        return ttsAdapter;
      },
      intentClient,
    };

    const { server, port } = await createServer(dependencies);

    const url = `ws://127.0.0.1:${port}/ws/voice?token=${VOICE_TOKEN}`;
    const client = new WebSocket(url);

    const receivedFrames: ServerFrame[] = [];

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => {
        const payload = (data: string) =>
          JSON.stringify({ type: 'audio.chunk', contentType: 'audio/pcm;rate=16000', data });
        client.send(payload(Buffer.from('pcm-1').toString('base64')));
        client.send(payload(Buffer.from('pcm-2').toString('base64')));
        client.send(payload(Buffer.from('pcm-3').toString('base64')));
      });

      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString()) as ServerFrame;
        receivedFrames.push(parsed);
        if (parsed.type === 'tts.end') {
          resolve();
        }
      });

      client.on('error', (error) => {
        reject(error);
      });

      client.on('close', (code) => {
        if (code !== 1000 && receivedFrames.every((frame) => frame.type !== 'tts.end')) {
          reject(new Error(`Connection closed prematurely with code ${code}`));
        }
      });
    });

    await new Promise<void>((resolve) => {
      client.once('close', () => resolve());
      client.close();
    });

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    expect(sttAdapter).toBeDefined();
    expect(sttAdapter?.receivedChunks).toHaveLength(3);
    expect(intentClient.received).toEqual(['final hello friend']);
    expect(ttsAdapter?.requests).toEqual(['summary:final hello friend']);

    const partials = receivedFrames.filter(isPartialFrame).map((frame) => frame.text);
    expect(partials).toEqual(['hello', 'there', 'friend']);

    const finals = receivedFrames.filter(isFinalFrame).map((frame) => frame.text);
    expect(finals).toEqual(['final hello friend']);

    const ttsStart = receivedFrames.find((frame) => frame.type === 'tts.start');
    expect(typeof ttsStart?.streamId).toBe('string');

    const streamId = ttsStart?.streamId as string;
    const ttsChunks = receivedFrames.filter(isTtsChunkFrame);
    expect(ttsChunks).toHaveLength(2);
    expect(ttsChunks.every((frame) => frame.streamId === streamId)).toBe(true);

    const decodedChunks = ttsChunks.map((frame) => Buffer.from(frame.data, 'base64').toString('utf8'));
    expect(decodedChunks).toEqual(['chunk-a', 'chunk-b']);

    const ttsEnd = receivedFrames.find((frame) => frame.type === 'tts.end');
    expect(ttsEnd?.streamId).toBe(streamId);
  });

  it('rejects websocket connections without a valid bearer token', async () => {
    const { server, port } = await createServer();

    const url = `ws://127.0.0.1:${port}/ws/voice?token=invalid`;
    await expect(
      new Promise<void>((resolve, reject) => {
        const client = new WebSocket(url);
        client.once('open', () => {
          reject(new Error('Connection should not succeed with an invalid token'));
        });
        client.once('error', () => {
          client.close();
          resolve();
        });
      }),
    ).resolves.toBeUndefined();

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});
