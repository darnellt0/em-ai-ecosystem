# Shria's Personal Assistant - First Message Generator

This module provides context-aware first messages for Shria's ElevenLabs voice assistant. It dynamically generates greetings based on time of day, interaction context, calendar load, and user energy signals.

## Overview

The first-message generator creates personalized, context-aware greetings that match Shria's voice assistant tone: **grounded, calm, supportive, and present**.

## Architecture

### Core Components

1. **`shriaIntro.ts`** - Main module containing:
   - Core generator function (`generateShriaFirstMessage`)
   - Orchestrator decision helpers (`decideIntroMoment`, `decideEnergyContext`)
   - High-level API (`getFirstMessageForShria`)
   - Type definitions

2. **Voice Integration** - Wired into:
   - `voice.services.ts` - Session start service function
   - `voice.router.ts` - REST endpoint
   - `voice.types.ts` - Schema validation

## API Usage

### REST Endpoint

**POST** `/api/voice/session/start`

Start a voice session and receive a context-aware first message.

#### Request Schema

```typescript
{
  "founder": "shria" | "darnell",           // Default: "shria"
  "entryContext"?: "open_app" | "post_meeting" | "resume" | "voice_wake_word",
  "lastInteractionAt"?: "2025-11-20T10:30:00Z",  // ISO 8601 datetime
  "explicitOverwhelmed"?: boolean,          // User indicated feeling overwhelmed
  "explicitTired"?: boolean                 // User indicated feeling tired
}
```

#### Response

```json
{
  "status": "ok",
  "humanSummary": "Good morning, Shria. I'm here and ready to help you move through the day with clarity and calm...",
  "nextBestAction": "Ready to assist you.",
  "data": {
    "founderEmail": "shria",
    "sessionStartedAt": "2025-11-20T14:30:00Z",
    "entryContext": "open_app",
    "calendarAnalysis": {
      "totalEventHoursToday": 5,
      "hasHighStakesEvent": false,
      "hasBackToBackBlocks": true
    }
  }
}
```

#### Example cURL Request

```bash
curl -X POST https://api.elevatedmovements.com/api/voice/session/start \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "founder": "shria",
    "entryContext": "open_app"
  }'
```

### Programmatic Usage

```typescript
import { getFirstMessageForShria } from './em/shriaIntro';

const firstMessage = getFirstMessageForShria({
  now: new Date(),
  lastInteractionAt: null,
  entryContext: "open_app",
  totalEventHoursToday: 5,
  hasHighStakesEvent: true,
  hasBackToBackBlocks: true,
  explicitOverwhelmed: false,
  explicitTired: false,
});

console.log(firstMessage);
// Output: "Good morning, Shria. Today carries a lot of importance,
//          so let's move through it with steadiness and care..."
```

## Decision Logic

### Intro Moment Types

| Moment | When It's Used |
|--------|---------------|
| `startup` | First interaction after 4+ hours, late evening (10pm+) |
| `morning` | 12am - 12pm (first touch or long gap) |
| `midday` | 12pm - 5pm |
| `evening` | 5pm - 10pm |
| `post-break` | Resume after 45+ minutes |
| `post-meeting` | Explicit "post_meeting" context |

### Energy Context Types

| Energy | Triggers |
|--------|----------|
| `neutral` | Default state |
| `overwhelmed` | Explicit user signal OR explicit flag |
| `tired` | Late evening (8pm+) with 4+ event hours OR explicit flag |
| `big-day` | High-stakes event OR 6+ event hours OR 4+ hours with back-to-back blocks |

### Calendar Analysis

The system analyzes calendar load to determine energy context:

```typescript
{
  totalEventHoursToday: number,      // Total hours of scheduled events
  hasHighStakesEvent: boolean,       // Events matching keywords like "retreat", "launch", "workshop"
  hasBackToBackBlocks: boolean       // Meetings with < 15 min gaps
}
```

**Current Implementation**: Uses intelligent defaults based on time of day and day of week.

**Future Enhancement**: Integration with real calendar service to analyze actual events (see commented code in `voice.services.ts`).

## Example Messages

### Morning - Neutral
```
Good morning, Shria. I'm here and ready to help you move through the day
with clarity and calm. Just let me know when you'd like to see your schedule
or ease into your first focus for the morning.
```

### Morning - Big Day
```
Good morning, Shria. Today carries a lot of importance, so let's move through
it with steadiness and care. When you're ready, I can walk you through the
anchors for the day so everything feels grounded and manageable.
```

### Midday - Overwhelmed
```
Hi Shria. Let's slow things down for a moment. When you're ready, I can help
you re-center, simplify what's ahead, or offer a gentle transition into your
next focus.
```

### Evening - Tired
```
Good evening, Shria. You've carried a lot today. If it would be helpful,
I can gently recap what we completed and set light, supportive intentions
for tomorrow.
```

### Post-Meeting - Overwhelmed
```
You're back, Shria. Let's take a moment to breathe before we move on.
When it feels right, I can help capture key points from that meeting or
outline only the most important next steps.
```

## Integration Points

### 1. Voice Router (`voice.router.ts`)

New endpoint added: **POST /api/voice/session/start**

```typescript
router.post('/session/start', ...middleware, asyncHandler(async (req, res) => {
  const parsed = parseVoiceRequest(SessionStartSchema, req.body);
  const result = await startSession(parsed.data);
  res.json(result);
}));
```

### 2. Voice Services (`voice.services.ts`)

New service function: `startSession(input: SessionStartInput)`

- Analyzes calendar for energy context
- Calls `getFirstMessageForShria` with context
- Returns `VoiceResponse` with personalized greeting

### 3. Voice Types (`voice.types.ts`)

New schema: `SessionStartSchema`

Validates:
- Founder selection
- Entry context
- Last interaction timestamp
- Energy flags

### 4. First Message Generator (`em/shriaIntro.ts`)

Core module with all decision logic and message generation.

## Future Enhancements

### Calendar Integration

Replace the mock `analyzeCalendarForEnergyContext` with real calendar analysis:

```typescript
// Fetch events from Google Calendar
const events = await calendarService.listEvents(founderEmail, startOfDay, endOfDay);

// Analyze for high-stakes keywords
const highStakesKeywords = ['retreat', 'launch', 'workshop', 'presentation'];
const hasHighStakesEvent = events.some(e =>
  highStakesKeywords.some(keyword => e.summary.toLowerCase().includes(keyword))
);

// Calculate total hours and back-to-back patterns
// ...
```

### Persistent Session State

Track `lastInteractionAt` across sessions:

```typescript
// Store in database or cache
await sessionStore.set(founderEmail, {
  lastInteractionAt: new Date(),
  sessionId: generateSessionId(),
});

// Retrieve on next session start
const previousSession = await sessionStore.get(founderEmail);
```

### Machine Learning Optimization

Learn from user feedback to refine energy context detection:

```typescript
// Track which messages resonate best
await analytics.trackFirstMessage({
  founderEmail,
  message,
  moment,
  energy,
  userFeedback: 'positive' | 'neutral' | 'negative'
});
```

### WebSocket Integration

Push first message via WebSocket for realtime sessions:

```typescript
// In ws.server.ts
wss.on('connection', async (socket) => {
  const firstMessage = await startSession({
    founder: 'shria',
    entryContext: 'voice_wake_word'
  });

  socket.send(JSON.stringify({
    type: 'first_message',
    message: firstMessage.humanSummary
  }));
});
```

## Testing

### Manual Testing

```bash
# Test morning greeting
curl -X POST http://localhost:3000/api/voice/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"founder": "shria", "entryContext": "open_app"}'

# Test overwhelmed state
curl -X POST http://localhost:3000/api/voice/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "founder": "shria",
    "entryContext": "resume",
    "explicitOverwhelmed": true
  }'

# Test post-meeting
curl -X POST http://localhost:3000/api/voice/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "founder": "shria",
    "entryContext": "post_meeting"
  }'
```

### Unit Testing (Future)

```typescript
import { getFirstMessageForShria, decideIntroMoment } from './shriaIntro';

describe('First Message Generator', () => {
  it('should return morning greeting at 9am', () => {
    const message = getFirstMessageForShria({
      now: new Date('2025-11-20T09:00:00Z'),
      totalEventHoursToday: 3,
      hasHighStakesEvent: false,
      hasBackToBackBlocks: false,
    });
    expect(message).toContain('Good morning');
  });

  it('should detect big-day energy with 6+ hours', () => {
    const message = getFirstMessageForShria({
      now: new Date('2025-11-20T09:00:00Z'),
      totalEventHoursToday: 7,
      hasHighStakesEvent: false,
      hasBackToBackBlocks: false,
    });
    expect(message).toContain('carries a lot of importance');
  });
});
```

## Design Philosophy

The first-message generator follows these principles:

1. **Grounded** - Messages acknowledge current state without judgment
2. **Calm** - Tone is steady, never rushed or anxious
3. **Supportive** - Offers help, suggests next steps, provides options
4. **Present** - Focuses on the current moment and what's ahead
5. **Respectful** - Never pushes, always invites action

## Static Fallback (ElevenLabs UI)

In the ElevenLabs agent UI, set this as the static first message:

```
Welcome, Shria. I'm here and ready to help you move through the day
with clarity and calm. Just let me know when you'd like to see your
schedule, revisit your priorities, or ease into your next focus.
```

This serves as a safe fallback when the dynamic system is unavailable.

## Maintenance

### Adding New Moment Types

1. Update `IntroMoment` type in `shriaIntro.ts`
2. Add case in `generateShriaFirstMessage` switch statement
3. Update `decideIntroMoment` logic if needed
4. Add examples to this documentation

### Adding New Energy Contexts

1. Update `EnergyContext` type in `shriaIntro.ts`
2. Add logic in `decideEnergyContext`
3. Add messages for the new context
4. Update documentation with examples

## Support

For questions or issues with the first-message generator:

1. Check this documentation
2. Review `shriaIntro.ts` source code
3. Test endpoint with cURL
4. Check logs for calendar analysis errors
5. Contact the EM AI team

---

**Module**: `@em/api/em/shriaIntro`
**Version**: 1.0.0
**Last Updated**: 2025-11-20
**Author**: EM AI Team
