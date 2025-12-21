# Voice Commands Documentation

## Overview

The `/api/voice/turn` endpoint provides a unified interface for voice-driven commands. All commands are recorded in run history and can be retrieved via the appropriate endpoints.

## Journal Commands

Journal commands via `/api/voice/turn` are executed using the canonical journal execution path, ensuring that all journal interactions are properly recorded and can be retrieved later.

### Supported Journal Intents

1. **Daily Reflection**
   - Trigger phrases: "daily reflection", "daily journal", "morning reflection", "start day reflection"
   - Intent: `journal.daily_reflection`
   - Returns: Daily reflection prompts

2. **Midday Check-in**
   - Trigger phrases: "midday check in", "midday check-in", "afternoon check", "midday reflection"
   - Intent: `journal.midday_check_in`
   - Returns: Midday check-in prompts

3. **Day Close**
   - Trigger phrases: "day close", "end of day reflection", "evening reflection", "close out day"
   - Intent: `journal.day_close`
   - Returns: Day close reflection prompts

### Run History

All journal commands executed via `/api/voice/turn` are:
- **Recorded** in the p0 run history system
- **Assigned** a UUID runId (not timestamp-based)
- **Retrievable** via `GET /api/exec-admin/p0/journal/runs`
- **Persisted** to filesystem at `.data/runs/<runId>.json`

### Response Format

```json
{
  "status": "ok",
  "transcript": "daily reflection",
  "assistant": {
    "kind": "result",
    "text": "Here are your daily reflection prompts:\n\n1. What am I grateful for today?\n2. What is my primary focus?\n...",
    "runId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "artifact": {
      "intent": "journal.daily_reflection",
      "date": "2025-12-20",
      "user": "darnell",
      "prompts": [
        "What am I grateful for today?",
        "What is my primary focus?",
        "How do I want to show up today?",
        "What would make today great?"
      ],
      "responses": [],
      "insights": [],
      "nextSteps": [],
      "mood": null,
      "values": null
    },
    "metadata": {
      "route": "deterministic",
      "complexity": "simple",
      "intent": "journal-daily-reflection",
      "latency": 150,
      "cost": 0
    }
  }
}
```

### Key Response Fields

- **`assistant.runId`**: UUID assigned by p0RunHistory service (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **`assistant.artifact`**: Complete journal artifact with prompts, responses, insights (for UI rendering)
- **`assistant.metadata`**: Routing metadata (route type, complexity, intent, latency, cost)

### Retrieving Journal Run History

```bash
# List all journal runs (default limit: 20)
curl http://localhost:3000/api/exec-admin/p0/journal/runs

# List with custom limit
curl "http://localhost:3000/api/exec-admin/p0/journal/runs?limit=50"

# Get specific run by UUID
curl http://localhost:3000/api/exec-admin/p0/journal/runs/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Implementation Details

### Canonical Execution Path

Journal commands via `/api/voice/turn` use the same execution path as direct exec-admin calls:

1. **Voice Turn Router** → receives user text/audio
2. **Hybrid Router Service** → detects journal intent
3. **Journal Execution Service** (`journal-execution.service.ts`) → canonical execution
4. **P0 Run History Service** → records run with UUID
5. **Journal Agent** → generates prompts
6. **Response** → returns to user with UUID and artifact

This ensures consistency across all journal execution entry points:
- `POST /api/voice/turn` (voice interface)
- `POST /api/exec-admin/p0/journal/run` (direct API)

### Architecture Benefits

1. **Single Source of Truth**: All journal executions use `executeJournalWithHistory()`
2. **Consistent Run IDs**: UUID format from p0RunHistory, not timestamps
3. **Proper Persistence**: All runs recorded to `.data/runs/` directory
4. **Unified Retrieval**: Same GET endpoints work for all journal executions
5. **Error Handling**: Consistent fallback to placeholder prompts on failure

## Testing

### Manual Testing (PowerShell)

```powershell
# Test voice turn with daily reflection
$body = '{"user":"darnell","text":"daily reflection"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/voice/turn" -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
Write-Host $response

# Extract runId and verify it's a UUID
$runId = ($response | ConvertFrom-Json).assistant.runId
Write-Host "RunId: $runId"

# Verify run was recorded in history
$runs = Invoke-RestMethod -Uri "http://localhost:3000/api/exec-admin/p0/journal/runs"
Write-Host ($runs | ConvertTo-Json -Depth 10)
```

### Automated Testing

```bash
# Run voice turn router tests
npm test -- voiceTurn.router.spec.ts

# Expected: All tests pass with UUID format validation
```

## Troubleshooting

### RunId is timestamp instead of UUID
- **Cause**: Journal execution not using canonical service
- **Fix**: Ensure `HybridRouterService` calls `executeJournalWithHistory()`, not `runJournalAgent()` directly

### Runs not appearing in GET /api/exec-admin/p0/journal/runs
- **Cause**: Run history not being written to filesystem
- **Fix**: Check `.data/runs/` directory exists and is writable
- **Check**: Verify `startP0ArtifactRun()` and `finalizeP0ArtifactRun()` are being called

### Artifact missing from response
- **Cause**: Response format mismatch
- **Fix**: Ensure response includes `assistant.artifact` (not `assistant.metadata.artifact`)

## Related Endpoints

- **Voice Turn**: `POST /api/voice/turn` - Unified voice command endpoint
- **Journal Run (Direct)**: `POST /api/exec-admin/p0/journal/run` - Direct journal execution
- **List Runs**: `GET /api/exec-admin/p0/journal/runs` - Retrieve run history
- **Get Run**: `GET /api/exec-admin/p0/journal/runs/:runId` - Get specific run details

## Version History

- **2025-12-20**: Unified journal execution with canonical run history path
  - Added `journal-execution.service.ts` as single source of truth
  - Updated voice turn to use p0RunHistory with UUID runIds
  - Standardized artifact placement in response (assistant.artifact)
