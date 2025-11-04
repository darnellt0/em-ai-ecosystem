#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PORT=${PORT:-3000}
VOICE_API_TOKEN=${VOICE_API_TOKEN:-test-voice-api-token}
VOICE_WS_TOKEN=${VOICE_WS_TOKEN:-test-voice-ws-token}
VOICE_ENABLED=${VOICE_ENABLED:-true}
NODE_ENV=${NODE_ENV:-test}
LOG_LEVEL=${LOG_LEVEL:-info}

cd "${ROOT_DIR}"

npm run build --workspace=@em/api >/dev/null 2>&1

VOICE_API_TOKEN="$VOICE_API_TOKEN" \
VOICE_WS_TOKEN="$VOICE_WS_TOKEN" \
VOICE_ENABLED="$VOICE_ENABLED" \
NODE_ENV="$NODE_ENV" \
LOG_LEVEL="$LOG_LEVEL" \
PORT="$PORT" \
node packages/api/dist/index.js >/tmp/voice-e2e-api.log 2>&1 &
API_PID=$!
trap 'kill "$API_PID" >/dev/null 2>&1 || true' EXIT

node <<'NODE'
const http = require('http');
const { once } = require('events');

const WebSocket =
  typeof global.WebSocket === 'function'
    ? global.WebSocket
    : (() => {
        try {
          return require('ws');
        } catch (error) {
          throw new Error(
            'WebSocket constructor is not available in this Node runtime and the "ws" package is not installed'
          );
        }
      })();

const port = Number(process.env.PORT || 3000);
const token = process.env.VOICE_WS_TOKEN;

async function waitForVoiceHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const payload = await new Promise((resolve, reject) => {
        const req = http.get({ hostname: '127.0.0.1', port, path: '/health/voice', timeout: 2000 }, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (error) {
              reject(error);
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy(new Error('Health check timeout'));
        });
      });

      if (payload && payload.ws === true) {
        return;
      }
    } catch (error) {
      // ignore and retry
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Voice websocket health check timed out');
}

async function run() {
  if (!token) {
    throw new Error('VOICE_WS_TOKEN is required for e2e voice check');
  }

  await waitForVoiceHealth();

  const url = `ws://127.0.0.1:${port}/ws/voice?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);

  await once(ws, 'open');
  const [welcomeEvent] = await once(ws, 'message');
  const welcomePayload = typeof welcomeEvent.data === 'string' ? welcomeEvent.data : welcomeEvent.data.toString();
  const welcome = JSON.parse(welcomePayload);
  if (welcome.type !== 'voice-welcome') {
    throw new Error(`Expected voice-welcome message, received ${welcome.type}`);
  }

  const pingTimestamp = Date.now();
  ws.send(JSON.stringify({ type: 'ping', timestamp: pingTimestamp }));
  const [pongEvent] = await once(ws, 'message');
  const pongPayload = typeof pongEvent.data === 'string' ? pongEvent.data : pongEvent.data.toString();
  const pong = JSON.parse(pongPayload);
  if (pong.type !== 'pong') {
    throw new Error(`Expected pong response, received ${pong.type}`);
  }

  ws.send(JSON.stringify({ type: 'transcript', id: 'e2e', text: 'voice smoke test' }));
  const [ackEvent] = await once(ws, 'message');
  const ackPayload = typeof ackEvent.data === 'string' ? ackEvent.data : ackEvent.data.toString();
  const ack = JSON.parse(ackPayload);
  if (ack.type !== 'ack' || ack.id !== 'e2e') {
    throw new Error('Voice websocket did not acknowledge transcript message');
  }

  ws.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
NODE

echo "Voice realtime smoke test passed"
