import request from 'supertest';
import app from '../../src/index';
import { resetActionsForTest } from '../../src/actions/action.store';

jest.mock('../../src/services/growthAgents.service', () => ({
  runJournalAgent: jest.fn().mockResolvedValue({ summary: 'journal', insights: [{ title: 'j', detail: 'j' }], recommendations: [] }),
  runNicheAgent: jest.fn().mockResolvedValue({ summary: 'niche', insights: [{ title: 'n', detail: 'n' }], recommendations: [] }),
  runMindsetAgent: jest.fn().mockResolvedValue({ summary: 'mindset', insights: [{ title: 'm', detail: 'm' }], recommendations: [] }),
  runRhythmAgent: jest.fn().mockResolvedValue({ summary: 'rhythm', insights: [{ title: 'r', detail: 'r' }], recommendations: [] }),
  runPurposeAgent: jest.fn().mockResolvedValue({ summary: 'purpose', insights: [{ title: 'p', detail: 'p' }], recommendations: [] }),
}));

describe('Growth Exec Admin Integration', () => {
  beforeEach(() => {
    resetActionsForTest();
  });

  it('runs growth pack and plans actions', async () => {
    const res = await request(app).post('/em-ai/exec-admin/growth/run').send({ founderEmail: 'test@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const pending = await request(app).get('/api/actions/pending');
    expect(pending.status).toBe(200);
    expect(pending.body.actions.length).toBeGreaterThan(0);
  });
});
