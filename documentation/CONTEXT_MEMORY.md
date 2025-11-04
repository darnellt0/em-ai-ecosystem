# Context Memory Service

The context memory service stitches together short-term session context in Redis with long-term knowledge and task tracking in Postgres.

## Overview

| Layer | Purpose | Storage |
| ----- | ------- | ------- |
| Session Turns | Maintain the most recent dialog turns for a founder with automatic expiration and PII redaction. | Redis list per founder |
| Long-Term Memory | Persist durable key/value insights gathered from interactions. | Postgres `long_term_memory` |
| Task State Machine | Track asynchronous tasks with enforced state transitions. | Postgres `tasks` |

## Session Turns

### Append a turn

```ts
import { appendTurn } from '@em/context-memory';

await appendTurn({
  founder: 'shria',
  text: 'Follow up with alex@venturefund.com tomorrow',
  entities: { intent: 'follow_up', contact: 'alex@venturefund.com' },
  ts: new Date(),
});
```

* Email addresses and phone numbers are automatically replaced with `[REDACTED_EMAIL]` and `[REDACTED_PHONE]` before the turn is stored.
* Each founder is stored in its own Redis list with a configurable TTL (default 7 days) and maximum turn count (default 100).

### Fetch recent turns

```ts
import { getSession } from '@em/context-memory';

const turns = await getSession({ founder: 'shria', limit: 15 });
```

The response is an array ordered oldest-to-newest of sanitized turns:

```json
[
  {
    "founder": "shria",
    "text": "Follow up with [REDACTED_EMAIL] tomorrow",
    "entities": { "intent": "follow_up", "contact": "[REDACTED_EMAIL]" },
    "ts": "2024-07-10T12:00:00.000Z"
  }
]
```

## Long-Term Memory

### Remember

```ts
import { remember } from '@em/context-memory';

await remember({
  founder: 'darnell',
  key: 'favorite_drink',
  value: 'iced matcha',
  source: 'voice-agent',
});
```

### Recall

```ts
import { recall } from '@em/context-memory';

const memory = await recall({ founder: 'darnell', key: 'favorite_drink' });
```

`remember` inserts into the `long_term_memory` table, while `recall` returns the most recent record or `null` if none exists.

## Task State Machine

Tasks are inserted into the `tasks` table and flow through a guarded state machine:

```
new → in_progress → blocked → done
```

```ts
import { taskState } from '@em/context-memory';

const task = await taskState.create({ founder: 'darnell', title: 'Prepare board update' });
await taskState.updateState(task.id, 'in_progress');
await taskState.updateState(task.id, 'blocked');
await taskState.updateState(task.id, 'done');
```

Invalid transitions (for example, jumping from `new` directly to `done`) raise an error.

## API Endpoints

The API exposes context memory via `/api/context` with Bearer auth (re-using the voice token):

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/context/turn` | Append a sanitized turn to Redis. |
| `GET` | `/api/context/session?founder=...&limit=...` | Fetch recent turns (default 15). |
| `POST` | `/api/context/memory` | Persist a long-term memory key/value pair. |
| `GET` | `/api/context/memory?founder=...&key=...` | Retrieve the latest memory entry. |

All API payloads are validated with Zod and return JSON responses with helpful error messages for invalid input.
