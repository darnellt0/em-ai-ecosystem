import { JournalArtifact, JournalIntent, runJournal } from '../../../agents/journal';

export async function runJournalAgent(input: {
  user: 'darnell' | 'shria';
  intent: JournalIntent;
  date?: string;
}): Promise<JournalArtifact> {
  return runJournal({
    user: input.user,
    intent: input.intent,
    date: input.date,
  });
}
