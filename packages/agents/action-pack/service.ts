import { ActionPackIntent } from './intents';
import {
  ActionPackAction,
  ActionPackArtifact,
  ActionPackCalendarIntent,
  ActionPackFollowUp,
  buildActionPackArtifact,
} from './adapter';

export type ActionPackInput = {
  user: 'darnell' | 'shria';
  intent?: ActionPackIntent;
  date?: string;
  focusTheme?: string;
  priorities?: string[];
};

function resolveDate(date?: string): string {
  if (date) return date;
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultActions(focusTheme: string, priorities: string[]): ActionPackAction[] {
  const actions: ActionPackAction[] = [];
  const base = priorities.length ? priorities : ['Protect the main focus block', 'Ship one meaningful update'];
  base.forEach((item, idx) => {
    actions.push({
      id: `action-${idx + 1}`,
      title: item,
      detail: `${focusTheme} - move this forward today.`,
      status: 'draft',
    });
  });
  return actions;
}

function buildDefaultFollowUps(user: ActionPackInput['user']): ActionPackFollowUp[] {
  return [
    {
      channel: 'email',
      to: user === 'darnell' ? 'darnell' : 'shria',
      subject: 'Draft follow-up',
      body: 'Draft-only: capture the next step for today.',
      status: 'draft',
    },
  ];
}

function buildDefaultCalendarIntents(date: string, focusTheme: string): ActionPackCalendarIntent[] {
  return [
    {
      title: `Focus block: ${focusTheme}`,
      startISO: `${date}T16:00:00Z`,
      endISO: `${date}T17:30:00Z`,
      durationMinutes: 90,
      notes: 'Draft-only calendar intent.',
      status: 'draft',
    },
  ];
}

export async function runActionPack(input: ActionPackInput): Promise<ActionPackArtifact> {
  const resolvedDate = resolveDate(input.date);
  const intent: ActionPackIntent = input.intent || 'action_pack.generate';
  const focusTheme = input.focusTheme || 'Focus on the single most valuable priority';
  const priorities = input.priorities || [];

  const actions = buildDefaultActions(focusTheme, priorities);
  const followUps = buildDefaultFollowUps(input.user);
  const calendarIntentsDraft = buildDefaultCalendarIntents(resolvedDate, focusTheme);

  return buildActionPackArtifact({
    intent,
    date: resolvedDate,
    user: input.user,
    actions,
    followUps,
    calendarIntentsDraft,
    metadata: {
      userId: input.user,
      generatedAt: new Date().toISOString(),
      focusTheme,
    },
  });
}
