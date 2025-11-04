import { getRedisStore, RedisTurnStore, SessionTurn, setRedisStore } from './redis.store';
import {
  getPgStore,
  LongTermMemoryRecord,
  PgStore,
  RememberInput,
  TaskCreateInput,
  TaskRecord,
  TaskState,
  setPgStore,
} from './pg.store';

export type { SessionTurn, TaskState, TaskRecord, LongTermMemoryRecord };

export interface AppendTurnInput {
  founder: string;
  text: string;
  entities?: Record<string, unknown> | null;
  ts?: string | number | Date;
}

export interface GetSessionInput {
  founder: string;
  limit?: number;
}

export interface RememberRequest extends RememberInput {}

export interface RecallInput {
  founder: string;
  key: string;
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;

const sanitizeString = (value: string): string => {
  return value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]').replace(PHONE_PATTERN, '[REDACTED_PHONE]');
};

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        acc[key] = sanitizeValue(val);
        return acc;
      },
      {}
    );
  }

  return value;
};

const normalizeTimestamp = (input?: string | number | Date): string => {
  if (!input) {
    return new Date().toISOString();
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  if (typeof input === 'number') {
    return new Date(input).toISOString();
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${input}`);
  }

  return date.toISOString();
};

export const appendTurn = async ({ founder, text, entities, ts }: AppendTurnInput): Promise<SessionTurn> => {
  if (!founder) {
    throw new Error('Founder is required');
  }

  if (!text) {
    throw new Error('Text is required');
  }

  const sanitized: SessionTurn = {
    founder,
    text: sanitizeString(text),
    entities: entities ? (sanitizeValue(entities) as Record<string, unknown>) : null,
    ts: normalizeTimestamp(ts),
  };

  await getRedisStore().append(sanitized);
  return sanitized;
};

export const getSession = async ({ founder, limit = 15 }: GetSessionInput): Promise<SessionTurn[]> => {
  if (!founder) {
    throw new Error('Founder is required');
  }

  const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 15;
  return getRedisStore().getRecent(founder, normalizedLimit);
};

export const remember = async ({ founder, key, value, source }: RememberRequest): Promise<LongTermMemoryRecord> => {
  if (!founder || !key) {
    throw new Error('Founder and key are required');
  }

  return getPgStore().remember({ founder, key, value, source });
};

export const recall = async ({ founder, key }: RecallInput): Promise<LongTermMemoryRecord | null> => {
  if (!founder || !key) {
    throw new Error('Founder and key are required');
  }

  return getPgStore().recall(founder, key);
};

export const taskState = {
  async create(input: TaskCreateInput): Promise<TaskRecord> {
    if (!input.founder || !input.title) {
      throw new Error('Founder and title are required');
    }

    return getPgStore().createTask(input);
  },

  async updateState(id: string, state: TaskState): Promise<TaskRecord> {
    if (!id || !state) {
      throw new Error('Task id and state are required');
    }

    return getPgStore().updateTaskState(id, state);
  },

  async get(id: string): Promise<TaskRecord | null> {
    if (!id) {
      throw new Error('Task id is required');
    }

    return getPgStore().getTask(id);
  },
};

export const __internal = {
  sanitizeString,
  sanitizeValue,
  normalizeTimestamp,
  setRedisStore,
  setPgStore,
  RedisTurnStore,
  PgStore,
};
