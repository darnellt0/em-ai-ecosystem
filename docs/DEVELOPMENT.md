# Development Guide
- Install dependencies at repo root: `npm install` (workspace-aware).
- Start API: `cd packages/api && npm run dev` (loads agents registry at startup).
- Start dashboard: `cd packages/dashboard && npm run dev`.
- Tests (targeted): `cd packages/api && npm test -- --runTestsByPath <paths>`.
- Orchestrator registry exports from `@em/orchestrator`; avoid stub runtime.
- Feature flags (default false): `ENABLE_ACTION_EXECUTION`, `ENABLE_CALENDAR_WRITES`, `ENABLE_GMAIL_DRAFTS`, `ENABLE_GMAIL_SEND`, `ENABLE_SHEETS_WRITES`, `ENABLE_ACTIONPACK_WEBHOOK`, `ENABLE_MCP`.
- Tool Layer: registry in `packages/api/src/tools`; actions/list_pending registered by default. MCP adapter is disabled unless `ENABLE_MCP=true` and `MCP_SERVER_URL` is set.
- Webhook: ActionPack publisher is no-op unless `ENABLE_ACTIONPACK_WEBHOOK=true` and `ACTIONPACK_WEBHOOK_URL` configured (optional `ACTIONPACK_WEBHOOK_SECRET` for HMAC).
- PLAN-first: avoid side effects unless approvals + flags set.
