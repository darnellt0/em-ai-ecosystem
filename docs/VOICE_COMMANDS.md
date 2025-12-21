# Voice Commands (v2)

## Supported phrases

Journal intents:
- "daily reflection", "morning journal"
- "midday check in", "lunch check-in"
- "close my day", "end of day"

Operations:
- "show my journal runs", "what did I run today"
- "run my daily brief"
- "create my action pack", "daily focus"
- "system status", "are you online"
- "help", "what can you do"

Help output is also available via `GET /api/voice/help` (no history side effects).

Scheduling (requires confirmation):
- "schedule daily reflection every weekday at 8am"
- "daily at 8" (with intent in the same sentence)
- "every Sunday at 5" (with intent in the same sentence)

## Confirmation flow

Commands that schedule runs or trigger multi-step flows require confirmation:

1) `POST /api/voice/command` returns `action=confirm_required` and `confirmationId`.
2) Send confirmation with:
   - `POST /api/voice/confirm` `{ user, confirmationId, answer: "yes" | "no" }`
3) On "yes" the command executes; on "no" it is cancelled.

Confirmations expire after 10 minutes.

## Follow-up loop (lightweight)

If a command is unknown or missing a clear intent, the API returns a follow-up prompt
with suggested commands. Reply using:

- `POST /api/voice/follow-up` `{ user, followUpId, text }`

If you answer with a number (1..N) or the exact suggested command, the router will
resolve it to the matching command string.

## Mic -> transcribe -> command

On the Voice Console (/voice), recording flows as:

1) Record audio in the UI.
2) `POST /api/voice/transcribe` with multipart `audio` file.
3) Use returned `text` to call `POST /api/voice/command` with `{ user, text }`.
4) The UI renders command results, confirmation prompts, and follow-ups.

## Voice turn run history

Journal commands executed via `POST /api/voice/turn` persist run history and can be retrieved via:

- `GET /api/exec-admin/p0/journal/runs`

## Command history + replay

- `GET /api/voice/commands?user=darnell&limit=20` returns recent commands.
- `POST /api/voice/commands/:id/replay` replays `run_intent` commands.

## Scheduling requests

If the command action is `schedule` and confirmed, the API writes a schedule request
artifact to disk (manual step required). You can also call:

- `POST /api/schedules/request` with `{ user, intent, schedule, rawText? }`

Artifacts are written under `packages/api/.data/schedule-requests`.

## Notes

- The command router is rules-based and does not require an LLM.
- Unknown or ambiguous commands return suggested commands for follow-up.
