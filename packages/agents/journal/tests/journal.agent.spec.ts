import { runJournal } from '../service';

describe('Journal agent', () => {
  it('builds daily reflection prompts with values', async () => {
    const result = await runJournal({ user: 'darnell', intent: 'journal.daily_reflection', date: '2025-01-01' });
    expect(result.prompts).toHaveLength(4);
    expect(result.values).toEqual([]);
  });

  it('builds midday check-in prompts', async () => {
    const result = await runJournal({ user: 'darnell', intent: 'journal.midday_check_in', date: '2025-01-01' });
    expect(result.prompts).toHaveLength(2);
    expect(result.values).toBeNull();
  });

  it('builds day close prompts', async () => {
    const result = await runJournal({ user: 'shria', intent: 'journal.day_close', date: '2025-01-01' });
    expect(result.prompts).toHaveLength(3);
  });
});
