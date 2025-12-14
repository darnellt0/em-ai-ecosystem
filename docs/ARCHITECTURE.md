# EM-AI Architecture Overview
- Executive Admin is the single front door for user-facing intents (HTTP/voice).
- Orchestrator is the canonical execution engine using a registry + dispatcher (`packages/orchestrator/src/registry`, `dispatcher.ts`).
- Agents are adapter-first: wrap System A logic (agent-factory/services) and are registered at API startup.
- P0 flows (e.g., Daily Focus) run via orchestrator flows and QA verification; outputs validated against shared contracts (`packages/shared/contracts`).
- Action Layer converts ActionPacks into planned actions with approvals/feature flags (PLAN-first). Routes in `packages/api/src/routes/actions.routes.ts`.
- UI surfaces: dashboard tools for actions (`packages/dashboard/app/tools/actions/page.tsx`).
