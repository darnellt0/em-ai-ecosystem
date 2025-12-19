import request from 'supertest';
import app from '../../src/index';

describe('POST /api/exec-admin/p0/daily-focus', () => {
  it('returns daily focus payload', async () => {
    const res = await request(app).post('/api/exec-admin/p0/daily-focus').send({ userId: 'darnell' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.qaStatus).toBeDefined();
  });

  it('validates userId', async () => {
    const res = await request(app).post('/api/exec-admin/p0/daily-focus').send({});
    expect(res.status).toBe(400);
  });
});
