import { DailyFocusIntent } from './intents';
import { DailyFocusArtifact, DailyFocusPriority, buildDailyFocusArtifact } from './adapter';

export type DailyFocusInput = {
  user: 'darnell' | 'shria';
  intent?: DailyFocusIntent;
  date?: string;
  mode?: 'founder' | 'operator' | 'client_preview';
  focusTheme?: string;
  priorities?: DailyFocusPriority[];
};

function resolveDate(date?: string): string {
  if (date) return date;
  return new Date().toISOString().slice(0, 10);
}

function defaultPriorities(): DailyFocusPriority[] {
  return [
    { title: 'Protect the top priority', detail: 'Block a 90-minute focus session', urgency: 'high' },
    { title: 'Move the key relationship forward', detail: 'Send a short update or ask', urgency: 'medium' },
    { title: 'Clear one operational blocker', detail: 'Delegate or document a decision', urgency: 'medium' },
  ];
}

export async function runDailyFocus(input: DailyFocusInput): Promise<DailyFocusArtifact> {
  const resolvedDate = resolveDate(input.date);
  const intent: DailyFocusIntent = input.intent || 'daily_focus.generate';
  const focusTheme = input.focusTheme || 'Defend a single 90-minute focus block today';
  const priorities = input.priorities?.length ? input.priorities : defaultPriorities();
  const mode = input.mode || 'founder';

  const emailDraft = {
    subject: `Daily Focus: ${focusTheme}`,
    body: [
      `Theme: ${focusTheme}`,
      '',
      'Top priorities:',
      ...priorities.map((p, idx) => `${idx + 1}. ${p.title} - ${p.detail}`),
      '',
      'Draft-only. Review and send when ready.',
    ].join('\n'),
    status: 'draft' as const,
  };

  return buildDailyFocusArtifact({
    intent,
    date: resolvedDate,
    user: input.user,
    focusTheme,
    priorities,
    emailDraft,
    metadata: {
      userId: input.user,
      mode,
      generatedAt: new Date().toISOString(),
    },
  });
}
