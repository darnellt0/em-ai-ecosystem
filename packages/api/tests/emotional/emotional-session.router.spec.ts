import request from 'supertest';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return { activityLogService: { logAgentRun } };
});

jest.mock('../../src/growth-agents/orchestrator', () => ({
  orchestrator: {
    launchAgent: jest.fn().mockResolvedValue({ jobId: 'agent-growth.journal-123' }),
  },
}));

jest.mock('../../src/services/growthAgents.service', () => ({
  resolveGrowthAgent: () => async () => ({
    summary: 'ok',
    insights: [],
    recommendations: [],
    metadata: {},
  }),
}));

jest.mock('../../src/services/database.service', () => ({
  databaseService: {
    getPool: jest.fn(() => null),
  },
}));

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: jest.fn(),
  getVoiceRealtimeWSS: jest.fn(),
}));

jest.mock('../../src/emotional/emotional-session.service', () => {
  const runSession = jest.fn().mockResolvedValue({
    reply: 'Test reply',
    routedAgents: ['growth.journal'],
    featureId: 'mood-sculptor',
  });
  return { emotionalSessionService: { runSession } };
});

let app: any;

beforeAll(() => {
  process.env.PORT = '0';
  process.env.ENABLE_GROWTH_AGENTS = 'true';
  app = require('../../src').default;
});

describe('POST /em-ai/emotional-session', () => {
  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/em-ai/emotional-session').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 on valid payload', async () => {
    const res = await request(app)
      .post('/em-ai/emotional-session')
      .send({ featureId: 'mood-sculptor', message: 'I feel overwhelmed' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.routedAgents).toBeDefined();
  });
});
