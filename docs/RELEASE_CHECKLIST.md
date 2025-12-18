# Release Checklist
- [ ] All tests passing (`npm test` in packages/api and packages/orchestrator as needed).
- [ ] Agents registered at startup (P0, Growth, P1) with registry endpoint showing keys.
- [ ] Action Layer flags remain OFF by default; approvals enforced.
- [ ] Health endpoint `/api/system/health` returns success and agent count.
- [ ] Action audit accessible `/api/actions/audit`.
- [ ] Docs updated (ARCHITECTURE, EXECUTION_SAFETY, USER_GUIDE, AGENT_STATUS).
- [ ] QA verify_run active and not bypassed by stub runtime.
