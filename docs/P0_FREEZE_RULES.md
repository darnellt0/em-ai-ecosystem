# P0 Freeze Rules

## What is Allowed During Stabilization

- Fixes that **directly** improve the P0 Golden Path (`docs/P0_GOLDEN_PATH.md`).
- Tool-layer refactors that **remove** embedded integration logic.
- Deterministic evals that validate the P0 path.
- Clear, minimal logging and run-history improvements for P0 runs.

## What is Frozen

- All P1/P2 agents and growth expansions.
- New agents, new frameworks, or new orchestration paths.
- Broad refactors unrelated to P0 stability.
- Additional QA surface area beyond the P0 evals.

## Criteria to Unlock P1

All must be true:

1. P0 Daily Focus runs end-to-end locally without manual fixes.
2. `packages/api/tests/p0-golden-path.eval.ts` passes consistently.
3. Registry shows **only** P0 agents as active; all others are frozen.
4. Tool layer covers all external integrations used by P0.
5. Run history records inputs, outputs, and eval pass/fail clearly.
