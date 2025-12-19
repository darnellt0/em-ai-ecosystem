# P0 Daily Focus (Exec Admin Front Door)

Canonical intent: `p0.daily_focus`

## Endpoints
- POST `/api/exec-admin/p0/daily-focus`
  - Body: `{ "userId": "shria@elevatedmovements.com", "mode": "founder" }`
  - Returns: `success`, `intent`, `runId`, `data.qa`, `data.actionPack` (version `p0.v1`)
- GET `/em-ai/exec-admin/p0/runs?founderEmail=...&limit=10`
- GET `/em-ai/exec-admin/p0/runs/:runId`

## Response contract (additive)
```json
{
  "success": true,
  "intent": "p0.daily_focus",
  "runId": "...",
  "data": {
    "qa": { "passed": true, "blocked": false, "status": "PASS", "reasons": [] },
    "actionPack": {
      "version": "p0.v1",
      "date": "YYYY-MM-DD",
      "founderEmail": "...",
      "summary": "...",
      "priorities": [],
      "tasks": [],
      "scheduleBlocks": [],
      "status": "ready"
    }
  }
}
```
If QA fails → `qa.blocked=true` and `actionPack.status="blocked"` with `blockers` and `safeNextSteps`.

## Run History (P0)
- Same-day idempotency: same founder/date reuses runId unless `force=true` in request body.
- Stored in Redis if available, otherwise in-memory (resets on restart).

## Safe-by-default
- No side effects (calendar/email/etc.) unless explicitly feature-flagged and QA passed.

## PowerShell examples (API on 4000)
```powershell
# Run P0 Daily Focus
$body = @{ userId = "shria@elevatedmovements.com"; mode = "founder" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/exec-admin/p0/daily-focus" -Method Post -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10

# List runs
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/p0/runs?founderEmail=shria@elevatedmovements.com&limit=5" -Method Get | ConvertTo-Json -Depth 10

# Get run detail
Invoke-RestMethod -Uri "http://localhost:4000/em-ai/exec-admin/p0/runs/<runId>" -Method Get | ConvertTo-Json -Depth 10
```

## Dashboard
- Visit `http://localhost:3000/exec-admin/p0` (set `NEXT_PUBLIC_API_BASE_URL` to point to API, default http://localhost:4000)
