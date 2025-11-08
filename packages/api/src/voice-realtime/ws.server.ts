import { Server as HTTPServer } from "http";
import { WebSocket, WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

const heartbeat = (socket: WebSocket) => {
  try {
    socket.send(
      JSON.stringify({
        type: "heartbeat",
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("[WS] Failed to send heartbeat:", error);
  }
};

export const initVoiceRealtimeWSS = (server: HTTPServer): WebSocketServer => {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({
    server,
    path: "/realtime",
  });

  wss.on("connection", (socket, req) => {
    const clientAddress = req.socket.remoteAddress ?? "unknown";
    console.log(`[WS] Client connected (${clientAddress})`);

    socket.send(
      JSON.stringify({
        type: "connected",
        message: "Realtime voice channel ready.",
        timestamp: new Date().toISOString(),
      }),
    );

    const interval = setInterval(() => heartbeat(socket), 25000);

    socket.on("message", (raw) => {
      try {
        const payload = typeof raw === "string" ? raw : raw.toString("utf8");
        const data = JSON.parse(payload);
        console.log("[WS] Received message:", data);

        socket.send(
          JSON.stringify({
            type: "ack",
            payload: data,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error("[WS] Failed to handle message:", error);
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Invalid payload",
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    socket.on("close", (code, reason) => {
      clearInterval(interval);
      console.log(
        `[WS] Client disconnected (${clientAddress}) code=${code} reason=${reason.toString()}`,
      );
    });

    socket.on("error", (error) => {
      clearInterval(interval);
      console.error("[WS] Socket error:", error);
    });
  });

  wss.on("error", (error) => {
    console.error("[WS] Server error:", error);
  });

  console.log("[WS] Voice realtime WebSocket server initialized at /realtime");

  return wss;
};

export const getVoiceRealtimeWSS = (): WebSocketServer | null => wss;
