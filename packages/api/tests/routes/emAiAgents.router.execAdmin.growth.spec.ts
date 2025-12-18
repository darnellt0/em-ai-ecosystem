import request from 'supertest';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return { activityLogService: { logAgentRun } };
});

jest.mock('../../src/growth-agents/orchestrator', () => ({
  AGENT_CONFIG: {
    journal: {},
    niche: {},
    mindset: {},
    rhythm: {},
    purpose: {},
    'growth.journal': {},
    'growth.niche': {},
    'growth.mindset': {},
    'growth.rhythm': {},
    'growth.purpose': {},
  },
  orchestrator: {
    launchAllAgents: jest.fn().mockResolvedValue({
      jobIds: [
        'agent-journal-1',
        'agent-niche-1',
        'agent-mindset-1',
        'agent-rhythm-1',
        'agent-purpose-1',
        'agent-growth.journal-1',
        'agent-growth.niche-1',
        'agent-growth.mindset-1',
        'agent-growth.rhythm-1',
        'agent-growth.purpose-1',
      ],
      count: 10,
    }),
    getHealth: jest.fn().mockResolvedValue({
      redis: 'OK',
      queue: 'OK',
      agentRegistry: [
        'journal',
        'niche',
        'mindset',
        'rhythm',
        'purpose',
        'growth.journal',
        'growth.niche',
        'growth.mindset',
        'growth.rhythm',
        'growth.purpose',
      ],
      workers: 0,
    }),
    getMonitorData: jest.fn().mockResolvedValue({
      progress: [{ agent: 'growth.journal', note: 'done', timestamp: new Date().toISOString() }],
      events: [{ agent: 'growth.journal', kind: 'complete', timestamp: new Date().toISOString() }],
    }),
  },
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

let app: any;

beforeAll(() => {
  process.env.PORT = '0';
  process.env.ENABLE_GROWTH_AGENTS = 'true';
  app = require('../../src').default;
});

describe('Exec Admin Growth endpoints', () => {
  it('POST /em-ai/exec-admin/growth/run returns 400 without founderEmail', async () => {
    const res = await request(app).post('/em-ai/exec-admin/growth/run').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /em-ai/exec-admin/growth/run launches growth pack', async () => {
    const res = await request(app)
      .post('/em-ai/exec-admin/growth/run')
      .send({ founderEmail: 'founder@example.com', mode: 'full' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobIds.length).toBeGreaterThanOrEqual(5);
    expect(res.body.launchedAgents).toContain('growth.journal');
  });

  it('GET /em-ai/exec-admin/growth/status returns orchestrator status', async () => {
    const res = await request(app).get('/em-ai/exec-admin/growth/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.agentRegistryCount).toBe(10);
    expect(Array.isArray(res.body.agents)).toBe(true);
    expect(Array.isArray(res.body.recentProgress)).toBe(true);
    expect(Array.isArray(res.body.recentEvents)).toBe(true);
  });
});
