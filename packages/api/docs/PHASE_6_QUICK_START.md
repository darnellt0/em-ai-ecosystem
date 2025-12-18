# Phase 6 Quick Start (Growth Agents + Voice)

## What Phase 6 Includes
- 10 growth agents: journal, niche, mindset, rhythm, purpose, growth.journal, growth.niche, growth.mindset, growth.rhythm, growth.purpose.
- Orchestrator endpoints:
  - GET /api/orchestrator/health
  - GET /api/orchestrator/readiness
  - POST /api/orchestrator/launch
  - GET /api/orchestrator/monitor
  - GET /api/orchestrator/monitor/latest?agent=...&limit=...
- Journal → growth.journal integration:
  - POST /em-ai/agents/journal/run
  - Validates founderEmail + prompt, enqueues growth.journal.
- Exec Admin Growth Pack:
  - POST /em-ai/exec-admin/growth/run
  - GET /em-ai/exec-admin/growth/status
- Voice intent:
  - intent: "growth_check_in" (triggers Exec Admin Growth Pack; voice-friendly response)
- Integrated Daily Growth Brief (optional):
  - Flags: INCLUDE_GROWTH_IN_DAILY_BRIEF=true, GROWTH_DAILY_BRIEF_MODE=summary|full
  - When enabled, the Daily Brief email embeds a snapshot of the latest Growth Pack run (agents launched, last run time, recent highlights).
  - Fails gracefully if no growth data is available.

## Run Everything Locally
```powershell
cd packages/api
npm run dev   # API on http://localhost:4000 (or docker-compose up em-api)

cd ../dashboard
# set PORT=3001 to avoid API port; defaults to 3000
npm run dev   # Dashboard on http://localhost:3000 (or 3001 if set)
```

### Growth Dashboard (Frontend)
- URL: http://localhost:3000/agents/growth
- Features: Run Growth Pack, see status/progress/events (polls /em-ai/exec-admin/growth/status).

### Phase 6 QA Script
```powershell
cd packages/api
npm run phase6:qa
```
Prints health/launch/status summaries; exits non-zero on failure.

## API Usage Examples (PowerShell)
### Orchestrator Health
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/orchestrator/health" -Method Get |
  ConvertTo-Json -Depth 10
```

### Run Exec Admin Growth Pack
```powershell
$body = @{
  founderEmail = "shria@elevatedmovements.com"
  mode         = "full"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:4000/em-ai/exec-admin/growth/run" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 10
```

### Orchestrator Monitor (best effort runId filtering)
```powershell
# By agent
Invoke-RestMethod -Uri "http://localhost:4000/api/orchestrator/monitor/latest?agent=growth.journal&limit=10"

# By runId (prefers runId when present in progress/events; falls back to agent matching otherwise)
Invoke-RestMethod -Uri "http://localhost:4000/api/orchestrator/monitor/latest?runId=<runId>&limit=10"
```

### Run History + Summary + Retry
```powershell
# List recent runs
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/growth/runs?founderEmail=shria@elevatedmovements.com&limit=5"

# Get summary for a runId
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/growth/runs/<runId>/summary"

# Retry failed agents (requires ENABLE_GROWTH_RETRY=true)
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/growth/runs/<runId>/retry" -Method Post

# Finalize terminal state (complete/failed)
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/growth/runs/<runId>/finalize" -Method Post
```

Env flags:
- ENABLE_GROWTH_RETRY=true to allow retry endpoint (default disabled)
- ENABLE_GROWTH_FINALIZER=true to enable background finalizer (optional)

### Call the Voice Intent (growth_check_in)
```powershell
$body = @{
  intent   = "growth_check_in"
  metadata = @{
    founderEmail = "shria@elevatedmovements.com"
    mode         = "full"
  }
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/voice/intent" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 10
```

## Voice + TTS Notes
- "growth_check_in" is designed for voice clients (HeyGen/ElevenLabs):
  - Transcribe → decide intent → POST /api/voice/intent with intent="growth_check_in".
  - Read the `message` field back as synthesized speech.

## Dashboard Links
- Growth Dashboard: http://localhost:3000/agents/growth (or http://localhost:3001/agents/growth if PORT is set)

## Orchestrator + Growth Pack Summary
- Launch all growth agents via orchestrator or Exec Admin Growth Pack.
- Monitor progress/events with /api/orchestrator/monitor and /monitor/latest.
