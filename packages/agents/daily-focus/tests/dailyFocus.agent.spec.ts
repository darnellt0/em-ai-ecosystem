import { runDailyFocus } from '../service';

describe('Daily Focus agent', () => {
  it('returns priorities, theme, and draft email', async () => {
    const result = await runDailyFocus({ user: 'darnell', date: '2025-01-01' });
    expect(result.priorities.length).toBeGreaterThan(0);
    expect(result.focusTheme).toBeTruthy();
    expect(result.emailDraft.status).toBe('draft');
  });
});
