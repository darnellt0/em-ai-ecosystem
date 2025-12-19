import { runP0DailyFocusFlow } from '../../src/flows/p0-daily-focus.flow';

describe('P0-DAILY-FOCUS flow', () => {
  it('returns action pack and status', async () => {
    const res = await runP0DailyFocusFlow({
      flow: 'P0-DAILY-FOCUS',
      payload: { userId: 'darnell', mode: 'founder' },
    } as any);

    expect(res.success).toBe(true);
    expect(res.output?.actionPack).toBeDefined();
    expect(res.output?.meta.userId).toBe('darnell');
  });

  it('degrades when agents are skipped', async () => {
    const res = await runP0DailyFocusFlow({
      flow: 'P0-DAILY-FOCUS',
      payload: { userId: 'darnell', mode: 'founder', debug: { skipAgents: ['daily_brief.generate', 'journal.prompt_light'] } },
    } as any);

    expect(res.output?.status).toBe('degraded');
    expect(res.output?.qaStatus).toBeDefined();
  });

  it('fails QA when forced', async () => {
    const res = await runP0DailyFocusFlow({
      flow: 'P0-DAILY-FOCUS',
      payload: { userId: 'darnell', mode: 'founder', debug: { forceQaFail: true } },
    } as any);

    expect(res.output?.qaStatus).toBe('FAIL');
    expect(res.success).toBe(false);
  });
});
