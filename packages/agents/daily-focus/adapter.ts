import { DailyFocusIntent } from './intents';

export type DailyFocusPriority = {
  title: string;
  detail: string;
  urgency?: 'low' | 'medium' | 'high';
};

export type DailyFocusEmailDraft = {
  subject: string;
  body: string;
  status: 'draft';
};

export type DailyFocusMetadata = {
  userId: 'darnell' | 'shria';
  mode: 'founder' | 'operator' | 'client_preview';
  generatedAt: string;
};

export type DailyFocusArtifact = {
  intent: DailyFocusIntent;
  date: string;
  user: 'darnell' | 'shria';
  focusTheme: string;
  priorities: DailyFocusPriority[];
  emailDraft: DailyFocusEmailDraft;
  metadata: DailyFocusMetadata;
};

export function buildDailyFocusArtifact(input: {
  intent: DailyFocusIntent;
  date: string;
  user: 'darnell' | 'shria';
  focusTheme: string;
  priorities: DailyFocusPriority[];
  emailDraft: DailyFocusEmailDraft;
  metadata: DailyFocusMetadata;
}): DailyFocusArtifact {
  return {
    intent: input.intent,
    date: input.date,
    user: input.user,
    focusTheme: input.focusTheme,
    priorities: input.priorities,
    emailDraft: input.emailDraft,
    metadata: input.metadata,
  };
}
