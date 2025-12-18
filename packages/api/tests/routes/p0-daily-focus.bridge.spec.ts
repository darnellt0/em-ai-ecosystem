import request from 'supertest';
import app from '../../src/index';
import * as dailyBriefAdapter from '../../../agents/daily-brief/adapter';

describe('Bridge Proof - P0 Daily Focus', () => {
  it('executes daily_brief.generate adapter (spy) and returns QA PASS/DEGRADED', async () => {
    const spy = jest.spyOn(dailyBriefAdapter, 'runDailyBriefAdapter').mockResolvedValueOnce({
      status: 'OK',
      output: { summary: 'ok', insights: [], suggestedActions: [], confidence: 0.9 },
    });

    const res = await request(app).post('/api/exec-admin/p0/daily-focus').send({ userId: 'darnell' });
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalled();
    expect(res.body.data.qaStatus).toBeDefined();
  });

  it('returns structured actionPack and qaStatus even if adapter throws', async () => {
    const spy = jest.spyOn(dailyBriefAdapter, 'runDailyBriefAdapter').mockImplementation(() => {
      throw new Error('not invoked');
    });
    const res = await request(app).post('/api/exec-admin/p0/daily-focus').send({ userId: 'darnell' });
    expect(res.status).toBe(200);
    expect(res.body.data.qaStatus).toBeDefined();
    expect(res.body.data.actionPack).toBeDefined();
    spy.mockRestore();
  });
});
