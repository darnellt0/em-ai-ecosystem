import express from 'express';
import http from 'node:http';
import net, { AddressInfo } from 'node:net';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { initVoiceRealtimeWSS } from '../src/voice-realtime/ws.server';
import { SttAdapter } from '../src/voice-realtime/adapters/stt.adapter';
import { TtsAdapter } from '../src/voice-realtime/adapters/tts.adapter';
import { VoiceIntentClient, VoiceRealtimeDependencies } from '../src/voice-realtime/intent.client';

class ManualWebSocketClient extends EventEmitter {
  private readonly url: URL;

  private socket: net.Socket | null = null;

  private handshakeComplete = false;

  private headerBuffer = Buffer.alloc(0);

  private frameBuffer = Buffer.alloc(0);

  private resolveHandshake: (() => void) | null = null;

  private rejectHandshake: ((error: Error) => void) | null = null;

  constructor(url: string) {
    super();
    this.url = new URL(url);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolveHandshake = resolve;
      this.rejectHandshake = reject;
      const port = this.url.port !== '' ? Number(this.url.port) : 80;
      const host = this.url.hostname;
      const path = `${this.url.pathname}${this.url.search}`;
      const key = randomBytes(16).toString('base64');

      const socket = net.createConnection({ host, port }, () => {
        const request = [
          `GET ${path} HTTP/1.1`,
          `Host: ${host}:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          'Sec-WebSocket-Version: 13',
          `Sec-WebSocket-Key: ${key}`,
          '\r\n',
        ].join('\r\n');
        socket.write(request);
      });

      this.socket = socket;

      socket.on('data', (chunk) => this.handleSocketData(chunk));
      socket.on('error', (error) => {
        const normalized = error instanceof Error ? error : new Error('socket error');
        if (!this.handshakeComplete) {
          this.rejectHandshake?.(normalized);
          this.resolveHandshake = null;
          this.rejectHandshake = null;
        } else if (this.listenerCount('error') > 0) {
          this.emit('error', normalized);
        }
      });
      socket.on('close', () => {
        if (!this.handshakeComplete) {
          this.rejectHandshake?.(new Error('Handshake failed: connection closed'));
          this.resolveHandshake = null;
          this.rejectHandshake = null;
          this.cleanup();
        } else {
          this.emit('close');
        }
      });
    });
  }

  sendText(message: string): void {
    this.sendFrame(0x1, Buffer.from(message, 'utf8'), true);
  }

  close(): void {
    this.sendFrame(0x8, Buffer.alloc(0), true);
    this.socket?.end();
  }

  dispose(): void {
    this.cleanup();
    this.removeAllListeners();
  }

  private handleSocketData(chunk: Buffer): void {
    if (!this.handshakeComplete) {
      this.headerBuffer = Buffer.concat([this.headerBuffer, chunk]);
      const headerEndIndex = this.headerBuffer.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEndIndex === -1) {
        return;
      }
      const headerText = this.headerBuffer.slice(0, headerEndIndex).toString('utf8');
      const statusLine = headerText.split('\r\n')[0];
      if (!statusLine.includes('101')) {
        const error = new Error(`Handshake failed: ${statusLine}`);
        this.rejectHandshake?.(error);
        this.cleanup();
        return;
      }
      this.handshakeComplete = true;
      const remaining = this.headerBuffer.slice(headerEndIndex + 4);
      this.headerBuffer = Buffer.alloc(0);
      this.resolveHandshake?.();
      this.resolveHandshake = null;
      this.rejectHandshake = null;
      if (remaining.length > 0) {
        this.processFrameData(remaining);
      }
      return;
    }

    this.processFrameData(chunk);
  }

  private processFrameData(chunk: Buffer): void {
    this.frameBuffer = Buffer.concat([this.frameBuffer, chunk]);
    while (this.frameBuffer.length >= 2) {
      const firstByte = this.frameBuffer[0];
      const opcode = firstByte & 0x0f;
      const fin = (firstByte & 0x80) !== 0;
      const secondByte = this.frameBuffer[1];
      const masked = (secondByte & 0x80) === 0x80;
      let offset = 2;
      let payloadLength = secondByte & 0x7f;
      if (payloadLength === 126) {
        if (this.frameBuffer.length < offset + 2) {
          return;
        }
        payloadLength = this.frameBuffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (this.frameBuffer.length < offset + 8) {
          return;
        }
        const high = this.frameBuffer.readUInt32BE(offset);
        const low = this.frameBuffer.readUInt32BE(offset + 4);
        if (high !== 0) {
          this.terminate(new Error('Payload too large'));
          return;
        }
        payloadLength = low;
        offset += 8;
      }

      if (masked) {
        this.terminate(new Error('Server frames must be unmasked'));
        return;
      }

      if (this.frameBuffer.length < offset + payloadLength) {
        return;
      }

      const payload = this.frameBuffer.slice(offset, offset + payloadLength);
      this.frameBuffer = this.frameBuffer.slice(offset + payloadLength);

      switch (opcode) {
        case 0x1:
          this.emit('message', payload);
          break;
        case 0x8:
          this.emit('close');
          return;
        case 0x9:
          this.sendFrame(0xA, payload, true);
          break;
        case 0xA:
          this.emit('pong');
          break;
        default:
          break;
      }

      if (!fin) {
        this.terminate(new Error('Fragmented frames not supported in test client'));
        return;
      }
    }
  }

  private sendFrame(opcode: number, payload: Buffer, maskOutgoing: boolean): void {
    if (!this.socket) {
      return;
    }

    const payloadLength = payload.length;
    let headerLength = 2;
    if (payloadLength >= 126 && payloadLength <= 0xffff) {
      headerLength += 2;
    } else if (payloadLength > 0xffff) {
      headerLength += 8;
    }

    const maskBytes = maskOutgoing ? randomBytes(4) : null;
    const frame = Buffer.alloc(headerLength + (maskOutgoing ? 4 : 0) + payloadLength);
    frame[0] = 0x80 | (opcode & 0x0f);
    let offset = 2;

    if (payloadLength < 126) {
      frame[1] = payloadLength | (maskOutgoing ? 0x80 : 0);
    } else if (payloadLength <= 0xffff) {
      frame[1] = 126 | (maskOutgoing ? 0x80 : 0);
      frame.writeUInt16BE(payloadLength, offset);
      offset += 2;
    } else {
      frame[1] = 127 | (maskOutgoing ? 0x80 : 0);
      frame.writeUInt32BE(0, offset);
      frame.writeUInt32BE(payloadLength, offset + 4);
      offset += 8;
    }

    if (maskOutgoing && maskBytes) {
      maskBytes.copy(frame, offset);
      offset += 4;
      for (let index = 0; index < payloadLength; index += 1) {
        frame[offset + index] = payload[index] ^ maskBytes[index % 4];
      }
    } else {
      payload.copy(frame, offset);
    }

    this.socket.write(frame);
  }

  private terminate(error: Error): void {
    this.socket?.destroy();
    this.emit('error', error);
  }

  private cleanup(): void {
    this.socket?.destroy();
    this.socket = null;
    this.frameBuffer = Buffer.alloc(0);
    this.headerBuffer = Buffer.alloc(0);
  }
}


class TestSttAdapter extends SttAdapter {
  private chunks = 0;

  override async pushPcm(buffer: Buffer): Promise<void> {
    if (buffer.length === 0) {
      return;
    }

    this.chunks += 1;
    this.emitPartial(`partial-${this.chunks}`);
    if (this.chunks >= 3) {
      this.emitFinal('final transcript ready');
    }
  }
}

class TestTtsAdapter extends TtsAdapter {
  override async *start(text: string): AsyncGenerator<Buffer> {
    yield Buffer.from(`chunk:${text}`, 'utf8');
    yield Buffer.from('chunk-end', 'utf8');
  }
}

describe('voice realtime websocket', () => {
  let server: http.Server;
  let port: number;
  let wss: ReturnType<typeof initVoiceRealtimeWSS>;
  const sockets = new Set<net.Socket>();

  beforeAll(async () => {
    process.env.VOICE_WS_TOKEN = 'test-token';
    const app = express();
    app.use(express.json());

    app.post('/api/voice/intent', (req, res) => {
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      res.json({ humanSummary: `Summary: ${text}` });
    });

    server = http.createServer(app);
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    server.unref();

    const address = server.address() as AddressInfo;
    port = address.port;

    const dependencies: VoiceRealtimeDependencies = {
      createSttAdapter: () => new TestSttAdapter(),
      createTtsAdapter: () => new TestTtsAdapter(),
      intentClient: new VoiceIntentClient({ baseUrl: `http://127.0.0.1:${port}` }),
      now: () => Date.now(),
    };

    wss = initVoiceRealtimeWSS(server, dependencies);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      wss.close(() => {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        if (typeof server.closeIdleConnections === 'function') {
          server.closeIdleConnections();
        }
        for (const socket of sockets) {
          socket.destroy();
        }
        server.close(() => resolve());
      });
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
  });

  it('processes audio chunks and streams tts responses', async () => {
    const frames: Array<Record<string, unknown>> = [];

    await new Promise<void>((resolve, reject) => {
      const client = new ManualWebSocketClient(`ws://127.0.0.1:${port}/ws/voice?token=test-token`);
      let settled = false;

      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        client.off('message', handleMessage);
        client.off('error', handleError);
        client.off('close', handleClose);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      const handleMessage = (payload: Buffer) => {
        const parsed = JSON.parse(payload.toString('utf8')) as Record<string, unknown>;
        frames.push(parsed);
        if (parsed.type === 'tts.end') {
          finish();
          client.close();
        }
      };

      const handleError = (error: Error) => {
        finish(error);
      };

      const handleClose = () => {
        if (!frames.some((frame) => frame.type === 'tts.end')) {
          finish(new Error('connection closed before tts end'));
          return;
        }
        finish();
      };

      client.on('message', handleMessage);
      client.on('error', handleError);
      client.on('close', handleClose);

      void client
        .connect()
        .then(() => {
          const payload = Buffer.from('pcm');
          const message = JSON.stringify({
            type: 'audio.chunk',
            contentType: 'audio/pcm;rate=16000' as const,
            data: payload.toString('base64'),
          });
          client.sendText(message);
          client.sendText(message);
          client.sendText(message);
        })
        .catch((error) => {
          handleError(error instanceof Error ? error : new Error('handshake failed'));
        });
    });

    const partials = frames.filter((frame) => frame.type === 'stt.partial');
    expect(partials).toHaveLength(3);
    const partialTexts = partials.map((frame) => (typeof frame.text === 'string' ? frame.text : ''));
    expect(partialTexts).toEqual(['partial-1', 'partial-2', 'partial-3']);

    const finalFrame = frames.find((frame) => frame.type === 'stt.final');
    expect(finalFrame?.text).toBe('final transcript ready');

    const ttsStart = frames.find((frame) => frame.type === 'tts.start');
    expect(typeof ttsStart?.streamId).toBe('string');

    const streamId = typeof ttsStart?.streamId === 'string' ? ttsStart.streamId : '';
    const ttsChunks = frames.filter((frame) => frame.type === 'tts.chunk');
    expect(ttsChunks).toHaveLength(2);
    for (const chunk of ttsChunks) {
      expect(chunk.streamId).toBe(streamId);
      const base64Data = typeof chunk.data === 'string' ? chunk.data : '';
      const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
      expect(decoded.startsWith('chunk:') || decoded === 'chunk-end').toBe(true);
    }

    const ttsEnd = frames.find((frame) => frame.type === 'tts.end');
    expect(ttsEnd?.streamId).toBe(streamId);
  });

  it('rejects connections without a valid bearer token', async () => {
    const client = new ManualWebSocketClient(`ws://127.0.0.1:${port}/ws/voice`);
    await expect(client.connect()).rejects.toThrow(/Handshake failed/);
    client.dispose();
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
});
