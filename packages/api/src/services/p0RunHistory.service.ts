import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export type P0RunStatus = 'queued' | 'running' | 'complete' | 'failed' | 'blocked';

export interface P0RunRecord {
  runId: string;
  founderEmail: string;
  kind: 'p0.daily_focus' | 'p0.daily_brief' | string;
  date: string; // YYYY-MM-DD
  status: P0RunStatus;
  startedAt: string;
  finishedAt?: string;
  qaPassed?: boolean;
  qaBlocked?: boolean;
  actionPackSummary?: string;
  error?: string;
  artifact?: any;
}

const memoryRuns = new Map<string, P0RunRecord>();
const memoryIndex = new Map<string, string[]>(); // key = founderEmail:kind
let redisClient: Redis | null = null;
let redisInitTried = false;
const HISTORY_LIMIT = 50;

function ensureRedis() {
  if (redisInitTried) return redisClient;
  redisInitTried = true;
  const url = process.env.REDIS_URL;
  if (!url || process.env.NODE_ENV === 'test') return null;
  try {
    redisClient = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    redisClient.on('error', () => {});
  } catch {
    redisClient = null;
  }
  return redisClient;
}

function keyRun(runId: string) {
  return `p0:run:${runId}`;
}
function keyIndex(founderEmail: string, kind: string) {
  return `p0:run:index:${founderEmail}:${kind}`;
}
function keyLatest(founderEmail: string, date: string, kind: string) {
  return `p0:run:latest:${founderEmail}:${date}:${kind}`;
}

async function saveRunRedis(record: P0RunRecord) {
  const redis = ensureRedis();
  if (!redis) return;
  await redis.set(keyRun(record.runId), JSON.stringify(record));
  await redis.lpush(keyIndex(record.founderEmail, record.kind), record.runId);
  await redis.ltrim(keyIndex(record.founderEmail, record.kind), 0, HISTORY_LIMIT - 1);
  await redis.set(keyLatest(record.founderEmail, record.date, record.kind), record.runId);
}

async function getRunRedis(runId: string): Promise<P0RunRecord | null> {
  const redis = ensureRedis();
  if (!redis) return null;
  const raw = await redis.get(keyRun(runId));
  return raw ? (JSON.parse(raw) as P0RunRecord) : null;
}

async function listRunsRedis(founderEmail: string, limit: number): Promise<P0RunRecord[]> {
  const redis = ensureRedis();
  if (!redis) return [];
  // Gather across kinds; for now check daily_focus + daily_brief
  const kinds = ['p0.daily_focus', 'p0.daily_brief'];
  const runs: P0RunRecord[] = [];
  for (const kind of kinds) {
    const ids = await redis.lrange(keyIndex(founderEmail, kind), 0, limit - 1);
    for (const id of ids) {
      const r = await getRunRedis(id);
      if (r) runs.push(r);
    }
  }
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  return runs.slice(0, limit);
}

async function listRunsRedisByKind(founderEmail: string, kind: string, limit: number): Promise<P0RunRecord[]> {
  const redis = ensureRedis();
  if (!redis) return [];
  const ids = await redis.lrange(keyIndex(founderEmail, kind), 0, limit - 1);
  const runs: P0RunRecord[] = [];
  for (const id of ids) {
    const r = await getRunRedis(id);
    if (r) runs.push(r);
  }
  return runs;
}

async function getLatestRunRedis(founderEmail: string, date: string, kind: string): Promise<P0RunRecord | null> {
  const redis = ensureRedis();
  if (!redis) return null;
  const id = await redis.get(keyLatest(founderEmail, date, kind));
  if (!id) return null;
  return getRunRedis(id);
}

function saveRunMemory(record: P0RunRecord) {
  memoryRuns.set(record.runId, record);
  const idxKey = `${record.founderEmail}:${record.kind}`;
  const idx = memoryIndex.get(idxKey) || [];
  idx.unshift(record.runId);
  memoryIndex.set(idxKey, idx.slice(0, HISTORY_LIMIT));
}

function getRunMemory(runId: string): P0RunRecord | null {
  return memoryRuns.get(runId) || null;
}

function listRunsMemory(founderEmail: string, limit: number): P0RunRecord[] {
  const keys = Array.from(memoryIndex.keys()).filter((k) => k.startsWith(`${founderEmail}:`));
  const runs: P0RunRecord[] = [];
  keys.forEach((k) => {
    const ids = memoryIndex.get(k) || [];
    ids.forEach((id) => {
      const run = memoryRuns.get(id);
      if (run) runs.push(run);
    });
  });
  runs.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  return runs.slice(0, limit);
}

function listRunsMemoryByKind(founderEmail: string, kind: string, limit: number): P0RunRecord[] {
  const idxKey = `${founderEmail}:${kind}`;
  const ids = memoryIndex.get(idxKey) || [];
  return ids.slice(0, limit).map((id) => memoryRuns.get(id)!).filter(Boolean);
}

function getLatestRunMemory(founderEmail: string, date: string, kind: string): P0RunRecord | null {
  const idxKey = `${founderEmail}:${kind}`;
  const ids = memoryIndex.get(idxKey) || [];
  if (!ids.length) return null;
  const latest = memoryRuns.get(ids[0]);
  if (latest && latest.date === date && latest.kind === kind) return latest;
  return null;
}

export async function recordP0RunStart(params: {
  founderEmail: string;
  date: string;
  force?: boolean;
  runId?: string;
  kind?: P0RunRecord['kind'];
}): Promise<P0RunRecord> {
  const redis = ensureRedis();
  const kind = params.kind || 'p0.daily_focus';
  if (!params.force) {
    const existing =
      (redis && (await getLatestRunRedis(params.founderEmail, params.date, kind))) ||
      getLatestRunMemory(params.founderEmail, params.date, kind);
    if (existing) return existing;
  }

  const run: P0RunRecord = {
    runId: params.runId || uuidv4(),
    founderEmail: params.founderEmail,
    kind,
    date: params.date,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  saveRunMemory(run);
  await saveRunRedis(run).catch(() => {});
  return run;
}

export async function updateP0Run(runId: string, patch: Partial<P0RunRecord>): Promise<P0RunRecord | null> {
  const current = (await getRunRedis(runId)) || getRunMemory(runId);
  if (!current) return null;
  const updated: P0RunRecord = { ...current, ...patch };
  saveRunMemory(updated);
  await saveRunRedis(updated).catch(() => {});
  return updated;
}

export async function listP0Runs(founderEmail: string, limit = 10, kind?: string): Promise<P0RunRecord[]> {
  if (kind) {
    const redisRuns = await listRunsRedisByKind(founderEmail, kind, limit);
    if (redisRuns.length) return redisRuns;
    return listRunsMemoryByKind(founderEmail, kind, limit);
  }
  const redisRuns = await listRunsRedis(founderEmail, limit);
  if (redisRuns.length) return redisRuns;
  return listRunsMemory(founderEmail, limit);
}

export async function getP0Run(runId: string): Promise<P0RunRecord | null> {
  const redisRun = await getRunRedis(runId);
  if (redisRun) return redisRun;
  return getRunMemory(runId);
}
