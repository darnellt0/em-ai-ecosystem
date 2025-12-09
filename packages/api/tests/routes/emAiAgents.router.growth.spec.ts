import request from 'supertest';
import app from '../../src';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return { activityLogService: { logAgentRun } };
});

jest.mock('../../src/services/dailyBrief.service', () => ({
  runDailyBriefAgent: jest.fn(),
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

describe('emAiAgentsRouter - growth agents', () => {
  it('runs journal growth agent via API route', async () => {
    const res = await request(app)
      .post('/em-ai/agents/journal/run')
      .send({ input: { founderEmail: 'founder@example.com' } });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.outputText || res.body.result.summary).toBeDefined();
  });

  it('runs niche growth agent via API route', async () => {
    const res = await request(app)
      .post('/em-ai/agents/niche/run')
      .send({ input: { founderEmail: 'founder@example.com' } });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
  });
});
