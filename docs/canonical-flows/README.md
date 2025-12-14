# Canonical Flows

This folder lists the gold-standard flows for the EM-AI Ecosystem. Each flow follows the Master Agent Blueprint (MAB), uses Executive Admin as the front door, and the Orchestrator as the single execution engine with QA enforcement.

- [P0-DAILY-FOCUS](./P0-DAILY-FOCUS.md)

## Action Layer (Phase 3 Safety)

The Action Layer converts ActionPack outputs into human-approved execution. It is PLAN-first by default (no side effects) and requires approval + feature flags for EXECUTE.

Endpoints:
- `GET /api/actions/pending` — list planned/approved actions
- `GET /api/actions/:id` — action detail
- `GET /api/actions/audit?limit=50` — recent audit entries (in-memory; resets on restart)
- `POST /api/actions/:id/approve` — mark as approved (still PLAN until executed)
- `POST /api/actions/:id/execute` — execute in PLAN or EXECUTE mode (EXECUTE gated by flags)

Dashboard:
- `/tools/actions` (dashboard) provides a minimal operator console to approve/execute in PLAN mode.
