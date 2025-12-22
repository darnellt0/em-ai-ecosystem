# n8n Workflows (Import + Activate)

This folder contains canonical workflows and reusable helpers for the EM-AI Ecosystem.
Canonical workflows live under `canonical/`. Reusable helpers live under `helpers/`.
Legacy copies also exist under `documentation/integrations/n8n` for historical docs; they should point to `packages/ops/n8n/canonical`.

## Canonical Workflows

- `canonical/api_failure_incident_apology.json`
  - Trigger: Webhook (`POST /webhook/voice-failure-hook`)
  - Calls: Execute Workflow -> `helpers/email_notify.workflow.json` (initial failure + follow-up result)
  - Calls: `POST {{$env.API_BASE_URL}}/api/voice/support/follow-up`
  - Requires: `API_BASE_URL`, `EM_ALERT_EMAIL_TO`, `EM_N8N_ENV`
  - Notes: If your API requires auth, pass `voiceApiToken` in the webhook payload.

## Helpers

- `helpers/email_notify.workflow.json`
  - Trigger: Execute Workflow (sub-workflow)
  - Reads: `title`, `message`, `meta`
  - Sends: Gmail email to `{{$env.EM_ALERT_EMAIL_TO}}`
  - Noops when `EM_ALERT_EMAIL_TO` is missing or invalid; returns `notified=true/false`
  - Requires: Gmail credentials configured in n8n (OAuth2 recommended)

## Other Workflows

- `voice_to_api_to_dashboard.json`
  - Trigger: Webhook (`POST /webhook/voice-hook`)
  - Calls: `POST {{$env.API_BASE_URL}}/api/voice/{{ $json.endpoint }}`
  - Calls: `POST {{$env.DASHBOARD_BASE_URL}}/api/ingest`
  - Requires: `VOICE_API_TOKEN`, `API_BASE_URL`, `DASHBOARD_BASE_URL`

- `p0_daily_focus_to_p1_action_pack.json`
  - Trigger: Cron (weekday mornings)
  - Calls: `POST {{$env.API_BASE_URL}}/api/exec-admin/p0/daily-focus`
  - Calls: `POST {{$env.API_BASE_URL}}/api/exec-admin/p1/execute-action-pack`
  - Calls: `GET {{$env.API_BASE_URL}}/em-ai/exec-admin/p0/runs/{{runId}}`
  - Calls: Execute Workflow -> `helpers/email_notify.workflow.json` (run status)
  - Requires: `API_BASE_URL`, `EM_ALERT_EMAIL_TO`, optional `P0_USER_ID`

All workflows are **inactive** by default on import.

## Import Steps

1) Open n8n at `http://localhost:5679`
2) Set timezone to `America/Los_Angeles` (Settings -> Personal)
3) Import helper workflows from `packages/ops/n8n/helpers`
4) Import canonical workflows from `packages/ops/n8n/canonical`
5) Import other workflows from `packages/ops/n8n`
6) Open workflows that use Execute Workflow and select the `Email Notify Helper` (if not auto-selected)
7) Confirm the workflows stay inactive

## Migration Note

- If you previously imported `slack_notify`, delete it in n8n. All notifications are email-only now.

## API Base URL (Host vs Docker)

- Host-run API: `http://localhost:3000`
- Docker (Mac/Windows): `http://host.docker.internal:3000`
- Docker Compose service: `http://api:3000`

Set these in n8n:
- `API_BASE_URL`
- `DASHBOARD_BASE_URL` (if using the dashboard ingest node)
- `VOICE_API_TOKEN` (for Voice API workflows)
- `EM_ALERT_EMAIL_TO` (comma-separated)
- `EM_N8N_ENV` (`local`, `staging`, or `prod`)
- `P0_USER_ID` (optional, defaults to `local-dev`)

## First-Run Checklist

1) `npm run n8n:check`
2) Open each workflow and use "Execute workflow" manually
3) Only then toggle "Active"

## Troubleshooting

- ECONNREFUSED: use `host.docker.internal` or the docker service name.
- Wrong schedule times: verify n8n timezone is `America/Los_Angeles`.
- Auth failures: confirm the webhook payload includes `voiceApiToken` when required.
