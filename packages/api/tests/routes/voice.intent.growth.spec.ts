import request from 'supertest';

const mockLaunchGrowthPack = jest.fn();

jest.mock('../../src/services/emAi.service', () => ({
  launchGrowthPack: (...args: any[]) => mockLaunchGrowthPack(...args),
  getGrowthStatus: jest.fn(),
  callEmAgent: jest.fn(),
}));

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
      jobIds: Array.from({ length: 10 }, (_, i) => `agent-${i}`),
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
      progress: [],
      events: [],
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
  process.env.FOUNDER_SHRIA_EMAIL = 'shria@elevatedmovements.com';
  process.env.EM_ENABLE_VOICE = 'true';
  app = require('../../src').default;
});

beforeEach(() => {
  mockLaunchGrowthPack.mockReset();
});

describe('Voice Intent - growth_check_in', () => {
  it('launches growth pack with explicit metadata', async () => {
    mockLaunchGrowthPack.mockResolvedValue({
      success: true,
      mode: 'full',
      launchedAgents: Array.from({ length: 10 }, (_, i) => `agent-${i}`),
      jobIds: Array.from({ length: 10 }, (_, i) => `job-${i}`),
      timestamp: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/voice/intent')
      .send({
        intent: 'growth_check_in',
        metadata: {
          founderEmail: 'founder@example.com',
          mode: 'full',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.intent).toBe('growth_check_in');
    expect(res.body.data.launchedAgents).toHaveLength(10);
    expect(res.body.data.jobIds).toHaveLength(10);
    expect(mockLaunchGrowthPack).toHaveBeenCalledWith({ founderEmail: 'founder@example.com', mode: 'full' });
  });

  it('defaults founderEmail when not provided', async () => {
    mockLaunchGrowthPack.mockResolvedValue({
      success: true,
      mode: 'full',
      launchedAgents: Array.from({ length: 10 }, (_, i) => `agent-${i}`),
      jobIds: Array.from({ length: 10 }, (_, i) => `job-${i}`),
      timestamp: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/voice/intent')
      .send({
        intent: 'growth_check_in',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockLaunchGrowthPack).toHaveBeenCalledWith({ founderEmail: 'shria@elevatedmovements.com', mode: 'full' });
  });

  it('returns friendly error when launch fails', async () => {
    mockLaunchGrowthPack.mockRejectedValue(new Error('launch failed'));

    const res = await request(app)
      .post('/api/voice/intent')
      .send({
        intent: 'growth_check_in',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.intent).toBe('growth_check_in');
    expect(res.body.message).toContain('couldn’t start your Growth Pack');
  });
});
