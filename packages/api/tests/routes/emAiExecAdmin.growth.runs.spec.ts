import request from 'supertest';
import app from '../../src/index';

describe('Exec Admin Growth Run History', () => {
  const founderEmail = 'shria@elevatedmovements.com';

  it('creates a run and returns runId', async () => {
    const res = await request(app).post('/em-ai/exec-admin/growth/run').send({ founderEmail, mode: 'full' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.runId).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('lists runs and fetches single run', async () => {
    const runRes = await request(app).post('/em-ai/exec-admin/growth/run').send({ founderEmail, mode: 'full' });
    const runId = runRes.body.runId;

    const listRes = await request(app).get('/em-ai/exec-admin/growth/runs').query({ founderEmail });
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.runs)).toBe(true);
    expect(listRes.body.runs.some((r: any) => r.runId === runId)).toBe(true);

    const getRes = await request(app).get(`/em-ai/exec-admin/growth/runs/${runId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.run.runId).toBe(runId);
  });
});
