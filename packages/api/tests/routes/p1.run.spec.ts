import request from 'supertest';
import app from '../../src/index';
import { resetActionsForTest } from '../../src/actions/action.store';

describe('P1 Exec Admin run endpoint', () => {
  beforeEach(() => {
    resetActionsForTest();
  });

  it('runs brand storyteller and stores planned actions', async () => {
    const res = await request(app)
      .post('/api/exec-admin/p1/run')
      .send({ userId: 'darnell', agentKey: 'brand.storyteller.generate', input: { mission: 'Test mission' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.output.summary).toBeDefined();
    expect(res.body.plannedActionIds.length).toBeGreaterThan(0);
  });

  it('rejects unknown agent', async () => {
    const res = await request(app).post('/api/exec-admin/p1/run').send({ agentKey: 'unknown.agent' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('runs a stubbed P1 agent and returns output', async () => {
    const res = await request(app).post('/api/exec-admin/p1/run').send({ userId: 'tester', agentKey: 'p1.voice_companion' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.output.summary).toBeDefined();
  });
});
