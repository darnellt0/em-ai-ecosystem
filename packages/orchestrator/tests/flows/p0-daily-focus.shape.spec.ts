import { runP0DailyFocusFlow } from '../../src/flows/p0-daily-focus.flow';

jest.mock('../../src/dispatcher', () => ({
  runAgentsConcurrently: jest.fn(async (calls: any[]) => {
    const map: Record<string, any> = {};
    calls.forEach((c: any) => {
      if (c.key === 'qa.verify_run') {
        map[c.key] = { success: true, status: 'OK', output: { status: 'PASS' } };
      } else if (c.key === 'content.action_pack') {
        map[c.key] = { success: true, status: 'OK', output: { linkedinDraft: 'draft', status: 'ready' } };
      } else {
        map[c.key] = { success: false, status: 'FAILED', error: 'stub fail' };
      }
    });
    return map;
  }),
}));

describe('P0 daily focus flow shape', () => {
  it('returns actionPack and qa even when agents fail', async () => {
    const res = await runP0DailyFocusFlow({ flow: 'P0', payload: { userId: 'test', mode: 'founder' } } as any);
    expect(res.success).toBe(true);
    expect(res.output.actionPack).toBeDefined();
    expect(res.output.qaStatus).toBeDefined();
    expect(res.output.actionPack.status).toBeDefined();
  });
});
