export const JOURNAL_INTENTS = [
  'journal.daily_reflection',
  'journal.midday_check_in',
  'journal.day_close',
] as const;

export type JournalIntent = typeof JOURNAL_INTENTS[number];
