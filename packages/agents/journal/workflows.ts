import { JournalIntent } from './intents';

const DAILY_REFLECTION_PROMPTS = [
  'What energized you most today?',
  'What felt hardest or most draining today?',
  'What are you grateful for right now?',
  'Which values did you honor today?',
];

const MIDDAY_CHECK_IN_PROMPTS = [
  'What have you moved forward so far today?',
  'What is the biggest blocker right now?',
];

const DAY_CLOSE_PROMPTS = [
  'What were your top wins today?',
  'What did you learn or notice today?',
  'What is the single most important thing for tomorrow?',
];

export const JOURNAL_PROMPTS: Record<JournalIntent, string[]> = {
  'journal.daily_reflection': DAILY_REFLECTION_PROMPTS,
  'journal.midday_check_in': MIDDAY_CHECK_IN_PROMPTS,
  'journal.day_close': DAY_CLOSE_PROMPTS,
};

export function getJournalPrompts(intent: JournalIntent): string[] {
  return JOURNAL_PROMPTS[intent] || [];
}
