import { finalizeRunIfTerminal } from '../../src/services/growthRunFinalize.service';
import * as history from '../../src/services/growthRunHistory.service';
import * as summary from '../../src/services/growthRunSummary.service';

jest.mock('../../src/services/growthRunHistory.service');
jest.mock('../../src/services/growthRunSummary.service');
jest.mock('../../src/growth-agents/orchestrator', () => ({ orchestrator: { getMonitorData: jest.fn() } }));

describe('finalizeRunIfTerminal', () => {
  const runId = 'run-1';
  const baseRun = {
    runId,
    founderEmail: 'test@example.com',
    mode: 'full',
    launchedAgents: ['a1', 'a2'],
    jobIds: [],
    status: 'running' as const,
    startedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns null when run missing', async () => {
    (history.getGrowthRun as jest.Mock).mockResolvedValue(null);
    const res = await finalizeRunIfTerminal(runId);
    expect(res).toBeNull();
  });

  it('marks complete when all agents completed', async () => {
    (history.getGrowthRun as jest.Mock).mockResolvedValue(baseRun);
    (summary.buildGrowthRunSummary as jest.Mock).mockReturnValue({
      runId,
      agents: {
        launched: ['a1', 'a2'],
        completed: ['a1', 'a2'],
        failed: [],
        running: [],
        queued: [],
        total: 2,
      },
      progress: { latest: [] },
      events: { latest: [] },
    });
    (history.updateGrowthRun as jest.Mock).mockImplementation((_id, patch) => ({ ...baseRun, ...patch }));

    const res = await finalizeRunIfTerminal(runId);
    expect(res?.run.status).toBe('complete');
    expect(res?.run.finishedAt).toBeDefined();
  });

  it('marks failed when failures and nothing running/queued', async () => {
    (history.getGrowthRun as jest.Mock).mockResolvedValue(baseRun);
    (summary.buildGrowthRunSummary as jest.Mock).mockReturnValue({
      runId,
      agents: {
        launched: ['a1', 'a2'],
        completed: [],
        failed: ['a1'],
        running: [],
        queued: [],
        total: 2,
      },
      progress: { latest: [] },
      events: { latest: [{ agent: 'a1', kind: 'failed' }] },
    });
    (history.updateGrowthRun as jest.Mock).mockImplementation((_id, patch) => ({ ...baseRun, ...patch }));

    const res = await finalizeRunIfTerminal(runId);
    expect(res?.run.status).toBe('failed');
  });

  it('stays running when mixed states', async () => {
    (history.getGrowthRun as jest.Mock).mockResolvedValue(baseRun);
    (summary.buildGrowthRunSummary as jest.Mock).mockReturnValue({
      runId,
      agents: {
        launched: ['a1', 'a2'],
        completed: ['a1'],
        failed: [],
        running: ['a2'],
        queued: [],
        total: 2,
      },
      progress: { latest: [] },
      events: { latest: [] },
    });
    (history.updateGrowthRun as jest.Mock).mockImplementation((_id, patch) => ({ ...baseRun, ...patch }));

    const res = await finalizeRunIfTerminal(runId);
    expect(res?.run.status).toBe('running');
  });
});

