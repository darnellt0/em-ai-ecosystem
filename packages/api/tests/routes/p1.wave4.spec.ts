import request from 'supertest';
import { runP0QaGate } from '../../src/services/p0QaGate.service';
import { runP1BrandStoryteller } from '../../src/exec-admin/flows/p1-brand-storyteller';
import { runP1MembershipGuardian } from '../../src/exec-admin/flows/p1-membership-guardian';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../src/index').default || require('../../src/index');

describe('P1 Wave 4 - Brand Storyteller + Membership Guardian', () => {
  it('dispatcher routes brand_story (offline) and qa.pass=true', async () => {
    const res = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({
        intent: 'brand_story',
        payload: {
          userId: 'founder@elevatedmovements.com',
          mode: 'offline',
          context: 'post',
          audience: 'community',
          content: 'Im hosting a session next week. Pull up.',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.qa?.pass).toBe(true);
  });

  it('brand_story fails QA when alignedContent missing', () => {
    const output = {
      runId: 'brand_test_1',
      userId: 'founder@test.com',
      context: 'post',
      audience: 'community',
      alignedContent: '',
      voiceNotes: ['Note'],
      confidenceScore: 0.7,
      recommendedNextAction: 'Confirm audience.',
    };

    const qa = runP0QaGate('brandStory', output);
    expect(qa.qa_pass).toBe(false);
    expect(qa.issues.some((issue) => issue.field === 'alignedContent')).toBe(true);
  });

  it('dispatcher routes membership_guardian (offline) and qa.pass=true', async () => {
    const res = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({
        intent: 'membership_guardian',
        payload: {
          memberId: 'm_123',
          mode: 'offline',
          timeframe: '30d',
          signals: {
            engagement: 2,
            missedTouchpoints: 4,
            sentiment: 'negative',
          },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.qa?.pass).toBe(true);
  });

  it('membership_guardian returns non-empty signalsDetected when status != healthy', async () => {
    const result = await runP1MembershipGuardian({
      memberId: 'm_456',
      mode: 'offline',
      timeframe: '30d',
      signals: {
        engagement: 2,
        missedTouchpoints: 4,
        sentiment: 'negative',
      },
    });

    expect(result.data.status).not.toBe('healthy');
    expect(result.data.signalsDetected.length).toBeGreaterThan(0);
  });

  it('low confidence path returns safe default and still qa.pass=true', async () => {
    const result = await runP1BrandStoryteller({
      userId: 'founder@test.com',
      mode: 'offline',
      context: 'post',
      audience: 'community',
      content: '',
    });

    const qa = runP0QaGate('brandStory', result.data);
    expect(result.data.confidenceScore).toBeLessThan(0.6);
    expect(qa.qa_pass).toBe(true);
  });

  it('health_check includes Wave 4 agents in p1Agents', async () => {
    const res = await request(app)
      .post('/api/exec-admin/dispatch')
      .send({ intent: 'health_check' });

    expect(res.status).toBe(200);
    expect(res.body.data?.p1Agents?.brand_story).toBeDefined();
    expect(res.body.data?.p1Agents?.membership_guardian).toBeDefined();
  });
});
