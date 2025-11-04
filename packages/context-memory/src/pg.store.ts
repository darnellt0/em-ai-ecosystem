import { Pool } from 'pg';
import { randomUUID } from 'crypto';

export type TaskState = 'new' | 'in_progress' | 'blocked' | 'done';

export interface RememberInput {
  founder: string;
  key: string;
  value: unknown;
  source?: string;
}

export interface LongTermMemoryRecord {
  id: string;
  founder: string;
  key: string;
  value: unknown;
  source: string | null;
  createdAt: Date;
}

export interface TaskCreateInput {
  founder: string;
  title: string;
  data?: Record<string, unknown>;
}

export interface TaskRecord {
  id: string;
  founder: string;
  title: string;
  state: TaskState;
  data: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_DATABASE_URL = process.env.DATABASE_URL;

const transitionMap: Record<TaskState, TaskState[]> = {
  new: ['in_progress'],
  in_progress: ['blocked'],
  blocked: ['done'],
  done: [],
};

export class PgStore {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? new Pool({ connectionString: DEFAULT_DATABASE_URL });
  }

  setPool(pool: Pool): void {
    this.pool = pool;
  }

  async remember(input: RememberInput): Promise<LongTermMemoryRecord> {
    const id = randomUUID();
    const createdAt = new Date();

    const query = `
      INSERT INTO long_term_memory (id, founder, key, value, source, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, founder, key, value, source, created_at
    `;

    const values = [
      id,
      input.founder,
      input.key,
      JSON.stringify(input.value ?? null),
      input.source ?? null,
      createdAt,
    ];

    const result = await this.pool.query(query, values);
    return this.mapMemoryRow(result.rows[0]);
  }

  async recall(founder: string, key: string): Promise<LongTermMemoryRecord | null> {
    const query = `
      SELECT id, founder, key, value, source, created_at
      FROM long_term_memory
      WHERE founder = $1 AND key = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [founder, key]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapMemoryRow(result.rows[0]);
  }

  async createTask(input: TaskCreateInput): Promise<TaskRecord> {
    const id = randomUUID();
    const now = new Date();

    const query = `
      INSERT INTO tasks (id, founder, title, state, data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING id, founder, title, state, data, created_at, updated_at
    `;

    const values = [id, input.founder, input.title, 'new', JSON.stringify(input.data ?? {}), now];
    const result = await this.pool.query(query, values);
    return this.mapTaskRow(result.rows[0]);
  }

  async updateTaskState(id: string, state: TaskState): Promise<TaskRecord> {
    const current = await this.getTask(id);
    if (!current) {
      throw new Error(`Task ${id} not found`);
    }

    if (current.state === state) {
      return current;
    }

    const allowed = transitionMap[current.state] ?? [];
    if (!allowed.includes(state)) {
      throw new Error(`Invalid state transition from ${current.state} to ${state}`);
    }

    const now = new Date();

    const query = `
      UPDATE tasks
      SET state = $1, updated_at = $2
      WHERE id = $3
      RETURNING id, founder, title, state, data, created_at, updated_at
    `;

    const result = await this.pool.query(query, [state, now, id]);
    return this.mapTaskRow(result.rows[0]);
  }

  async getTask(id: string): Promise<TaskRecord | null> {
    const query = `
      SELECT id, founder, title, state, data, created_at, updated_at
      FROM tasks
      WHERE id = $1
      LIMIT 1
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapTaskRow(result.rows[0]);
  }

  private mapMemoryRow(row: any): LongTermMemoryRecord {
    let value = row.value;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        // value was a plain string, leave as-is
      }
    }

    return {
      id: row.id,
      founder: row.founder,
      key: row.key,
      value,
      source: row.source ?? null,
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    };
  }

  private mapTaskRow(row: any): TaskRecord {
    let dataValue = row.data;
    if (typeof dataValue === 'string') {
      try {
        dataValue = JSON.parse(dataValue);
      } catch {
        // leave as string
      }
    }

    return {
      id: row.id,
      founder: row.founder,
      title: row.title,
      state: row.state,
      data: (dataValue as Record<string, unknown> | null) ?? null,
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    };
  }
}

let pgStoreSingleton: PgStore | null = null;

export const getPgStore = (): PgStore => {
  if (!pgStoreSingleton) {
    pgStoreSingleton = new PgStore();
  }
  return pgStoreSingleton;
};

export const setPgStore = (store: PgStore): void => {
  pgStoreSingleton = store;
};
