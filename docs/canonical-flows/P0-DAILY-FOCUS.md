# P0-DAILY-FOCUS (Canonical Flow)

**Goal:** Answer “What should I focus on today / in the next 90 minutes?” via Executive Admin → Orchestrator → QA → Action Layer.

## Entry Point
- Executive Admin intent: `em_exec_admin.generate_daily_focus`
- Required input: `userId` (darnell | shria | client:<id>)
- Modes: `founder` | `operator` | `client_preview`

## Agents (Orchestrated Concurrency)
- `daily_brief.generate`
- `calendar.optimize_today`
- `insight.surface_top_signals`
- `journal.prompt_light`
- `content.action_pack` (Action Layer)
- QA: `qa.verify_run` (post-aggregation)

## Flow
1) Exec Admin validates `userId`, routes to Orchestrator flow `P0-DAILY-FOCUS`.
2) Orchestrator queues all execution agents concurrently.
3) Aggregates results.
4) Runs QA; flow status = ok | degraded | failed.
5) Action Pack is generated if ≥2 core agents succeed.
6) Returns structured payload to Exec Admin with Action Pack artifacts:
   - LinkedIn post draft
   - Email draft
   - Journal prompt expansion
   - Reflection exercise
   - “Today’s focus” narrative

## Outputs (example)
```json
{
  "status": "ok",
  "agentsRan": ["daily_brief.generate", "calendar.optimize_today", "insight.surface_top_signals", "journal.prompt_light", "content.action_pack"],
  "qa": { "status": "ok" },
  "actionPack": {
    "linkedinDraft": "...",
    "emailDraft": "...",
    "journalExpansion": "...",
    "reflectionExercise": "...",
    "focusNarrative": "..."
  },
  "meta": {
    "userId": "darnell",
    "mode": "founder",
    "generatedAt": "..."
  }
}
```

## QA
- QA agent can block (`status=failed`) or degrade output.
- If QA fails, `success=false` in orchestrator response.

## Testing
- Unit: orchestrator flow, Exec Admin routing, QA paths.
- Integration: ok / degraded / failed scenarios.

## Notes
- No new abstractions; uses existing Exec Admin + Orchestrator patterns.
- Action Layer derives artifacts from the same run (no additional requests).
