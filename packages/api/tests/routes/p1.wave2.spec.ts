import request from 'supertest';
import { runP0QaGate } from '../../src/services/p0QaGate.service';
import { runP1InboxAssistant } from '../../src/exec-admin/flows/p1-inbox-assistant';
import { runP1DeepWorkDefender } from '../../src/exec-admin/flows/p1-deep-work-defender';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../src/index').default || require('../../src/index');

describe('P1 Wave 2 - Inbox Assistant + Deep Work Defender', () => {
  it('inbox_assistant returns required structure and QA passes', async () => {
    const result = await runP1InboxAssistant({
      userId: 'founder@test.com',
      mode: 'offline',
      includeDrafts: true,
    });

    const qa = runP0QaGate('inboxAssistant', result.data);
    expect(qa.qa_pass).toBe(true);
    expect(result.data.topEmails.length).toBeGreaterThan(0);
  });

  it('inbox_assistant fails QA when topEmails missing required fields', () => {
    const output = {
      userId: 'founder@test.com',
      mode: 'offline',
      summary: {
        total: 1,
        urgent: 1,
        important: 0,
        needsReply: 0,
        readLater: 0,
      },
      topEmails: [
        {
          id: 'email-1',
          subject: 'Missing from field',
          snippet: 'Snippet here',
        },
      ],
      recommendedActions: ['Reply quickly'],
      offline: true,
      generatedAt: '2025-12-24T12:00:00Z',
    };

    const qa = runP0QaGate('inboxAssistant', output);
    expect(qa.qa_pass).toBe(false);
    expect(qa.issues.some((issue) => issue.field === 'topEmails[0].from')).toBe(true);
  });

  it('deep_work_defender returns suggestedFocusBlocks and QA passes', async () => {
    const result = await runP1DeepWorkDefender({
      userId: 'founder@test.com',
      mode: 'offline',
      horizonDays: 7,
      targetFocusMinutes: 180,
    });

    const qa = runP0QaGate('deepWorkDefender', result.data);
    expect(qa.qa_pass).toBe(true);
    expect(result.data.suggestedFocusBlocks.length).toBeGreaterThan(0);
  });

  it('deep_work_defender fails QA when meetingLoad missing', () => {
    const output = {
      userId: 'founder@test.com',
      mode: 'offline',
      horizonDays: 7,
      targetFocusMinutes: 180,
      workdayStart: '09:00',
      workdayEnd: '17:00',
      suggestedFocusBlocks: [
        {
          start: '2025-12-24T09:00:00Z',
          end: '2025-12-24T10:30:00Z',
          minutes: 90,
          reason: 'Focus',
        },
      ],
      conflicts: [],
      recommendations: ['Protect focus time'],
      offline: true,
      generatedAt: '2025-12-24T12:00:00Z',
    };

    const qa = runP0QaGate('deepWorkDefender', output);
    expect(qa.qa_pass).toBe(false);
    expect(qa.issues.some((issue) => issue.field === 'meetingLoad')).toBe(true);
  });

  it('dispatcher handles both intents with 200', async () => {
    const inboxRes = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({
        intent: 'inbox_assistant',
        payload: {
          userId: 'founder@elevatedmovements.com',
          mode: 'offline',
          includeDrafts: true,
        },
      });

    expect(inboxRes.status).toBe(200);
    expect(inboxRes.body.qa?.pass).toBe(true);

    const deepWorkRes = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({
        intent: 'deep_work_defender',
        payload: {
          userId: 'founder@elevatedmovements.com',
          mode: 'offline',
          horizonDays: 7,
          targetFocusMinutes: 180,
        },
      });

    expect(deepWorkRes.status).toBe(200);
    expect(deepWorkRes.body.qa?.pass).toBe(true);
  });

  it('health_check includes P1 agents', async () => {
    const res = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({ intent: 'health_check' });

    expect(res.status).toBe(200);
    expect(res.body.data?.p1Agents).toBeDefined();
    expect(res.body.data?.p1Agents?.inbox_assistant).toBeDefined();
    expect(res.body.data?.p1Agents?.deep_work_defender).toBeDefined();
    expect(res.body.data?.p1Status).toBeDefined();
  });
});
