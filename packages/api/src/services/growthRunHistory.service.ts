import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { createLazyRedisClient } from '../config/redis.config';

export type GrowthRunStatus = 'queued' | 'running' | 'complete' | 'failed';

export interface GrowthRunRecord {
  runId: string;
  founderEmail: string;
  mode: string;
  launchedAgents: string[];
  jobIds: string[];
  status: GrowthRunStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  lastProgressAt?: string;
  retriedAgents?: string[];
  summary?: {
    topProgress?: any[];
    topEvents?: any[];
    completedAgents?: string[];
    failedAgents?: string[];
  };
}

const memoryRuns = new Map<string, GrowthRunRecord>();
const memoryIndex = new Map<string, string[]>();
let redisClient: Redis | null = null;
let redisInitTried = false;
const HISTORY_LIMIT = 50;

function ensureRedis() {
  if (redisInitTried) return redisClient;
  redisInitTried = true;
  if (process.env.NODE_ENV === 'test') {
    return null;
  }
  try {
    redisClient = createLazyRedisClient({ maxRetriesPerRequest: 1 });
    redisClient.on('error', () => {});
  } catch {
    redisClient = null;
  }
  return redisClient;
}

function keyRun(runId: string) {
  return `growth:run:${runId}`;
}
function keyIndex(email: string) {
  return `growth:run:index:${email}`;
}
function keyLatest(email: string) {
  return `growth:run:latest:${email}`;
}

async function saveRunRedis(record: GrowthRunRecord) {
  const redis = ensureRedis();
  if (!redis) return;
  await redis.set(keyRun(record.runId), JSON.stringify(record));
  await redis.lpush(keyIndex(record.founderEmail), record.runId);
  await redis.ltrim(keyIndex(record.founderEmail), 0, HISTORY_LIMIT - 1);
  await redis.set(keyLatest(record.founderEmail), record.runId);
}

async function getRunRedis(runId: string): Promise<GrowthRunRecord | null> {
  const redis = ensureRedis();
  if (!redis) return null;
  const raw = await redis.get(keyRun(runId));
  return raw ? (JSON.parse(raw) as GrowthRunRecord) : null;
}

async function listRunsRedis(founderEmail: string, limit: number): Promise<GrowthRunRecord[]> {
  const redis = ensureRedis();
  if (!redis) return [];
  const ids = await redis.lrange(keyIndex(founderEmail), 0, limit - 1);
  const runs: GrowthRunRecord[] = [];
  for (const id of ids) {
    const r = await getRunRedis(id);
    if (r) runs.push(r);
  }
  return runs;
}

async function getLatestRunRedis(founderEmail: string): Promise<GrowthRunRecord | null> {
  const redis = ensureRedis();
  if (!redis) return null;
  const id = await redis.get(keyLatest(founderEmail));
  if (!id) return null;
  return getRunRedis(id);
}

function saveRunMemory(record: GrowthRunRecord) {
  memoryRuns.set(record.runId, record);
  const idx = memoryIndex.get(record.founderEmail) || [];
  idx.unshift(record.runId);
  memoryIndex.set(record.founderEmail, idx.slice(0, HISTORY_LIMIT));
}

function getRunMemory(runId: string): GrowthRunRecord | null {
  return memoryRuns.get(runId) || null;
}

function listRunsMemory(founderEmail: string, limit: number): GrowthRunRecord[] {
  const ids = memoryIndex.get(founderEmail) || [];
  return ids.slice(0, limit).map((id) => memoryRuns.get(id)!).filter(Boolean);
}

function getLatestRunMemory(founderEmail: string): GrowthRunRecord | null {
  const ids = memoryIndex.get(founderEmail) || [];
  if (!ids.length) return null;
  return memoryRuns.get(ids[0]) || null;
}

export async function recordGrowthRunStart(params: {
  founderEmail: string;
  mode: string;
  launchedAgents: string[];
  jobIds: string[];
}): Promise<GrowthRunRecord> {
  const run: GrowthRunRecord = {
    runId: uuidv4(),
    founderEmail: params.founderEmail,
    mode: params.mode,
    launchedAgents: params.launchedAgents,
    jobIds: params.jobIds,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  saveRunMemory(run);
  await saveRunRedis(run).catch(() => {});
  return run;
}

export async function updateGrowthRun(runId: string, patch: Partial<GrowthRunRecord>): Promise<GrowthRunRecord | null> {
  const current = (await getRunRedis(runId)) || getRunMemory(runId);
  if (!current) return null;
  const updated: GrowthRunRecord = { ...current, ...patch };
  saveRunMemory(updated);
  await saveRunRedis(updated).catch(() => {});
  return updated;
}

export async function listGrowthRuns(founderEmail: string, limit = 10): Promise<GrowthRunRecord[]> {
  const redisRuns = await listRunsRedis(founderEmail, limit);
  if (redisRuns.length) return redisRuns;
  return listRunsMemory(founderEmail, limit);
}

export async function getGrowthRun(runId: string): Promise<GrowthRunRecord | null> {
  const redisRun = await getRunRedis(runId);
  if (redisRun) return redisRun;
  return getRunMemory(runId);
}

export async function getLatestGrowthRun(founderEmail: string): Promise<GrowthRunRecord | null> {
  const redisRun = await getLatestRunRedis(founderEmail);
  if (redisRun) return redisRun;
  return getLatestRunMemory(founderEmail);
}
