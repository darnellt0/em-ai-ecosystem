import { runP0DailyBriefExecAdmin } from '../../src/exec-admin/flows/p0-daily-brief';
import { getP0Run } from '../../src/services/p0RunHistory.service';

describe('Exec Admin Daily Brief run', () => {
  beforeAll(() => {
    process.env.FOUNDER_DARNELL_EMAIL = 'darnell@example.com';
    process.env.FOUNDER_SHRIA_EMAIL = 'shria@example.com';
  });

  it('creates a run, stores artifact, and finalizes status', async () => {
    const runId = 'test-daily-brief-run';
    const result = await runP0DailyBriefExecAdmin({ user: 'darnell', runId, date: '2025-01-01' });

    expect(result.runId).toBe(runId);
    expect(result.brief.date).toBe('2025-01-01');

    const stored = await getP0Run(runId);
    expect(stored?.kind).toBe('p0.daily_brief');
    expect(stored?.status).toBe('complete');
    expect(stored?.artifact).toBeDefined();
  });
});
