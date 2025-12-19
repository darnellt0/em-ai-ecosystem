import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type RunStatus = 'running' | 'success' | 'fail';

export type P0RunRecord = {
  runId: string;
  kind: string;
  status: RunStatus;
  createdAt: string;
  finishedAt?: string;
  artifactPath?: string;
};

type StartRunInput = {
  kind: string;
  runId?: string;
};

type FinalizeInput = {
  status: RunStatus;
  artifact: unknown;
};

type ListInput = {
  kind: string;
  limit: number;
};

const dataDir = process.env.P0_RUN_DATA_DIR
  ? path.resolve(process.env.P0_RUN_DATA_DIR)
  : path.resolve(__dirname, '../../.data/runs');
const indexPath = path.join(dataDir, 'index.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readIndex(): P0RunRecord[] {
  if (!fs.existsSync(indexPath)) return [];
  const raw = fs.readFileSync(indexPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(items: P0RunRecord[]) {
  ensureDir();
  fs.writeFileSync(indexPath, JSON.stringify(items, null, 2));
}

export function startP0Run(input: StartRunInput): P0RunRecord {
  ensureDir();
  const runId = input.runId || crypto.randomUUID();
  const record: P0RunRecord = {
    runId,
    kind: input.kind,
    status: 'running',
    createdAt: new Date().toISOString(),
  };
  const items = readIndex();
  writeIndex([record, ...items]);
  return record;
}

export function finalizeP0Run(runId: string, input: FinalizeInput): P0RunRecord {
  ensureDir();
  const items = readIndex();
  const idx = items.findIndex((item) => item.runId === runId);
  const now = new Date().toISOString();
  const record: P0RunRecord =
    idx >= 0
      ? { ...items[idx], status: input.status, finishedAt: now }
      : {
          runId,
          kind: 'p0.daily_brief',
          status: input.status,
          createdAt: now,
          finishedAt: now,
        };

  const artifactPath = path.join(dataDir, `${runId}.json`);
  const artifactPayload = {
    runId: record.runId,
    kind: record.kind,
    status: record.status,
    createdAt: record.createdAt,
    finishedAt: record.finishedAt,
    artifact: input.artifact,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(artifactPayload, null, 2));
  record.artifactPath = artifactPath;

  if (idx >= 0) {
    items[idx] = record;
  } else {
    items.unshift(record);
  }
  writeIndex(items);
  return record;
}

export function listP0Runs(input: ListInput): P0RunRecord[] {
  const items = readIndex().filter((item) => item.kind === input.kind);
  return items.slice(0, input.limit);
}

export function getP0RunStats(kind: string): { runsCount: number; lastRunAt?: string } {
  const items = readIndex().filter((item) => item.kind === kind);
  const lastRunAt = items[0]?.finishedAt || items[0]?.createdAt;
  return { runsCount: items.length, ...(lastRunAt ? { lastRunAt } : {}) };
}

export function getP0Run(runId: string): (P0RunRecord & { artifact: unknown }) | null {
  const artifactPath = path.join(dataDir, `${runId}.json`);
  if (!fs.existsSync(artifactPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } catch {
    return null;
  }
}
