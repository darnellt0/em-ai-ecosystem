import request from 'supertest';
import app from '../../src/index';
import { recordGrowthRunStart, updateGrowthRun } from '../../src/services/growthRunHistory.service';

jest.mock('../../src/growth-agents/orchestrator', () => {
  return {
    orchestrator: {
      getMonitorData: jest.fn().mockResolvedValue({ progress: [], events: [] }),
      launchAgent: jest.fn().mockResolvedValue({ jobId: 'job-retry-1' }),
    },
  };
});

describe('Exec Admin Growth Run Summary & Retry', () => {
  const base = '/em-ai/exec-admin/growth';
  const founderEmail = 'test@example.com';

  afterEach(() => {
    delete process.env.ENABLE_GROWTH_RETRY;
  });

  it('returns 404 for missing run on summary', async () => {
    const res = await request(app).get(`${base}/runs/does-not-exist/summary`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns computed summary for an existing run', async () => {
    const run = await recordGrowthRunStart({
      founderEmail,
      mode: 'full',
      launchedAgents: ['growth.journal', 'growth.niche'],
      jobIds: [],
    });
    await updateGrowthRun(run.runId, {
      summary: {
        completedAgents: ['growth.journal'],
        failedAgents: ['growth.niche'],
        topProgress: [{ agent: 'growth.journal', percent: 100, note: 'done', timestamp: new Date().toISOString() }],
        topEvents: [{ agent: 'growth.niche', kind: 'failed', timestamp: new Date().toISOString() }],
      },
    });

    const res = await request(app).get(`${base}/runs/${run.runId}/summary`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.runId).toBe(run.runId);
    expect(res.body.summary.agents.total).toBe(2);
    expect(res.body.summary.agents.failed).toContain('growth.niche');
    expect(res.body.summary.agents.completed).toContain('growth.journal');
  });

  it('returns 403 when retry is disabled', async () => {
    const run = await recordGrowthRunStart({
      founderEmail,
      mode: 'full',
      launchedAgents: ['growth.journal'],
      jobIds: [],
    });
    const res = await request(app).post(`${base}/runs/${run.runId}/retry`).send({});
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('retries failed agents when enabled', async () => {
    process.env.ENABLE_GROWTH_RETRY = 'true';
    const run = await recordGrowthRunStart({
      founderEmail,
      mode: 'full',
      launchedAgents: ['growth.journal', 'growth.niche'],
      jobIds: [],
    });
    await updateGrowthRun(run.runId, {
      summary: { failedAgents: ['growth.niche'] },
    });
    const res = await request(app).post(`${base}/runs/${run.runId}/retry`).send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.retriedAgents).toContain('growth.niche');
    expect(res.body.jobIds?.length).toBeGreaterThanOrEqual(1);
  });
});
