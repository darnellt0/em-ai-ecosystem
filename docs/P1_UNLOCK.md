# P1 Unlock Marker

P0 Golden Path is stable and is the regression baseline.

P1 rules:
- P0 routes may not be modified without re-running `packages/api/tests/p0-golden-path.eval.ts`.
- New work must be explicitly P1-scoped.
- Prefer tool-layer expansion over orchestration changes.
