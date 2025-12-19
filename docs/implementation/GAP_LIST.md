# GAP LIST – EM-AI Ecosystem (Current State)

## Completed (with paths)
- Registry + dispatcher (canonical): `packages/orchestrator/src/registry/agent-registry.ts`, `packages/orchestrator/src/dispatcher.ts`, exports via `packages/orchestrator/src/index.ts`.
- P0 adapters registered at server startup: `packages/api/src/orchestrator/registerP0Agents.ts`, invoked in `packages/api/src/index.ts`.
- P0 Daily Focus flow + Exec Admin route: Flow `packages/orchestrator/src/flows/p0-daily-focus.flow.ts`; Exec Admin wrapper `packages/api/src/exec-admin/flows/p0-daily-focus.ts`; route `packages/api/src/routes/p0-daily-focus.routes.ts`.
- QA verify_run: `packages/qa/orchestrator/verify-run.ts` (registry/stub detection).
- Contracts + validation: `packages/shared/contracts/index.ts`, `packages/shared/contracts/validation.ts`.
- Action Layer MVP: store/executor/audit/routes in `packages/api/src/actions/*`; Action routes `packages/api/src/routes/actions.routes.ts`; Exec Admin plans actions into store.
- Operator tools/actions UI: `packages/dashboard/app/tools/actions/page.tsx`.
- Tool Layer + webhook: registry in `packages/api/src/tools/*`; ActionPack webhook publisher (feature-flagged) in `packages/api/src/actions/actionpack.webhook.ts`.
- Tests (initial set): dispatcher registry test, contract validation test, daily-focus bridge test, action executor safety tests, action routes test (see `packages/orchestrator/tests`, `packages/api/tests/actions`, `packages/api/tests/routes`).

## Remaining (to reach production-ready)
1) Action persistence: in-memory store/audit (resets on restart). Consider lightweight persistence or document limitation (OK for now).
2) System health + registry endpoints: implemented (`/api/system/health`, `/api/agents/registry`).
3) Growth agents canonical integration: registered and routed; ActionPack planned into Action Layer.
4) Docs: ARCHITECTURE, DEVELOPMENT, EXECUTION_SAFETY, RELEASE_CHECKLIST, USER_GUIDE, AGENT_STATUS added/updated.
5) Phase 6 alignment: Growth pack plans actions into Action Layer (pending persistence).
6) P1 agents: all keys registered (8 operational adapters, remaining registered as stubs/blocked).
7) System status telemetry: last QA result not persisted; acceptable to expose “unknown” in health endpoint.

## Scope for this run
- Integrate growth agents into canonical registry and Exec Admin front door; ensure ActionPack planning and QA coverage.
- Add system/registry endpoints and minimal tests.
- Add documentation set listed above.
- Register P1 agents (adapter-first or BLOCKED stubs), update AGENT_STATUS, and add minimal tests.
- Keep Action Layer safe (PLAN-first, flags/approvals OFF by default). Persistence remains in-memory; document limitation.
