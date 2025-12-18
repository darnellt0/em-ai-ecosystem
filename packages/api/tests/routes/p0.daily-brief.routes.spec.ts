import request from 'supertest';
import app from '../../src/index';

describe('Exec Admin Daily Brief routes', () => {
  beforeAll(() => {
    process.env.FOUNDER_DARNELL_EMAIL = 'darnell@example.com';
    process.env.FOUNDER_SHRIA_EMAIL = 'shria@example.com';
  });

  it('runs daily brief and returns brief with runId', async () => {
    const runId = 'api-daily-brief-run';
    const res = await request(app).post('/exec-admin/p0/daily-brief').send({ user: 'darnell', runId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.runId).toBe(runId);
    expect(res.body.brief).toBeDefined();
    expect(res.body.brief.topPriorities).toBeDefined();
  });

  it('lists and fetches daily brief runs with artifacts', async () => {
    const runRes = await request(app).post('/exec-admin/p0/daily-brief').send({ user: 'darnell' });
    const runId = runRes.body.runId;

    const listRes = await request(app)
      .get('/exec-admin/p0/daily-brief/runs')
      .query({ limit: 5, founderEmail: process.env.FOUNDER_DARNELL_EMAIL });
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.runs)).toBe(true);
    expect(listRes.body.runs.some((r: any) => r.runId === runId)).toBe(true);

    const getRes = await request(app).get(`/exec-admin/p0/daily-brief/runs/${runId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.run.runId).toBe(runId);
    expect(getRes.body.run.artifact).toBeDefined();
  });
});
