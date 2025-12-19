import { runP0DailyFocusFlow } from '../../orchestrator/src/flows/p0-daily-focus.flow';

async function main() {
  const res = await runP0DailyFocusFlow({
    flow: 'P0-DAILY-FOCUS',
    payload: { userId: 'darnell', mode: 'founder' },
  } as any);

  const output = res.output as any;

  console.log('QA RESULT', {
    success: res.success,
    status: output?.status,
    agentsRan: output?.agentsRan,
    qa: output?.qa,
    actionPack: output?.actionPack,
  });
}

main().catch((err) => {
  console.error('[P0 DAILY FOCUS QA] failed', err);
  process.exitCode = 1;
});
