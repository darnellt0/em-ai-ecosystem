process.env.PORT = '0';

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: () => {},
}));

import request from 'supertest';
import app from '../../src';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return { activityLogService: { logAgentRun } };
});

jest.mock('../../src/services/dailyBrief.service', () => {
  return {
    runDailyBriefAgent: jest.fn().mockResolvedValue({
      date: '2025-01-01',
      userId: 'darnell',
      priorities: [],
      agenda: [],
      tasks: [],
      inboxHighlights: [],
      suggestedFocusWindows: [],
      rendered: { text: 'Hello brief', html: '<p>Hello</p>' },
    }),
  };
});

const { activityLogService } = require('../../src/services/activity-log.service');
const { runDailyBriefAgent } = require('../../src/services/dailyBrief.service');

describe('Daily Brief API integration', () => {
  it('returns a daily brief result', async () => {
    const res = await request(app).post('/api/agents/daily-brief/run').send({ userId: 'darnell' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.date).toBeDefined();
    expect(res.body.result.rendered.text).toContain('Hello');
    expect(runDailyBriefAgent).toHaveBeenCalled();
  });
});
