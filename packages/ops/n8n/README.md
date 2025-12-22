# n8n Workflows (Import + Activate)

This folder contains the canonical n8n workflow exports for the EM-AI Ecosystem.
Legacy copies also exist under `documentation/integrations/n8n` for historical docs.

## Workflows

- `voice_to_api_to_dashboard.json`
  - Trigger: Webhook (`POST /webhook/voice-hook`)
  - Calls: `POST {{$env.API_BASE_URL}}/api/voice/{{ $json.endpoint }}`
  - Calls: `POST {{$env.DASHBOARD_BASE_URL}}/api/ingest`
  - Requires: `VOICE_API_TOKEN`, `API_BASE_URL`, `DASHBOARD_BASE_URL`

- `api_failure_incident_apology.json`
  - Trigger: Webhook (`POST /webhook/voice-failure-hook`)
  - Calls: Slack webhook via `{{$env.SLACK_WEBHOOK_URL}}` (optional)
  - Calls: `POST {{$env.API_BASE_URL}}/api/voice/support/follow-up`
  - Requires: `VOICE_API_TOKEN`, `API_BASE_URL`, optional `SLACK_WEBHOOK_URL`

- `p0_daily_focus_to_p1_action_pack.json`
  - Trigger: Cron (weekday mornings)
  - Calls: `POST {{$env.API_BASE_URL}}/api/exec-admin/p0/daily-focus`
  - Calls: `POST {{$env.API_BASE_URL}}/api/exec-admin/p1/execute-action-pack`
  - Calls: `GET {{$env.API_BASE_URL}}/em-ai/exec-admin/p0/runs/{{runId}}`
  - Requires: `API_BASE_URL`, optional `SLACK_WEBHOOK_URL`, optional `P0_USER_ID`

All workflows are **inactive** by default on import.

## Import Steps

1) Open n8n at `http://localhost:5679`
2) Set timezone to `America/Los_Angeles` (Settings → Personal)
3) Import workflow JSON (Workflow → Import from File)
4) Confirm the workflow stays inactive

## API Base URL (Host vs Docker)

- Host-run API: `http://localhost:3000`
- Docker (Mac/Windows): `http://host.docker.internal:3000`
- Docker Compose service: `http://api:3000`

Set these in n8n:
- `API_BASE_URL`
- `DASHBOARD_BASE_URL` (if using the dashboard ingest node)
- `VOICE_API_TOKEN`
- `SLACK_WEBHOOK_URL` (optional)
- `P0_USER_ID` (optional, defaults to `local-dev`)

## First-Run Checklist

1) `npm run n8n:check`
2) Open each workflow and use "Execute workflow" manually
3) Only then toggle "Active"

## Troubleshooting

- ECONNREFUSED: use `host.docker.internal` or the docker service name.
- Wrong schedule times: verify n8n timezone is `America/Los_Angeles`.
- Auth failures: confirm `VOICE_API_TOKEN` in n8n env vars.
