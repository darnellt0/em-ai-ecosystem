import request from 'supertest';
import app from '../../src/index';

describe('Exec Admin P0 Daily Focus', () => {
  const baseRun = '/api/exec-admin/p0/daily-focus';
  const baseRuns = '/em-ai/exec-admin/p0/runs';
  const founderEmail = 'p0@example.com';

  it('requires userId', async () => {
    const res = await request(app).post(baseRun).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns actionPack and qa with runId', async () => {
    const res = await request(app).post(baseRun).send({ userId: founderEmail, mode: 'founder' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.runId || res.body.data?.runId).toBeDefined();
    expect(res.body.data?.actionPack).toBeDefined();
    expect(res.body.data?.actionPack?.version).toBe('p0.v1');
    expect(res.body.data?.qa).toBeDefined();
  });

  it('lists runs and gets run detail', async () => {
    await request(app).post(baseRun).send({ userId: founderEmail, mode: 'founder' });
    const list = await request(app).get(`${baseRuns}?founderEmail=${encodeURIComponent(founderEmail)}&limit=5`);
    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    const runId = list.body.runs?.[0]?.runId;
    expect(runId).toBeDefined();
    const detail = await request(app).get(`${baseRuns}/${runId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.run?.runId).toBe(runId);
  });
});

