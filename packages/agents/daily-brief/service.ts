import { AgentOutput } from '../../shared/contracts';

export type DailyBriefIntent = 'daily_brief.generate';

export interface DailyBriefPayload {
  user: 'darnell' | 'shria';
  date?: string;
  runId?: string;
}

export interface DailyBriefItem {
  title: string;
  why: string;
  nextStep: string;
}

export interface DailyBriefAction {
  type: 'task' | 'email_draft' | 'calendar_block';
  title: string;
  details: string;
}

export interface DailyBriefDependencies {
  priorities?: {
    fetchTopPriorities(user: DailyBriefPayload['user'], date: string): Promise<DailyBriefItem[]>;
  };
  calendar?: {
    summarizeDay(user: DailyBriefPayload['user'], date: string): Promise<{ meetings: number; highlights: string[] }>;
    suggestFocusBlock?(user: DailyBriefPayload['user'], date: string): Promise<{ start: string; end: string; theme: string }>;
  };
  inbox?: {
    fetchHighlights(user: DailyBriefPayload['user'], date: string): Promise<{ from: string; subject: string; whyImportant: string }[]>;
  };
  actions?: {
    suggestActions(
      user: DailyBriefPayload['user'],
      date: string
    ): Promise<Array<{ type: DailyBriefAction['type']; title: string; details: string }>>;
  };
  logger?: { info(message: string, meta?: Record<string, any>): void; warn?(message: string, meta?: Record<string, any>): void };
  version?: string;
}

export interface DailyBriefResult {
  date: string;
  topPriorities: DailyBriefItem[];
  focusBlock: { start: string; end: string; theme: string };
  calendarSummary: { meetings: number; highlights: string[] };
  inboxHighlights: { items: { from: string; subject: string; whyImportant: string }[] };
  risks: string[];
  suggestedActions: DailyBriefAction[];
}

function ensureIsoDate(date?: string): string {
  if (!date) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function defaultFocusBlock(): { start: string; end: string; theme: string } {
  const today = ensureIsoDate();
  return { start: `${today}T09:00:00Z`, end: `${today}T10:30:00Z`, theme: 'Deep work: unblock the most valuable task' };
}

export async function generateDailyBrief(
  payload: DailyBriefPayload,
  deps: DailyBriefDependencies = {}
): Promise<{ output: DailyBriefResult; warnings: string[] }> {
  const logger = deps.logger || console;
  const runId = payload.runId;
  const date = ensureIsoDate(payload.date);
  logger.info('[DailyBrief] start', { user: payload.user, date, runId });

  const warnings: string[] = [];

  const topPriorities = await (async () => {
    try {
      if (!deps.priorities) {
        warnings.push('priorities.integration_missing');
        return [];
      }
      return await deps.priorities.fetchTopPriorities(payload.user, date);
    } catch (err: any) {
      warnings.push('priorities.unavailable');
      logger.warn?.('[DailyBrief] priorities unavailable', { error: err?.message, runId });
      return [];
    }
  })();

  const calendarSummary = await (async () => {
    try {
      if (!deps.calendar) {
        warnings.push('calendar.integration_missing');
        return { meetings: 0, highlights: [] as string[] };
      }
      return await deps.calendar.summarizeDay(payload.user, date);
    } catch (err: any) {
      warnings.push('calendar.unavailable');
      logger.warn?.('[DailyBrief] calendar unavailable', { error: err?.message, runId });
      return { meetings: 0, highlights: [] as string[] };
    }
  })();

  const focusBlock = await (async () => {
    try {
      if (!deps.calendar?.suggestFocusBlock) {
        warnings.push('focus_block.integration_missing');
        return defaultFocusBlock();
      }
      return await deps.calendar.suggestFocusBlock(payload.user, date);
    } catch (err: any) {
      warnings.push('focus_block.unavailable');
      logger.warn?.('[DailyBrief] focus block unavailable', { error: err?.message, runId });
      return defaultFocusBlock();
    }
  })();

  const inboxItems = await (async () => {
    try {
      if (!deps.inbox) {
        warnings.push('inbox.integration_missing');
        return [];
      }
      return await deps.inbox.fetchHighlights(payload.user, date);
    } catch (err: any) {
      warnings.push('inbox.unavailable');
      logger.warn?.('[DailyBrief] inbox unavailable', { error: err?.message, runId });
      return [];
    }
  })();

  const suggestedActions = await (async () => {
    try {
      if (!deps.actions) {
        warnings.push('actions.integration_missing');
        return deriveActionsFromPriorities(topPriorities, focusBlock);
      }
      return await deps.actions.suggestActions(payload.user, date);
    } catch (err: any) {
      warnings.push('actions.unavailable');
      logger.warn?.('[DailyBrief] actions unavailable', { error: err?.message, runId });
      return deriveActionsFromPriorities(topPriorities, focusBlock);
    }
  })();

  const risks = deriveRisks(calendarSummary, inboxItems);

  const output: DailyBriefResult = {
    date,
    topPriorities: topPriorities.map((p) => ({
      title: p.title,
      why: p.why,
      nextStep: p.nextStep,
    })),
    focusBlock,
    calendarSummary: {
      meetings: calendarSummary.meetings || 0,
      highlights: calendarSummary.highlights || [],
    },
    inboxHighlights: { items: inboxItems.map((i) => ({ from: i.from, subject: i.subject, whyImportant: i.whyImportant })) },
    risks,
    suggestedActions: suggestedActions.map((a) => ({ type: a.type, title: a.title, details: a.details })),
  };

  return { output, warnings };
}

function deriveActionsFromPriorities(priorities: DailyBriefItem[], focusBlock: DailyBriefResult['focusBlock']): DailyBriefAction[] {
  const actions: DailyBriefAction[] = [];
  if (priorities[0]) {
    actions.push({
      type: 'task',
      title: priorities[0].title,
      details: `Move the needle: ${priorities[0].nextStep}`,
    });
  }
  actions.push({
    type: 'calendar_block',
    title: 'Protect focus block',
    details: `${focusBlock.start} to ${focusBlock.end} — ${focusBlock.theme}`,
  });
  return actions;
}

function deriveRisks(calendarSummary: { meetings: number; highlights: string[] }, inboxItems: { from: string; subject: string }[]): string[] {
  const risks: string[] = [];
  if (calendarSummary.meetings > 6) {
    risks.push('Heavy meeting load — risk to focus time');
  }
  if (inboxItems.length > 5) {
    risks.push('Inbox may distract from priorities');
  }
  if (!risks.length) {
    risks.push('Stay disciplined: finish the top priority before noon');
  }
  return risks;
}

export async function runDailyBriefService(payload: DailyBriefPayload, deps: DailyBriefDependencies = {}): Promise<AgentOutput<DailyBriefResult>> {
  if (!payload?.user || !['darnell', 'shria'].includes(payload.user)) {
    return { status: 'FAILED', error: 'user must be one of: darnell | shria' };
  }

  const started = Date.now();
  try {
    const { output, warnings } = await generateDailyBrief(payload, deps);
    const latencyMs = Date.now() - started;
    deps.logger?.info?.('[DailyBrief] complete', { user: payload.user, runId: payload.runId, latencyMs });
    return { status: 'OK', output, warnings };
  } catch (err: any) {
    return { status: 'FAILED', error: err?.message || 'daily brief failed' };
  }
}

export async function dailyBriefHealth(deps: Pick<DailyBriefDependencies, 'version'> = {}): Promise<{ ok: boolean; latencyMs: number; version: string }> {
  const started = Date.now();
  const version = deps.version || '1.0.0';
  return { ok: true, latencyMs: Date.now() - started, version };
}
