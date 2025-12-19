import { JournalIntent } from './intents';

export type JournalResponse = {
  question: string;
  answer: string;
};

export type JournalArtifact = {
  intent: JournalIntent;
  date: string;
  user: 'darnell' | 'shria';
  prompts: string[];
  responses: JournalResponse[];
  insights: string[];
  nextSteps: string[];
  mood: string | null;
  values: string[] | null;
};

export function buildJournalArtifact(input: {
  intent: JournalIntent;
  date: string;
  user: 'darnell' | 'shria';
  prompts: string[];
}): JournalArtifact {
  const responses = input.prompts.map((prompt) => ({
    question: prompt,
    answer: '',
  }));

  return {
    intent: input.intent,
    date: input.date,
    user: input.user,
    prompts: input.prompts,
    responses,
    insights: [],
    nextSteps: [],
    mood: null,
    values: input.intent === 'journal.daily_reflection' ? [] : null,
  };
}
