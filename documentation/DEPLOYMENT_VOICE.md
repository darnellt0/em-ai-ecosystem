# Voice Realtime Deployment Playbook

This runbook documents how to roll out, monitor, and quickly disable the realtime voice feature in production.

## 1. Pre-deployment checklist

1. **Container image** – build the API image from `Dockerfile.api` to ensure the realtime code and metrics are compiled into `packages/api`.
2. **Environment variables** – confirm the following variables are present in the runtime environment:
   - `VOICE_API_TOKEN`
   - `VOICE_WS_TOKEN`
   - `VOICE_ENABLED` (defaults to `true`)
   - `STT_PROVIDER`, `TTS_PROVIDER`, and `PROVIDER_KEYS`
3. **Secrets sync** – rotate the websocket token before rollout if it has ever been shared with third parties.
4. **Health checks** – verify that `GET /health` and `GET /health/voice` succeed in staging.
5. **Smoke test** – run `./scripts/e2e-voice.sh` locally or in CI to validate websocket handshakes.

## 2. Canary rollout steps

1. **Deploy to the canary slice** (single pod / host) with `VOICE_ENABLED=true` and the new websocket token.
2. **Monitor health**
   - Hit `GET /health/voice` and confirm `{ "ws": true, "clients": 0 }`.
   - Check `/api/metrics` (JSON or `?format=prom`) to confirm counters increment when test traffic arrives.
3. **Generate sample traffic** – run the smoke script against the canary instance:
   ```bash
   PORT=<canary-port> VOICE_WS_TOKEN=<token> ./scripts/e2e-voice.sh
   ```
4. **Dashboards & logs** – watch the realtime dashboard or logs for `voice-welcome`, `pong`, and `ack` events.
5. **Promote to 25/50/100%** – expand the deployment in stages once the canary remains healthy for at least 15 minutes.

## 3. Rollback plan

1. **Immediate kill switch** – set `VOICE_ENABLED=false` and reload the process. HTTP routes will begin returning `503` while the rest of the API stays online.
2. **Websocket revocation** – rotate `VOICE_WS_TOKEN` to invalidate existing clients and prevent reconnection attempts.
3. **Container rollback** – redeploy the previous API image if the issue is code-related.
4. **Postmortem** – capture `/api/metrics` output and relevant logs before recycling hosts so we can debug offline.

## 4. Operational tips

- `/api/metrics?format=prom` emits counters compatible with Prometheus/Grafana.
- The health endpoint returns the last websocket error (if any) which is useful when diagnosing TLS or token problems.
- Keep the smoke script in CI (see `e2e-voice-smoke` job) to prevent regressions before deploy.
