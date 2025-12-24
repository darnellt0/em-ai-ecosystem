import { runActionPack } from '../service';

describe('Action Pack agent', () => {
  it('returns draft actions, follow-ups, and calendar intents', async () => {
    const result = await runActionPack({ user: 'shria', date: '2025-01-01' });
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.followUps.length).toBeGreaterThan(0);
    expect(result.calendarIntentsDraft.length).toBeGreaterThan(0);
    expect(result.actions[0].status).toBe('draft');
  });
});
