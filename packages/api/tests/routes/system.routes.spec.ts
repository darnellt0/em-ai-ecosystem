import request from 'supertest';
import app from '../../src/index';

describe('System Routes', () => {
  it('returns system health', async () => {
    const res = await request(app).get('/api/system/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.agentCount).toBeGreaterThan(0);
  });

  it('returns agent registry', async () => {
    const res = await request(app).get('/api/agents/registry');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.agents)).toBe(true);
  });
});
