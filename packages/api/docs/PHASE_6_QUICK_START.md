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

## Run Everything Locally
```powershell
cd packages/api
npm run dev   # API on http://localhost:4000

cd ../dashboard
npm run dev   # Dashboard on http://localhost:3000
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
- Growth Dashboard: http://localhost:3000/agents/growth

## Orchestrator + Growth Pack Summary
- Launch all growth agents via orchestrator or Exec Admin Growth Pack.
- Monitor progress/events with /api/orchestrator/monitor and /monitor/latest.
