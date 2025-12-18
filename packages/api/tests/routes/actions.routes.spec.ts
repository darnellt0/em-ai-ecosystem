import request from 'supertest';
import app from '../../src/index';
import { savePlannedAction, resetActionsForTest } from '../../src/actions/action.store';

describe('Actions Routes', () => {
  beforeEach(() => {
    resetActionsForTest();
  });

  it('returns pending actions', async () => {
    savePlannedAction({ type: 'gmail.draft_email', requiresApproval: true, payload: {} });
    const res = await request(app).get('/api/actions/pending');
    expect(res.status).toBe(200);
    expect(res.body.actions.length).toBeGreaterThan(0);
  });

  it('returns empty actions array when none planned', async () => {
    const res = await request(app).get('/api/actions/pending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.length).toBe(0);
  });
});
