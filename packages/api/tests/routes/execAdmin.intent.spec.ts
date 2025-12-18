import request from 'supertest';

jest.mock('../../src/exec-admin/flows/p0-daily-focus', () => {
  const mockFn = jest.fn(async () => ({
    data: {
      qaStatus: 'PASS',
      actionPack: { status: 'ready' },
    },
  }));
  return { runP0DailyFocusExecAdmin: mockFn };
});

// Import app after mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../src/index').default || require('../../src/index');
const { runP0DailyFocusExecAdmin } = require('../../src/exec-admin/flows/p0-daily-focus');

describe('Exec Admin intent router', () => {
  it('routes p0.daily_focus intent to daily focus flow and returns qa/data', async () => {
    const res = await request(app)
      .post('/em-ai/exec-admin')
      .send({ intent: 'p0.daily_focus', payload: { userId: 'darnell' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.actionPack).toBeDefined();
    expect(res.body.data.actionPack.status).toBeDefined();
    expect(res.body.qaStatus || res.body.data.qaStatus).toBeDefined();
  });

  it('rejects missing intent', async () => {
    const res = await request(app).post('/em-ai/exec-admin').send({});
    expect(res.status).toBe(400);
  });

  it('returns blocked actionPack when QA fails', async () => {
    runP0DailyFocusExecAdmin.mockResolvedValueOnce({
      data: {
        qaStatus: 'FAIL',
        qaReasons: ['forced fail'],
        actionPack: { status: 'blocked', blockers: ['forced fail'] },
      },
    });

    const res = await request(app)
      .post('/em-ai/exec-admin')
      .send({ intent: 'p0.daily_focus', payload: { userId: 'darnell' } });

    expect(res.status).toBe(200);
    expect(res.body.data.actionPack).toBeDefined();
    expect(res.body.data.actionPack.status).toBe('blocked');
    expect(res.body.data.actionPack.blockers?.length).toBeGreaterThan(0);
  });
});
