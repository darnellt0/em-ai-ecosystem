import { createServer, Server as HTTPServer } from 'http';
import type { AddressInfo } from 'net';
import { WebSocket, WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

const heartbeat = (socket: WebSocket) => {
  try {
    socket.send(
      JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error('[WS] Failed to send heartbeat:', error);
  }
};

export const initVoiceRealtimeWSS = (httpServer?: HTTPServer): WebSocketServer => {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_VOICE_WSS_IN_TEST !== 'true') {
    console.log('[WS] Skipping voice realtime WSS initialization in test mode');
    return wss as WebSocketServer | null;
  }

  if (wss) {
    console.log('[WS] Voice realtime WebSocket server already initialized');
    return wss;
  }

  if (httpServer) {
    // Attach to existing HTTP server (shared in src/index.ts)
    wss = new WebSocketServer({ server: httpServer, path: '/realtime' });
    console.log('[WS] Voice realtime WebSocket server initialized at /realtime (shared HTTP server)');
  } else {
    // Fallback mode (tests/QA) – use ephemeral port (or VOICE_WS_PORT if provided)
    const internalServer = createServer();
    wss = new WebSocketServer({ server: internalServer, path: '/realtime' });

    const wsPort = process.env.VOICE_WS_PORT && process.env.VOICE_WS_PORT.trim() !== ''
      ? parseInt(process.env.VOICE_WS_PORT, 10)
      : 0;

    internalServer.listen(wsPort, () => {
      const address = internalServer.address() as AddressInfo;
      console.log(
        `[WS] Voice realtime WebSocket server initialized on port ${address?.port ?? wsPort} at /realtime (internal HTTP server)`,
      );
    });

    internalServer.on('error', (error) => {
      console.error('[WS] Server error (internal HTTP server):', error);
    });
  }

  wss.on('connection', (socket, req) => {
    const clientAddress = req.socket.remoteAddress ?? 'unknown';
    console.log(`[WS] Client connected (${clientAddress})`);

    socket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Realtime voice channel ready.',
        timestamp: new Date().toISOString(),
      }),
    );

    const interval = setInterval(() => heartbeat(socket), 25000);
    interval.unref?.();

    socket.on('message', (raw) => {
      try {
        const payload = typeof raw === 'string' ? raw : raw.toString('utf8');
        const data = JSON.parse(payload);
        console.log('[WS] Received message:', data);

        socket.send(
          JSON.stringify({
            type: 'ack',
            payload: data,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error('[WS] Failed to handle message:', error);
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid payload',
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    socket.on('close', (code, reason) => {
      clearInterval(interval);
      console.log(
        `[WS] Client disconnected (${clientAddress}) code=${code} reason=${reason.toString()}`,
      );
    });

    socket.on('error', (error) => {
      clearInterval(interval);
      console.error('[WS] Socket error:', error);
    });
  });

  wss.on('error', (error) => {
    console.error('[WS] Server error:', error);
  });

  return wss;
};

export const getVoiceRealtimeWSS = (): WebSocketServer | null => wss;
