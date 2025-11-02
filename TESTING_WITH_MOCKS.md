# Testing Voice API with Mock Responses

The API is running with mock responses that return realistic data. Here's how to test all 6 endpoints.

## Setup

Set these as environment variables or use them in each curl command:

```bash
# API Configuration
API_URL="http://localhost:3000"
API_TOKEN="elevenlabs-voice-secure-token-2025"
CONTENT_TYPE="application/json"

# Optional: For easier testing
FOUNDER_EMAIL_SHRIA="shria@em.com"
FOUNDER_EMAIL_DARNELL="darnell@em.com"
```

For Docker testing, use:
```bash
docker exec em-api node -e "..."  # For Node.js HTTP requests
# OR
docker run --rm --network host curlimages/curl curl ...  # For curl (if available)
```

---

## Endpoint 1: Block Focus Time

**Purpose**: Schedule a focus block (deep work time) on the calendar

**Endpoint**: `POST /api/voice/scheduler/block`

### Basic Example
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 45,
    "founder": "shria"
  }'
```

### With All Optional Fields
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 90,
    "reason": "Deep work on feature development",
    "bufferMinutes": 15,
    "startAtISO": "2025-11-01T14:00:00Z",
    "founder": "darnell"
  }'
```

### Mock Response Example
```json
{
  "status": "ok",
  "humanSummary": "Blocked 45 minutes for focus on 11/1/2025, 9:13:38 PM.",
  "nextBestAction": "Silence notifications during this time.",
  "data": {
    "founderEmail": "shria@em.com",
    "blockStart": "2025-11-01T21:13:38.223Z",
    "blockEnd": "2025-11-01T21:58:38.223Z",
    "bufferMinutes": 10
  }
}
```

### Input Validation Examples

**Missing required field**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"founder": "shria"}'
```
Returns: 400 - "Invalid request: minutes: Required"

**Invalid duration**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 300, "founder": "shria"}'
```
Returns: 400 - "Cannot exceed 240 minutes"

---

## Endpoint 2: Confirm Meeting

**Purpose**: Add a confirmed meeting to the calendar

**Endpoint**: `POST /api/voice/scheduler/confirm`

### Basic Example
```bash
# Get current time in ISO format
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Team Sync\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 60,
    \"founder\": \"shria\"
  }"
```

### Full Example with Location
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Board Meeting\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 120,
    \"location\": \"Conference Room A\",
    \"founder\": \"darnell\"
  }"
```

### Mock Response Example
```json
{
  "status": "ok",
  "humanSummary": "Added \"Team Meeting\" to calendar on 11/1/2025, 9:13:38 PM for 60 minutes.",
  "nextBestAction": "Send calendar invite to attendees.",
  "data": {
    "eventTitle": "Team Meeting",
    "eventTime": "2025-11-01T21:13:38.223Z",
    "durationMinutes": 60,
    "eventId": "evt-a1b2c3d4"
  }
}
```

### Input Validation Examples

**Invalid ISO date**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting",
    "startAtISO": "not-a-date",
    "durationMinutes": 60,
    "founder": "shria"
  }'
```
Returns: 400 - Invalid ISO datetime format

**Duration too long**:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting",
    "startAtISO": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "durationMinutes": 600,
    "founder": "shria"
  }'
```
Returns: 400 - "Cannot exceed 480 minutes (8 hours)"

---

## Endpoint 3: Reschedule Meeting

**Purpose**: Move an existing calendar event to a different time

**Endpoint**: `POST /api/voice/scheduler/reschedule`

### Basic Example
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:3000/api/voice/scheduler/reschedule \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"evt-12345\",
    \"newStartAtISO\": \"$NOW\",
    \"newDurationMinutes\": 45,
    \"founder\": \"darnell\"
  }"
```

### Mock Response Example
```json
{
  "status": "ok",
  "humanSummary": "Rescheduled event evt-123 to 11/1/2025, 9:13:39 PM for 45 minutes.",
  "nextBestAction": "Send updated calendar invite to attendees.",
  "data": {
    "eventId": "evt-123",
    "newStartTime": "2025-11-01T21:13:39.223Z",
    "newEndTime": "2025-11-01T21:58:39.223Z",
    "previousStartTime": "2025-11-01T20:00:00.000Z"
  }
}
```

---

## Endpoint 4: Start Pause / Meditation

**Purpose**: Initiate a guided pause or meditation session

**Endpoint**: `POST /api/voice/coach/pause`

### Available Pause Styles
- `breath` - Box breathing technique
- `box` - 4-4-4-4 box breathing
- `grounding` - 5 senses grounding exercise (default)
- `body-scan` - Progressive body scan meditation

### Basic Example (Uses Defaults)
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "founder": "shria"
  }'
```
Returns: Defaults to grounding style, 60 seconds

### Custom Pause Session
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "body-scan",
    "seconds": 300,
    "founder": "darnell"
  }'
```

### Mock Response Examples

**Grounding (60s)**:
```json
{
  "status": "ok",
  "humanSummary": "Starting a 60s grounding meditation for you now.",
  "nextBestAction": "Focus on your breathing and surroundings.",
  "data": {
    "style": "grounding",
    "durationSeconds": 60,
    "startedAt": "2025-11-01T21:13:40.223Z"
  }
}
```

**Box Breathing (120s)**:
```json
{
  "status": "ok",
  "humanSummary": "Starting a 120s box meditation for you now.",
  "nextBestAction": "Breathe in for 4, hold for 4, out for 4, hold for 4.",
  "data": {
    "style": "box",
    "durationSeconds": 120,
    "startedAt": "2025-11-01T21:13:40.223Z"
  }
}
```

### Input Validation Examples

**Invalid pause style**:
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "invalid-style",
    "seconds": 60,
    "founder": "shria"
  }'
```
Returns: 400 - Invalid pause style (must be: breath, box, grounding, body-scan)

**Duration too long**:
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "seconds": 600,
    "founder": "shria"
  }'
```
Returns: 400 - "Cannot exceed 300 seconds (5 minutes)"

---

## Endpoint 5: Log Task Complete

**Purpose**: Mark a task as complete with optional notes

**Endpoint**: `POST /api/voice/support/log-complete`

### Basic Example
```bash
curl -X POST http://localhost:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-789",
    "founder": "shria"
  }'
```

### With Completion Notes
```bash
curl -X POST http://localhost:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-456-design",
    "note": "Completed UI mockups. Sent to design team for review.",
    "founder": "darnell"
  }'
```

### Mock Response Example
```json
{
  "status": "ok",
  "humanSummary": "Marked task task-789 as complete. Noted: \"Completed successfully\"",
  "nextBestAction": "Mark any dependent tasks as unblocked.",
  "data": {
    "taskId": "task-789",
    "completedAt": "2025-11-01T21:13:41.223Z",
    "notes": "Completed successfully"
  }
}
```

---

## Endpoint 6: Create Follow-Up

**Purpose**: Create a follow-up task or reminder

**Endpoint**: `POST /api/voice/support/follow-up`

### Basic Example
```bash
curl -X POST http://localhost:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Call John Doe",
    "founder": "shria"
  }'
```

### Full Example with Due Date and Context
```bash
DUE_DATE=$(date -u -d "+2 days" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+2d +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST http://localhost:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"Review Q4 planning feedback\",
    \"dueISO\": \"$DUE_DATE\",
    \"context\": \"From board meeting discussion about revenue targets\",
    \"founder\": \"darnell\"
  }"
```

### Mock Response Example
```json
{
  "status": "ok",
  "humanSummary": "Created follow-up: \"Follow up with client\". Due 11/1/2025, 9:13:40 PM.",
  "nextBestAction": "Add this to your priority list.",
  "data": {
    "followUpId": "fup-xyz789",
    "subject": "Follow up with client",
    "dueDate": "2025-11-01T21:13:40.223Z",
    "context": "Q4 planning discussion",
    "createdAt": "2025-11-01T21:13:40.223Z"
  }
}
```

---

## Security & Authentication Testing

### Test 1: Missing Authorization Header
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```
**Expected Response**: 401 Unauthorized
```json
{
  "status": "error",
  "humanSummary": "Unauthorized: Missing or invalid Authorization header"
}
```

### Test 2: Invalid Token
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer wrong-token-xyz" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```
**Expected Response**: 401 Unauthorized

### Test 3: Malformed Authorization Header
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: InvalidFormat token-here" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```
**Expected Response**: 401 Unauthorized

---

## Idempotency Testing

The API supports idempotency via the `Idempotency-Key` header. Duplicate requests within 60 seconds return the same response.

### Test Idempotency
```bash
IDEMPOTENCY_KEY="test-key-$(date +%s)"

# First request
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"minutes": 30, "founder": "shria"}' > /tmp/response1.json

# Wait 1 second
sleep 1

# Identical second request
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{"minutes": 30, "founder": "shria"}' > /tmp/response2.json

# Compare responses (should be identical)
diff /tmp/response1.json /tmp/response2.json && echo "✅ Idempotency verified!"
```

---

## Rate Limiting Testing

The API allows 20 requests per 10 seconds per IP address.

### Test Rate Limiting
```bash
#!/bin/bash
TOKEN="elevenlabs-voice-secure-token-2025"

echo "Sending 25 rapid requests..."
for i in {1..25}; do
  curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"minutes": 5, "founder": "shria"}' \
    -w "Request $i: %{http_code}\n" \
    -o /dev/null &
done

wait
echo "First 20 should be 200, 21+ should be 429"
```

---

## Health Check Testing

### Check API Health
```bash
curl -X GET http://localhost:3000/health -w "\nStatus: %{http_code}\n"
```

**Expected Response** (200 OK):
```json
{
  "status": "running",
  "environment": "production",
  "timestamp": "2025-11-01T21:13:40.223Z",
  "uptime": 45.32
}
```

---

## Docker Container Testing

If running in Docker, test from outside the container:

### Option 1: Execute curl inside container
```bash
docker exec em-api curl -X POST http://127.0.0.1:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```

### Option 2: Use Node.js inside container
```bash
docker exec em-api node -e "
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/voice/scheduler/block',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer elevenlabs-voice-secure-token-2025'
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data).humanSummary));
});
req.write(JSON.stringify({minutes: 45, founder: 'shria'}));
req.end();
"
```

### Option 3: View container logs
```bash
docker logs em-api -f
```

---

## Testing Checklist

Use this checklist to verify all functionality:

### Endpoints
- [ ] Block focus time (POST /api/voice/scheduler/block)
- [ ] Confirm meeting (POST /api/voice/scheduler/confirm)
- [ ] Reschedule meeting (POST /api/voice/scheduler/reschedule)
- [ ] Start pause (POST /api/voice/coach/pause)
- [ ] Log complete (POST /api/voice/support/log-complete)
- [ ] Follow-up (POST /api/voice/support/follow-up)

### Security
- [ ] Missing auth header returns 401
- [ ] Invalid token returns 401
- [ ] Valid token returns 200
- [ ] Missing required field returns 400
- [ ] Invalid date format returns 400
- [ ] Invalid enum value returns 400

### Features
- [ ] Rate limiting: 20 req/10s works
- [ ] Rate limiting: 21st request returns 429
- [ ] Idempotency key deduplicates requests
- [ ] Health check returns 200
- [ ] Responses have correct shape (status, humanSummary, etc.)

### Error Handling
- [ ] Duration validation works
- [ ] Date validation works
- [ ] Enum validation works
- [ ] Error messages are clear
- [ ] No stack traces in responses

---

## Next Steps

Once you've tested the mock responses:

1. **Verify mock behavior** - All endpoints return realistic mock data
2. **Test edge cases** - Try invalid inputs, missing fields, rate limiting
3. **Prepare for real agents** - Document which mock outputs need to be replaced
4. **Plan integration** - Decide how to wire in real calendar/email/meditation services

The mock responses are production-like, so the API structure is ready for real agent integration!
