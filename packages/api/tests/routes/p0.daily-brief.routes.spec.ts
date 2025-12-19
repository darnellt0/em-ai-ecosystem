process.env.PORT = '0';

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

const runsDir = path.join(os.tmpdir(), 'p0-run-tests');
process.env.P0_RUN_DATA_DIR = runsDir;

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: () => {},
}));

jest.mock('../../src/services/dailyBrief.service', () => ({
  runDailyBriefAgent: jest.fn().mockResolvedValue({
    date: '2025-01-01',
    userId: 'darnell',
    priorities: ['Priority A'],
    agenda: ['Meeting 1'],
    tasks: ['Task 1'],
    inboxHighlights: ['Inbox item'],
    suggestedFocusWindows: [{ start: '2025-01-01T09:00:00', end: '2025-01-01T10:00:00', reason: 'Deep work' }],
    rendered: { text: 'Daily brief text' },
  }),
}));

import app from '../../src';

describe('P0 Daily Brief Exec Admin routes', () => {
  beforeAll(() => {
    if (fs.existsSync(runsDir)) {
      fs.rmSync(runsDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(runsDir)) {
      fs.rmSync(runsDir, { recursive: true, force: true });
    }
  });

  it('creates a daily brief run and stores artifact', async () => {
    const res = await request(app)
      .post('/api/exec-admin/p0/daily-brief')
      .send({ user: 'darnell', runId: 'test-run-1' });

    expect(res.status).toBe(200);
    expect(res.body.runId).toBe('test-run-1');
    expect(res.body.kind).toBe('p0.daily_brief');
    expect(res.body.artifact?.date).toBe('2025-01-01');
  });

  it('lists recent runs', async () => {
    const res = await request(app)
      .get('/api/exec-admin/p0/daily-brief/runs?limit=20');

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].runId).toBe('test-run-1');
  });

  it('reads a run artifact', async () => {
    const res = await request(app)
      .get('/api/exec-admin/p0/daily-brief/runs/test-run-1');

    expect(res.status).toBe(200);
    expect(res.body.runId).toBe('test-run-1');
    expect(res.body.artifact?.date).toBe('2025-01-01');
  });
});
