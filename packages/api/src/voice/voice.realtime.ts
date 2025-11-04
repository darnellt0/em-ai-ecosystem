import { createHash } from 'crypto';
import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import { observeVoiceLatencyMs, recordVoiceWsMessage } from '../metrics/voice.metrics';

interface VoiceRealtimeOptions {
  path: string;
  token?: string;
}

interface VoiceRealtimeStatus {
  ready: boolean;
  clients: number;
  lastError: string | null;
}

interface VoiceClient {
  socket: Socket;
  buffer: Buffer;
}

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

let serverRef: HttpServer | null = null;
let upgradeHandler: ((req: IncomingMessage, socket: Socket, head: Buffer) => void) | null = null;
let ready = false;
let lastError: string | null = null;
const clients = new Set<VoiceClient>();

const extractToken = (req: IncomingMessage): string | undefined => {
  const headerToken = (req.headers['x-voice-token'] as string | undefined)?.trim();
  if (headerToken) {
    return headerToken;
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `http://${host}`);
    return url.searchParams.get('token') || undefined;
  } catch (error) {
    return undefined;
  }
};

const sendTextFrame = (socket: Socket, payload: string) => {
  const data = Buffer.from(payload, 'utf8');
  const frame = Buffer.alloc(2 + data.length);
  frame[0] = 0x81; // FIN + text frame
  frame[1] = data.length;
  data.copy(frame, 2);
  socket.write(frame);
};

const sendCloseFrame = (socket: Socket, code = 1000) => {
  const frame = Buffer.alloc(4);
  frame[0] = 0x88; // FIN + close opcode
  frame[1] = 0x02; // payload length
  frame.writeUInt16BE(code, 2);
  socket.write(frame);
};

const decodeFrame = (buffer: Buffer) => {
  if (buffer.length < 2) {
    return null;
  }

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  const opcode = firstByte & 0x0f;
  let payloadLength = secondByte & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < offset + 2) {
      return null;
    }
    payloadLength = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLength === 127) {
    if (buffer.length < offset + 8) {
      return null;
    }
    payloadLength = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }

  const masked = (secondByte & 0x80) === 0x80;
  if (!masked) {
    return { opcode, payload: Buffer.alloc(0), length: buffer.length }; // invalid frame
  }

  if (buffer.length < offset + 4 + payloadLength) {
    return null;
  }

  const maskingKey = buffer.slice(offset, offset + 4);
  offset += 4;

  const payload = buffer.slice(offset, offset + payloadLength);
  for (let i = 0; i < payload.length; i += 1) {
    payload[i] ^= maskingKey[i % 4];
  }

  const frameLength = offset + payloadLength;
  return { opcode, payload, length: frameLength };
};

const processClientBuffer = (client: VoiceClient) => {
  while (client.buffer.length > 0) {
    const frame = decodeFrame(client.buffer);
    if (!frame) {
      return;
    }

    client.buffer = client.buffer.slice(frame.length);

    switch (frame.opcode) {
      case 0x1: {
        recordVoiceWsMessage('message_received');
        const text = frame.payload.toString('utf8');
        try {
          const data = JSON.parse(text);
          const type = data.type as string;
          if (type === 'ping') {
            const sentAt = typeof data.timestamp === 'number' ? data.timestamp : Date.now();
            observeVoiceLatencyMs(Date.now() - sentAt);
            sendTextFrame(client.socket, JSON.stringify({ type: 'pong', timestamp: sentAt, receivedAt: Date.now() }));
            recordVoiceWsMessage('pong_sent');
          } else if (type === 'transcript') {
            const id = typeof data.id === 'string' ? data.id : 'transcript';
            sendTextFrame(client.socket, JSON.stringify({ type: 'ack', id, receivedAt: Date.now() }));
            recordVoiceWsMessage('ack_sent');
          } else if (type === 'close') {
            sendCloseFrame(client.socket, 1000);
            client.socket.end();
          } else {
            sendTextFrame(client.socket, JSON.stringify({ type: 'error', message: `Unknown event type: ${type}` }));
            recordVoiceWsMessage('unknown_event');
          }
        } catch (error) {
          sendTextFrame(client.socket, JSON.stringify({ type: 'error', message: 'Invalid JSON payload' }));
          recordVoiceWsMessage('invalid_payload');
        }
        break;
      }
      case 0x8: {
        sendCloseFrame(client.socket, 1000);
        client.socket.end();
        break;
      }
      case 0x9: {
        // ping frame, respond with pong opcode
        const pongFrame = Buffer.alloc(2 + frame.payload.length);
        pongFrame[0] = 0x8a;
        pongFrame[1] = frame.payload.length;
        frame.payload.copy(pongFrame, 2);
        client.socket.write(pongFrame);
        break;
      }
      default: {
        // unsupported opcode
        recordVoiceWsMessage('unsupported_opcode');
      }
    }
  }
};

export const initVoiceRealtime = (server: HttpServer, options: VoiceRealtimeOptions): void => {
  if (upgradeHandler) {
    return;
  }

  serverRef = server;
  ready = true;

  upgradeHandler = (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const requestUrl = request.url ? request.url.split('?')[0] : '';
    if (requestUrl !== options.path) {
      return;
    }

    const token = extractToken(request);
    if (options.token && (!token || token !== options.token)) {
      recordVoiceWsMessage('unauthorized');
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const keyHeader = request.headers['sec-websocket-key'];
    if (!keyHeader || Array.isArray(keyHeader)) {
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const acceptKey = createHash('sha1').update(keyHeader + WEBSOCKET_GUID).digest('base64');
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
    ];

    socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

    const client: VoiceClient = {
      socket,
      buffer: head && head.length > 0 ? Buffer.from(head) : Buffer.alloc(0),
    };

    clients.add(client);
    recordVoiceWsMessage('connection');

    sendTextFrame(socket, JSON.stringify({
      type: 'voice-welcome',
      message: 'Voice realtime channel connected',
      timestamp: Date.now(),
    }));
    recordVoiceWsMessage('welcome_sent');

    if (client.buffer.length > 0) {
      processClientBuffer(client);
    }

    socket.on('data', (chunk: Buffer) => {
      client.buffer = Buffer.concat([client.buffer, chunk]);
      processClientBuffer(client);
    });

    socket.on('close', () => {
      clients.delete(client);
    });

    socket.on('end', () => {
      clients.delete(client);
    });

    socket.on('error', (error: Error) => {
      lastError = error.message;
      clients.delete(client);
    });
  };

  server.on('upgrade', upgradeHandler);
};

export const getVoiceRealtimeStatus = (): VoiceRealtimeStatus => {
  return {
    ready,
    clients: clients.size,
    lastError,
  };
};

export const shutdownVoiceRealtime = (): void => {
  if (upgradeHandler && serverRef) {
    serverRef.off('upgrade', upgradeHandler);
  }

  for (const client of clients) {
    try {
      sendCloseFrame(client.socket, 1001);
      client.socket.end();
    } catch (error) {
      // ignore errors on shutdown
    }
  }

  clients.clear();
  upgradeHandler = null;
  serverRef = null;
  ready = false;
};
