# n8n Workflows (Import + Activate)

This folder contains the canonical n8n workflow exports for the EM-AI Ecosystem.
Legacy copies also exist under `documentation/integrations/n8n` for historical docs.

## Workflow Structure

### Helpers (Shared Sub-Workflows)
Located in `helpers/`. These are reusable building blocks called by canonical workflows.

- `http_call_api.workflow.json` - Make HTTP calls to EM-AI API with consistent error handling
- `email_notify.workflow.json` - Send email notifications via Gmail with environment prefixes
- `dedupe_alert.workflow.json` - Prevent alert spam with cooldown-based deduplication
- `format_health_email.workflow.json` - Format healthcheck/watchdog alerts into email content

### Canonical Workflows (P0 & Ops)
Located in `canonical/p0/` and `canonical/ops/`. These orchestrate the business logic.

#### P0 Daily Brief
- `canonical/p0/daily_brief_weekday.workflow.json`
  - **Trigger**: Cron weekday 7:30 AM Pacific (DISABLED by default)
  - **What**: Runs P0 Daily Focus automation and emails results
  - **Requires**: `EM_API_BASE_URL`, `EM_DAILY_BRIEF_EMAIL_TO`, `EM_N8N_ENV`, `P0_USER_ID` (optional)

#### Ops Watchdogs
- `canonical/ops/healthcheck_api.workflow.json`
  - **Trigger**: Every 5 minutes (DISABLED by default)
  - **What**: Monitors `/api/system/health` endpoint, sends alerts on failure
  - **Requires**: `EM_API_BASE_URL`, `EM_ALERT_EMAIL_TO`, `EM_N8N_ENV`, `EM_WATCHDOG_COOLDOWN_MINUTES`

- `canonical/ops/run_sanity.workflow.json`
  - **Trigger**: Every 15 minutes (DISABLED by default)
  - **What**: Detects stuck runs (>30min in running state), sends alerts
  - **Requires**: `EM_API_BASE_URL`, `EM_ALERT_EMAIL_TO`, `EM_N8N_ENV`

### Legacy Workflows
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

## Import Order

Import workflows in this order to satisfy dependencies:

1. **Helpers first** (can be imported in any order):
   - `helpers/http_call_api.workflow.json`
   - `helpers/email_notify.workflow.json`
   - `helpers/dedupe_alert.workflow.json`
   - `helpers/format_health_email.workflow.json`

2. **Email automation** (if using):
   - `canonical/email/gmail_triage_router.workflow.json`
   - `canonical/email/agent_*.workflow.json` (all category agents)

3. **P0 & Ops canonical workflows**:
   - `canonical/p0/daily_brief_weekday.workflow.json`
   - `canonical/ops/healthcheck_api.workflow.json`
   - `canonical/ops/run_sanity.workflow.json`

4. **Legacy workflows** (optional):
   - `voice_to_api_to_dashboard.json`
   - `api_failure_incident_apology.json`
   - `p0_daily_focus_to_p1_action_pack.json`

## Setup Steps

### 1. Open n8n
```bash
npm run n8n  # or access via http://localhost:5679
```

### 2. Set Timezone
Settings → Personal → Timezone → `America/Los_Angeles`

### 3. Create Credentials

#### Gmail OAuth2 (Required for all email workflows)
1. Credentials → New Credential → Gmail OAuth2 API
2. Follow OAuth flow to authorize your Gmail account
3. Save with name: "Gmail OAuth2"

### 4. Set Environment Variables

Click Settings → Environment Variables, then add:

#### Required for All Workflows
```bash
EM_API_BASE_URL=http://host.docker.internal:3000  # or http://localhost:3000 if running API on host
EM_N8N_ENV=local  # or 'staging' or 'prod'
```

#### Required for P0 Daily Brief
```bash
EM_DAILY_BRIEF_EMAIL_TO=your-email@example.com
P0_USER_ID=local-dev  # optional, defaults to 'local-dev'
```

#### Required for Ops Watchdogs
```bash
EM_ALERT_EMAIL_TO=your-email@example.com
EM_WATCHDOG_COOLDOWN_MINUTES=60  # optional, defaults to 60
```

#### Legacy Workflow Env Vars (if using)
```bash
API_BASE_URL=http://host.docker.internal:3000
DASHBOARD_BASE_URL=http://localhost:3001
VOICE_API_TOKEN=your-token-here
SLACK_WEBHOOK_URL=https://hooks.slack.com/...  # optional
```

### 5. Import Workflows
1. Workflow → Import from File
2. Select JSON file from the import order above
3. Confirm workflow stays **inactive** (disabled trigger)
4. Repeat for all workflows

### 6. Test Manually
Before activating any scheduled workflow:

1. Open the workflow
2. Click "Execute workflow" button (manual trigger)
3. Verify execution completes successfully
4. Check email inbox for expected notifications

### 7. Activate Workflows
Only activate workflows after successful manual testing:

1. Open workflow
2. Toggle "Active" switch in top-right
3. Confirm schedule/trigger is correct

## API Base URL Options

Choose based on your n8n deployment:

- **n8n in Docker, API on host**: `http://host.docker.internal:3000`
- **Both on host**: `http://localhost:3000`
- **Docker Compose (same network)**: `http://api:3000`

## Environment Prefix Behavior

All emails sent by `helpers/email_notify.workflow.json` include an environment prefix in the subject:

- `local` → `[LOCAL] Your Subject`
- `staging` → `[STAGING] Your Subject`
- `prod` → `[PROD] Your Subject`

This helps identify which environment sent the alert.

## Testing Checklist

### Test Helpers (one-time)
1. Test `http_call_api`: Execute manually, verify it can reach your API
2. Test `email_notify`: Execute manually with test subject/body, check your inbox
3. Test `dedupe_alert`: Execute twice rapidly, second should return `shouldSend: false`

### Test P0 Daily Brief
1. Ensure API is running
2. Execute `canonical/p0/daily_brief_weekday.workflow.json` manually
3. Verify email arrives at `EM_DAILY_BRIEF_EMAIL_TO`
4. Check email contains run ID, QA status, timestamp

### Test Ops Watchdogs
#### Healthcheck (healthy scenario)
1. Ensure API is running
2. Execute `canonical/ops/healthcheck_api.workflow.json` manually
3. Verify no alert email sent (API healthy)

#### Healthcheck (failure scenario)
1. Stop your API
2. Execute workflow manually
3. Verify alert email arrives at `EM_ALERT_EMAIL_TO`
4. Start API
5. Execute again → verify recovery email sent

#### Run Sanity
1. Ensure API is running with recent successful runs
2. Execute `canonical/ops/run_sanity.workflow.json` manually
3. Verify no alert (no stuck runs)

## Troubleshooting

### ECONNREFUSED errors
- n8n in Docker cannot reach `localhost:3000`
- Solution: Use `host.docker.internal:3000` for `EM_API_BASE_URL`

### Wrong schedule times
- Workflow executing at wrong hour
- Solution: Verify n8n timezone is `America/Los_Angeles` in Settings

### Email not sending
- Gmail OAuth not authorized
- Solution: Re-create "Gmail OAuth2" credential and complete OAuth flow

### Alert spam
- Getting too many duplicate alerts
- Solution: Increase `EM_WATCHDOG_COOLDOWN_MINUTES` (default 60)

### Execute Workflow node fails
- "Workflow not found" error
- Solution: Ensure helper workflows are imported first, names match exactly

### API calls failing
- 401/403 errors
- Solution: Check if your API requires authentication headers (add to `http_call_api` if needed)

## Advanced: Customizing Alerts

### Change alert cooldown per workflow
Edit the canonical workflow's "Check Dedupe" node:
```json
{
  "name": "cooldownMinutes",
  "value": 120  // 2 hours instead of default 60
}
```

### Change stuck run threshold
Edit `canonical/ops/run_sanity.workflow.json` → "Analyze Runs" node:
```javascript
const STUCK_THRESHOLD_MINUTES = 45;  // Default is 30
```

### Disable recovery emails
Remove the "Check Recovery Dedupe" → "Format Recovery Email" → "Send Recovery Email" branch from watchdog workflows.

## File Inventory

```
packages/ops/n8n/
├── README.md (this file)
├── EMAIL_AUTOMATION_README.md (email triage docs)
├── helpers/
│   ├── http_call_api.workflow.json
│   ├── email_notify.workflow.json
│   ├── dedupe_alert.workflow.json
│   └── format_health_email.workflow.json
├── canonical/
│   ├── p0/
│   │   └── daily_brief_weekday.workflow.json
│   ├── ops/
│   │   ├── healthcheck_api.workflow.json
│   │   └── run_sanity.workflow.json
│   └── email/
│       ├── gmail_triage_router.workflow.json
│       ├── agent_internal.workflow.json
│       ├── agent_support.workflow.json
│       ├── agent_promotions.workflow.json
│       ├── agent_finance.workflow.json
│       └── agent_sales.workflow.json
└── [legacy workflows]
    ├── voice_to_api_to_dashboard.json
    ├── api_failure_incident_apology.json
    └── p0_daily_focus_to_p1_action_pack.json
```
