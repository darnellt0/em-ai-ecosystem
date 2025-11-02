# Voice API Testing Guide

This document provides cURL commands to verify all 6 Voice API endpoints work correctly.

## Prerequisites

1. **Set your token**: Export the bearer token for requests:
   ```bash
   export VOICE_API_TOKEN="<your-token-from-.env>"
   ```

2. **Verify API is running**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Timestamps**: For endpoints requiring ISO 8601 dates, use:
   ```bash
   date -u +"%Y-%m-%dT%H:%M:%S.000Z"  # macOS/Linux
   powershell "[datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.000Z')"  # Windows
   ```

---

## Endpoint 1: Block Focus Time

**Purpose**: Create a focus block on the calendar.

**Endpoint**: `POST /api/voice/scheduler/block`

**Payload**:
- `minutes` (1-240, required): Duration of focus block
- `reason` (optional): Why you're blocking focus
- `bufferMinutes` (0-60, default=10): Buffer before block starts
- `startAtISO` (optional): When to start (default: now)
- `founder` (darnell|shria, default=shria): Whose calendar

**Basic Test**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```

**With Reason**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 90,
    "reason": "Deep work on Q4 strategy",
    "bufferMinutes": 15,
    "founder": "darnell"
  }'
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Blocked 45 minutes for focus on [date] (Deep work on Q4 strategy).",
  "nextBestAction": "Silence notifications during this time.",
  "data": {
    "founderEmail": "shria",
    "blockStart": "2025-11-01T18:00:00.000Z",
    "blockEnd": "2025-11-01T18:45:00.000Z",
    "reason": "Deep work on Q4 strategy",
    "bufferMinutes": 15
  }
}
```

---

## Endpoint 2: Confirm Meeting

**Purpose**: Add or confirm a meeting on the calendar.

**Endpoint**: `POST /api/voice/scheduler/confirm`

**Payload**:
- `title` (≥2 chars, required): Meeting title
- `startAtISO` (ISO 8601, required): Meeting start time
- `durationMinutes` (1-480, required): Meeting duration
- `location` (optional): Physical or virtual location
- `founder` (darnell|shria, default=shria): Whose calendar

**Basic Test**:
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Emerging Leaders Prep\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 60,
    \"founder\": \"shria\"
  }"
```

**With Location**:
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Board Strategy Session\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 90,
    \"location\": \"Zoom: zoom.us/j/123456\",
    \"founder\": \"darnell\"
  }"
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Added \"Emerging Leaders Prep\" to calendar on [date] for 60 minutes.",
  "nextBestAction": "Send meeting link to Zoom participants.",
  "data": {
    "founderEmail": "shria",
    "eventTitle": "Emerging Leaders Prep",
    "eventStart": "2025-11-01T18:00:00.000Z",
    "eventEnd": "2025-11-01T19:00:00.000Z",
    "location": "Zoom"
  }
}
```

---

## Endpoint 3: Reschedule Meeting

**Purpose**: Move an existing meeting to a new time.

**Endpoint**: `POST /api/voice/scheduler/reschedule`

**Payload**:
- `eventId` (≥3 chars, required): Calendar event ID to reschedule
- `newStartAtISO` (ISO 8601, required): New start time
- `newDurationMinutes` (1-480, required): New duration
- `founder` (darnell|shria, default=shria): Whose calendar

**Test**:
```bash
FUTURE=$(date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%S.000Z")  # 2 hours from now
curl -X POST http://localhost:3000/api/voice/scheduler/reschedule \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"evt-2025-nov-01-strategy\",
    \"newStartAtISO\": \"$FUTURE\",
    \"newDurationMinutes\": 45,
    \"founder\": \"shria\"
  }"
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Rescheduled event evt-2025-nov-01-strategy to [date] for 45 minutes.",
  "nextBestAction": "Attendees will be notified of the change.",
  "data": {
    "founderEmail": "shria",
    "eventId": "evt-2025-nov-01-strategy",
    "newStart": "2025-11-01T20:00:00.000Z",
    "newEnd": "2025-11-01T20:45:00.000Z"
  }
}
```

---

## Endpoint 4: Start Pause / Meditation

**Purpose**: Begin a guided pause or meditation exercise.

**Endpoint**: `POST /api/voice/coach/pause`

**Payload**:
- `style` (breath|box|grounding|body-scan, default=grounding): Type of pause
- `seconds` (1-300, default=60): Duration of pause
- `founder` (darnell|shria, default=shria): Whose voice profile

**Basic Test** (default grounding for 60s):
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"founder": "shria"}'
```

**Box Breathing**:
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"style": "box", "seconds": 120, "founder": "darnell"}'
```

**Body Scan Meditation**:
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"style": "body-scan", "seconds": 300, "founder": "shria"}'
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Starting a 60s grounding meditation for you now.",
  "nextBestAction": "Find a quiet space and follow the voice guidance.",
  "data": {
    "founderEmail": "shria",
    "pauseStyle": "grounding",
    "pauseDurationSeconds": 60
  }
}
```

---

## Endpoint 5: Log Task Complete

**Purpose**: Mark a task as done and optionally record completion notes.

**Endpoint**: `POST /api/voice/support/log-complete`

**Payload**:
- `taskId` (≥2 chars, required): Task identifier
- `note` (optional): Completion notes or reflection
- `founder` (darnell|shria, default=shria): Whose task

**Simple Test**:
```bash
curl -X POST http://localhost:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-quarterly-review",
    "founder": "shria"
  }'
```

**With Notes**:
```bash
curl -X POST http://localhost:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-budget-analysis",
    "note": "Completed early. Found 15% cost savings in cloud spend.",
    "founder": "darnell"
  }'
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Marked task task-quarterly-review as complete. Noted: \"Great work on this!\"",
  "nextBestAction": "Great work! Review related pending tasks?",
  "data": {
    "founderEmail": "shria",
    "taskId": "task-quarterly-review",
    "completedAt": "2025-11-01T18:30:45.000Z",
    "note": "Great work on this!"
  }
}
```

---

## Endpoint 6: Create Follow-up

**Purpose**: Create a follow-up task or reminder for later action.

**Endpoint**: `POST /api/voice/support/follow-up`

**Payload**:
- `subject` (≥2 chars, required): What to follow up on
- `dueISO` (ISO 8601, optional): When to follow up (default: not set)
- `context` (optional): Additional background
- `founder` (darnell|shria, default=shria): Whose task list

**Basic Test**:
```bash
curl -X POST http://localhost:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Call investor relations",
    "founder": "shria"
  }'
```

**With Due Date**:
```bash
DUE=$(date -u -d "+1 day" +"%Y-%m-%dT09:00:00.000Z")  # Tomorrow at 9am
curl -X POST http://localhost:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"Q4 Roadmap Review with Product Team\",
    \"dueISO\": \"$DUE\",
    \"context\": \"Discuss feature priorities and resource allocation for Q1.\",
    \"founder\": \"darnell\"
  }"
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Created follow-up: \"Call investor relations\". Due 2025-11-02T09:00:00.000Z.",
  "nextBestAction": "You will get a reminder at the due time.",
  "data": {
    "founderEmail": "shria",
    "followUpSubject": "Call investor relations",
    "dueAt": "2025-11-02T09:00:00.000Z",
    "context": "Discuss Q4 strategy.",
    "createdAt": "2025-11-01T18:30:45.000Z"
  }
}
```

---

## Testing Idempotency

Idempotency ensures that identical requests with the same `Idempotency-Key` return the same response, even if called multiple times.

**Test**:
```bash
KEY="idempotency-demo-$(date +%s)"

# First request
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  -w "\n%{http_code}\n"

# Second request with same key (should return identical response)
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  -w "\n%{http_code}\n"
```

**Expected**: Both responses are identical with HTTP 200.

---

## Testing Authentication

**Missing Token**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Content-Type: application/json" \
  -d '{"minutes": 30, "founder": "shria"}'
```

**Expected Response** (401 Unauthorized):
```json
{
  "status": "error",
  "humanSummary": "Unauthorized: invalid or missing bearer token.",
  "nextBestAction": "Verify token and retry."
}
```

**Invalid Token**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 30, "founder": "shria"}'
```

**Expected Response** (401 Unauthorized).

---

## Testing Validation

**Missing Required Field**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Meeting"}'
```

**Expected Response** (400 Bad Request):
```json
{
  "status": "error",
  "humanSummary": "Invalid request: startAtISO: Invalid ISO string; durationMinutes: Required",
  "nextBestAction": "Check payload and retry."
}
```

**Invalid Data Type**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": "not-a-number", "founder": "shria"}'
```

**Expected Response** (400 Bad Request).

---

## Testing Rate Limiting

The voice API enforces **20 requests per 10 seconds per IP**.

**Burst Test** (will hit 429 limit):
```bash
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/voice/scheduler/block \
    -H "Authorization: Bearer $VOICE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"minutes": 5, "founder": "shria"}' \
    -w " [HTTP %{http_code}]\n" \
    -s
done
```

**Expected**: First 20 return 200, remaining return 429.

---

## Integration Testing Script

Save this as `test-voice-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TOKEN="${VOICE_API_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: VOICE_API_TOKEN env var not set"
  exit 1
fi

echo "🔍 Voice API Integration Tests"
echo "================================"

# Test 1: Block Focus
echo ""
echo "✓ Test 1: Block Focus"
curl -s -X POST "$API_URL/api/voice/scheduler/block" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}' | jq '.'

# Test 2: Confirm Meeting
echo ""
echo "✓ Test 2: Confirm Meeting"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
curl -s -X POST "$API_URL/api/voice/scheduler/confirm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Test Meeting\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  | jq '.'

# Test 3: Pause
echo ""
echo "✓ Test 3: Start Pause"
curl -s -X POST "$API_URL/api/voice/coach/pause" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"style": "grounding", "seconds": 60, "founder": "shria"}' | jq '.'

# Test 4: Auth failure
echo ""
echo "✓ Test 4: Auth Failure (expected)"
curl -s -X POST "$API_URL/api/voice/scheduler/block" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 30, "founder": "shria"}' | jq '.'

echo ""
echo "✅ All tests completed!"
```

**Run it**:
```bash
chmod +x test-voice-api.sh
./test-voice-api.sh
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify `VOICE_API_TOKEN` is set and correct |
| 500 Server Error | Check API server logs: `docker logs em-api` |
| 429 Rate Limited | Wait 10 seconds then retry; check IP-based limits |
| Validation errors | Review required fields in payload; use `jq` to format JSON |
| 404 Not Found | Verify endpoint path; check router mounted correctly |

---

## Next Steps

1. **Import n8n Workflows**: Upload the two JSON workflow files to your n8n instance
2. **Wire Real Agents**: Replace TODO comments in `voice.services.ts` with actual agent calls
3. **Test Dashboard Ingest**: Verify dashboard receives voice events at `POST /api/ingest`
4. **Monitor Logs**: Watch `docker logs em-api` for successful request traces
5. **Production HTTPS**: Ensure Caddy enforces HTTPS for `/api/voice/*` routes
