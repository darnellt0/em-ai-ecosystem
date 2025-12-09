import request from 'supertest';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return { activityLogService: { logAgentRun } };
});

jest.mock('../../src/services/dailyBrief.service', () => ({
  runDailyBriefAgent: jest.fn(),
}));

jest.mock('../../src/growth-agents/orchestrator', () => ({
  orchestrator: {
    launchAgent: jest.fn().mockResolvedValue({ jobId: 'agent-growth.journal-123' }),
  },
}));

jest.mock('../../src/services/growthAgents.service', () => {
  const runJournalAgent = jest.fn().mockResolvedValue({
    summary: 'ok',
    insights: [],
    recommendations: [],
    metadata: {},
  });
  return {
    resolveGrowthAgent: (key: string) => (key === 'growth.journal' ? runJournalAgent : null),
    runJournalAgent,
  };
});

jest.mock('../../src/services/emAi.service', () => {
  return {
    callEmAgent: jest.fn().mockResolvedValue({
      outputText: 'ok',
      meta: { summary: 'ok', insights: [] },
    }),
  };
});

jest.mock('../../src/services/database.service', () => ({
  databaseService: {
    getPool: jest.fn(() => null),
  },
}));

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: jest.fn(),
  getVoiceRealtimeWSS: jest.fn(),
}));

let app: any;

beforeAll(() => {
  process.env.PORT = '0';
  process.env.ENABLE_GROWTH_AGENTS = 'true';
  app = require('../../src').default;
});

describe('emAiAgentsRouter - growth agents', () => {
  it('runs journal growth agent via API route', async () => {
    const res = await request(app)
      .post('/em-ai/agents/journal/run')
      .send({ input: { founderEmail: 'founder@example.com', prompt: 'Test prompt' } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.agent).toBe('growth.journal');
    expect(res.body.jobId).toBeDefined();
  });

  it('returns 400 when journal payload is missing founderEmail or prompt', async () => {
    const res = await request(app)
      .post('/em-ai/agents/journal/run')
      .send({ input: { founderEmail: '', prompt: '' } });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('runs niche growth agent via API route', async () => {
    const res = await request(app)
      .post('/em-ai/agents/niche/run')
      .send({ input: { founderEmail: 'founder@example.com' } });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
  });
});
