import { JournalIntent } from './intents';
import { buildJournalArtifact, JournalArtifact } from './adapter';
import { getJournalPrompts } from './workflows';

export type JournalInput = {
  user: 'darnell' | 'shria';
  intent: JournalIntent;
  date?: string;
};

function resolveDate(date?: string): string {
  if (date) return date;
  return new Date().toISOString().slice(0, 10);
}

export async function runJournal(input: JournalInput): Promise<JournalArtifact> {
  const resolvedDate = resolveDate(input.date);
  const prompts = getJournalPrompts(input.intent);

  return buildJournalArtifact({
    intent: input.intent,
    date: resolvedDate,
    user: input.user,
    prompts,
  });
}
