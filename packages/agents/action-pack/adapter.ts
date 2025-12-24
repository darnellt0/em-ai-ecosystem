import { ActionPackIntent } from './intents';

export type ActionPackAction = {
  id: string;
  title: string;
  detail: string;
  status: 'draft';
};

export type ActionPackFollowUp = {
  channel: 'email' | 'task';
  to?: string;
  subject?: string;
  body?: string;
  status: 'draft';
};

export type ActionPackCalendarIntent = {
  title: string;
  startISO?: string;
  endISO?: string;
  durationMinutes?: number;
  notes?: string;
  status: 'draft';
};

export type ActionPackMetadata = {
  userId: 'darnell' | 'shria';
  generatedAt: string;
  focusTheme?: string;
};

export type ActionPackArtifact = {
  intent: ActionPackIntent;
  date: string;
  user: 'darnell' | 'shria';
  actions: ActionPackAction[];
  followUps: ActionPackFollowUp[];
  calendarIntentsDraft: ActionPackCalendarIntent[];
  metadata: ActionPackMetadata;
};

export function buildActionPackArtifact(input: {
  intent: ActionPackIntent;
  date: string;
  user: 'darnell' | 'shria';
  actions: ActionPackAction[];
  followUps: ActionPackFollowUp[];
  calendarIntentsDraft: ActionPackCalendarIntent[];
  metadata: ActionPackMetadata;
}): ActionPackArtifact {
  return {
    intent: input.intent,
    date: input.date,
    user: input.user,
    actions: input.actions,
    followUps: input.followUps,
    calendarIntentsDraft: input.calendarIntentsDraft,
    metadata: input.metadata,
  };
}
