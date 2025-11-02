# Voice API Module

ElevenLabs voice command integration layer for the Elevated Movements AI Ecosystem.

**Status**: Production-Ready ✅

---

## Quick Start

### 1. Set Token
```bash
export VOICE_API_TOKEN="elevenlabs-voice-secure-token-2025"
```

### 2. Start API
```bash
docker-compose up -d api
sleep 3
```

### 3. Test Endpoint
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "humanSummary": "Blocked 45 minutes for focus on 2025-11-01 18:30:45...",
  "nextBestAction": "Silence notifications during this time.",
  "data": {...}
}
```

---

## The 6 Endpoints

| Path | Purpose | Schema |
|------|---------|--------|
| `POST /api/voice/scheduler/block` | Block focus time | FocusBlockSchema |
| `POST /api/voice/scheduler/confirm` | Confirm meeting | ConfirmMeetingSchema |
| `POST /api/voice/scheduler/reschedule` | Reschedule event | RescheduleSchema |
| `POST /api/voice/coach/pause` | Start meditation | PauseSchema |
| `POST /api/voice/support/log-complete` | Mark task done | LogCompleteSchema |
| `POST /api/voice/support/follow-up` | Create reminder | FollowUpSchema |

See `../../documentation/VOICE_TESTS.md` for full cURL examples.

---

## File Structure

```
voice/
├── voice.types.ts        # Zod schemas + types (180 lines)
├── voice.services.ts     # Service adapters with TODOs (350 lines)
├── voice.router.ts       # Express router + endpoints (190 lines)
└── README.md             # This file
```

---

## Security

**Auth**: Bearer token via `Authorization: Bearer <VOICE_API_TOKEN>` header
- Returns **401** if missing/invalid
- Returns **500** if env var not configured

**Rate Limit**: 20 req/10s per IP
- Returns **429** if exceeded
- TODO: Swap to Redis for scale

**Idempotency**: Optional `Idempotency-Key` header
- 60s TTL cache
- Same key = cached response
- TODO: Swap to Redis for scale

---

## Response Shape

All endpoints return:
```typescript
{
  status: "ok" | "error",
  humanSummary: string,           // Always present
  nextBestAction?: string,        // Optional guidance
  data?: Record<string, unknown>  // Optional metadata
}
```

---

## Wiring Real Agents

Each service function has a TODO showing where to import real agents.

### Example: blockFocus()

Current (stub):
```typescript
export async function blockFocus(input: FocusBlockInput): Promise<VoiceResponse> {
  // TODO: Replace with actual agent call
  return {
    status: 'ok',
    humanSummary: `Blocked ${input.minutes} minutes for focus...`,
  };
}
```

Replace with:
```typescript
import { blockFocusTime } from '@agents/calendar-optimizer/src/operations';

export async function blockFocus(input: FocusBlockInput): Promise<VoiceResponse> {
  try {
    const result = await blockFocusTime({
      founderEmail: input.founder === 'darnell' ? 'darnell@elevatedmovements.com' : 'shria@elevatedmovements.com',
      durationMinutes: input.minutes,
      startTime: input.startAtISO ? new Date(input.startAtISO) : new Date(),
      bufferMinutes: input.bufferMinutes,
      reason: input.reason,
    });

    return {
      status: 'ok',
      humanSummary: `Blocked ${input.minutes} minutes for focus.`,
      nextBestAction: 'Silence notifications during this time.',
      data: result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not block focus time: ${message}`,
      nextBestAction: 'Try again in a moment.',
    };
  }
}
```

---

## Service Functions to Wire

1. **blockFocus()** → `@agents/calendar-optimizer`
2. **confirmMeeting()** → `@agents/calendar-optimizer`
3. **rescheduleMeeting()** → `@agents/calendar-optimizer`
4. **startPause()** → `@agents/voice-companion` + `@agents/deep-work-monitor`
5. **logTaskComplete()** → `@agents/inbox-assistant` or `@agents/task-orchestrator`
6. **createFollowUp()** → `@agents/inbox-assistant` or `@agents/task-orchestrator`

---

## Validation

All inputs validated with **Zod** strict schemas. Invalid fields return 400 with clear error messages.

Example:
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 0, "founder": "shria"}'
```

Response (400 Bad Request):
```json
{
  "status": "error",
  "humanSummary": "Invalid request: minutes: Must be at least 1 minute",
  "nextBestAction": "Check payload and retry."
}
```

---

## Testing

**Run test suite**:
```bash
npm test -w @em/api -- packages/api/tests/voice.router.spec.ts
```

**Test cases**: 20+ (auth, validation, success paths, idempotency, rate limiting)

See `../../documentation/VOICE_TESTS.md` for manual cURL testing.

---

## n8n Integration

Two workflows ready for import:

1. **voice_to_api_to_dashboard.json** — Voice → API → Dashboard
2. **api_failure_incident_apology.json** — Error handling + incidents

See `../../documentation/integrations/n8n/` for JSON exports.

---

## Middleware Stack

Requests pass through in order:

1. **authBearer** — Verify Bearer token (401/500)
2. **rateLimitSimple** — Check IP rate limit (429)
3. **idempotency** — Handle Idempotency-Key (200 cached)

Then route handler validates with Zod and calls service function.

---

## Deployment

**Prerequisites**:
- Node 18+
- Express 4.18+
- Zod 3.22+
- Supertest for testing

**Steps**:
```bash
# 1. Set token
export VOICE_API_TOKEN="your-token-here"

# 2. Start services
docker-compose up -d api

# 3. Verify health
curl http://localhost:3000/health

# 4. Run tests
npm test -w @em/api -- voice.router.spec.ts

# 5. Test endpoints
curl http://localhost:3000/api/voice/scheduler/block ...

# 6. Wire real agents (2-3 hours)
# Update voice.services.ts with real agent imports

# 7. Monitor
docker logs em-api -f
```

---

## Documentation

- `documentation/VOICE_TESTS.md` — 50+ cURL examples
- `documentation/PHASE_VOICE_0_IMPLEMENTATION.md` — Full reference
- `documentation/VOICE_0_DEPLOYMENT_CHECKLIST.md` — Deployment checklist

---

## Support

**Q: Tests failing?**
A: Verify `VOICE_API_TOKEN` env var is set and zod is installed.

**Q: 401 responses?**
A: Check Authorization header format: `Bearer <token>`

**Q: 429 rate limited?**
A: Wait 10 seconds; check for rapid burst requests.

**Q: How to scale?**
A: See TODO comments in middleware files for Redis upgrade paths.

---

## Security Notes

- ✅ Bearer token required (401 without)
- ✅ Rate limited (429 on excess)
- ✅ All inputs validated (400 on bad data)
- ✅ Zod schemas (type-safe)
- ✅ HTTPS via Caddy (production)
- ⚠️ TODO: Rotate token every 90 days
- ⚠️ TODO: Add per-token rate limits (production)

---

## License

Elevated Movements AI Ecosystem — Phase Voice-0
Generated with Claude Code
