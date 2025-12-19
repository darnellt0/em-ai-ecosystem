import request from 'supertest';
import app from '../../src/index';
import { recordGrowthRunStart, updateGrowthRun } from '../../src/services/growthRunHistory.service';

jest.mock('../../src/growth-agents/orchestrator', () => ({
  orchestrator: {
    getMonitorData: jest.fn().mockResolvedValue({ progress: [], events: [] }),
    launchAgent: jest.fn().mockResolvedValue({ jobId: 'job-1' }),
  },
}));

describe('Exec Admin Growth Finalize Endpoint', () => {
  const base = '/em-ai/exec-admin/growth';
  const founderEmail = 'finalize@example.com';

  it('returns 404 when run missing', async () => {
    const res = await request(app).post(`${base}/runs/missing/finalize`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('finalizes run terminal state', async () => {
    const run = await recordGrowthRunStart({ founderEmail, mode: 'full', launchedAgents: ['a1'], jobIds: [] });
    await updateGrowthRun(run.runId, {
      summary: { completedAgents: ['a1'], failedAgents: [] },
    });
    const res = await request(app).post(`${base}/runs/${run.runId}/finalize`).send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.run?.status).toBe('complete');
    expect(res.body.summary?.runId).toBe(run.runId);
  });
});

