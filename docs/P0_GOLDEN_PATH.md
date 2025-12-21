# P0 Golden Path (Source of Truth)

This document defines the **single** end-to-end P0 flow that is stable, boring, and reliable.
Everything else is frozen unless explicitly unlocked by the P0 freeze rules.

## Canonical Flow: P0 Daily Focus

1. **EM Executive Admin receives request**
   - Entry point: `packages/api/src/exec-admin/flows/p0-daily-focus.ts` (`runP0DailyFocusExecAdmin`)
   - Required input: `{ userId, mode?, tone?, force? }`

2. **Orchestrator routes to P0 agents**
   - Flow: `packages/orchestrator/src/flows/p0-daily-focus.flow.ts`
   - Agents (active):
     - `daily_brief.generate`
     - `calendar.optimize_today`
     - `insight.surface_top_signals`
     - `journal.prompt_light`
     - `content.action_pack`
     - `qa.verify_run`
   - Each P0 agent has:
     - `health()` method
     - clear input contract + output shape (see registry in `packages/api/src/orchestrator/registerP0Agents.ts`)

3. **Orchestrator aggregates results**
   - Consolidates brief, calendar, insights, and journal into `ActionPack`
   - Produces a single `DailyFocusResult` payload

4. **Action Pack generated**
   - Output shape: `ActionPack` (from `packages/shared/contracts`)
   - Stored in response payload + run history snapshot

5. **Tool layer integration (n8n)**
   - Tool interface: `runToolByName(toolName, payload)`
   - Tool: `n8n.actionpack_webhook`
   - Location: `packages/api/src/tools/registerTools.ts`

6. **Run history persisted**
   - Service: `packages/api/src/services/p0RunHistory.service.ts`
   - Record includes:
     - `inputSnapshot`
     - `outputSnapshot`
     - `evalStatus` (PASS/DEGRADED/FAIL)

7. **P0 evals validate output**
   - Test suite: `packages/api/tests/p0-golden-path.eval.ts`
   - Deterministic checks for required fields, action pack shape, run history, and orchestrator success

## Regression Contract (Must Stay True)

- P0 Daily Focus is the **only** end-to-end path guaranteed for stability.
- All non-P0 agents remain **frozen** unless explicitly unlocked.
- Tool integrations (n8n/webhooks) are always invoked via the tool layer.
