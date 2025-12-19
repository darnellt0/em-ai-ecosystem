import { GrowthRunRecord } from './growthRunHistory.service';

type ProgressItem = { agent?: string; percent?: number | string; note?: string; timestamp?: string };
type EventItem = { agent?: string; kind?: string; payload?: any; timestamp?: string };

export interface GrowthRunSummary {
  runId: string;
  founderEmail: string;
  mode: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  agents: {
    total: number;
    launched: string[];
    completed: string[];
    failed: string[];
    running: string[];
    queued: string[];
  };
  progress: {
    latest: ProgressItem[];
    byAgent: Record<string, { latestPercent?: number; latestNote?: string; lastAt?: string }>;
  };
  events: {
    latest: EventItem[];
    countsByKind: Record<string, number>;
  };
}

const MAX_ITEMS = 10;

function toArray<T>(val?: T[]): T[] {
  return Array.isArray(val) ? val : [];
}

function normalizePercent(p?: number | string) {
  if (p === undefined || p === null) return undefined;
  const num = typeof p === 'string' ? Number(p) : p;
  return Number.isFinite(num) ? num : undefined;
}

export function buildGrowthRunSummary(run: GrowthRunRecord, monitor?: { progress?: any[]; events?: any[] }): GrowthRunSummary {
  const launched = toArray(run.launchedAgents || []);
  const topProgress = toArray(run.summary?.topProgress).length
    ? toArray(run.summary?.topProgress)
    : toArray(monitor?.progress);
  const topEvents = toArray(run.summary?.topEvents).length ? toArray(run.summary?.topEvents) : toArray(monitor?.events);

  const progressLatest = topProgress.slice(0, MAX_ITEMS);
  const eventsLatest = topEvents.slice(0, MAX_ITEMS);

  const countsByKind: Record<string, number> = {};
  eventsLatest.forEach((evt) => {
    const k = evt?.kind || 'unknown';
    countsByKind[k] = (countsByKind[k] || 0) + 1;
  });

  const completed = new Set<string>(toArray(run.summary?.completedAgents));
  const failed = new Set<string>(toArray(run.summary?.failedAgents));

  eventsLatest.forEach((evt) => {
    const agent = evt?.agent;
    if (!agent) return;
    const kind = (evt.kind || '').toLowerCase();
    const payloadStr = typeof evt.payload === 'string' ? evt.payload : JSON.stringify(evt.payload || {});
    if (kind.includes('complete') || payloadStr.includes('complete')) {
      completed.add(agent);
      failed.delete(agent);
    }
    if (kind.includes('fail') || payloadStr.includes('error')) {
      failed.add(agent);
      completed.delete(agent);
    }
  });

  const byAgent: Record<string, { latestPercent?: number; latestNote?: string; lastAt?: string }> = {};
  progressLatest.forEach((p) => {
    const agent = p.agent || '';
    if (!agent) return;
    byAgent[agent] = {
      latestPercent: normalizePercent(p.percent),
      latestNote: p.note,
      lastAt: p.timestamp,
    };
  });

  const running = new Set<string>();
  const queued = new Set<string>(launched);
  progressLatest.forEach((p) => {
    const agent = p.agent;
    if (!agent) return;
    if (!completed.has(agent) && !failed.has(agent)) {
      running.add(agent);
    }
  });

  launched.forEach((agent) => {
    if (completed.has(agent) || failed.has(agent) || running.has(agent)) {
      queued.delete(agent);
    }
  });

  return {
    runId: run.runId,
    founderEmail: run.founderEmail,
    mode: run.mode,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    agents: {
      total: launched.length,
      launched,
      completed: Array.from(completed),
      failed: Array.from(failed),
      running: Array.from(running),
      queued: Array.from(queued),
    },
    progress: {
      latest: progressLatest,
      byAgent,
    },
    events: {
      latest: eventsLatest,
      countsByKind,
    },
  };
}
