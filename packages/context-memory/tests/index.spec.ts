import {
  appendTurn,
  getSession,
  remember,
  recall,
  taskState,
  __internal,
  SessionTurn,
} from '../src';

type QueryResultRow = Record<string, unknown>;

type QueryResult = { rows: QueryResultRow[] };

type QueryHandler = (params: unknown[]) => QueryResult | Promise<QueryResult>;

class FakePool {
  private readonly handlers: Array<{ matcher: RegExp; handler: QueryHandler }> = [];
  private readonly memory: QueryResultRow[] = [];
  private readonly tasks: QueryResultRow[] = [];

  constructor() {
    this.handlers.push({
      matcher: /^\s*insert\s+into\s+long_term_memory/i,
      handler: (params) => {
        const [id, founder, key, value, source, createdAt] = params as [string, string, string, string, string | null, Date];
        const parsedValue = value ? JSON.parse(value) : null;
        const row = {
          id,
          founder,
          key,
          value: parsedValue,
          source,
          created_at: createdAt,
        };
        this.memory.push(row);
        return { rows: [row] };
      },
    });

    this.handlers.push({
      matcher: /^\s*select\s+id,\s*founder,\s*key,\s*value,\s*source,\s*created_at\s+from\s+long_term_memory/i,
      handler: (params) => {
        const [founder, key] = params as [string, string];
        const rows = this.memory
          .filter((row) => row.founder === founder && row.key === key)
          .sort((a, b) => (a.created_at as Date).getTime() - (b.created_at as Date).getTime());
        const latest = rows.length > 0 ? rows[rows.length - 1] : undefined;
        return { rows: latest ? [latest] : [] };
      },
    });

    this.handlers.push({
      matcher: /^\s*insert\s+into\s+tasks/i,
      handler: (params) => {
        const [id, founder, title, state, data, timestamp] = params as [
          string,
          string,
          string,
          string,
          string,
          Date,
        ];
        const parsedData = data ? JSON.parse(data) : {};
        const row = {
          id,
          founder,
          title,
          state,
          data: parsedData,
          created_at: timestamp,
          updated_at: timestamp,
        };
        this.tasks.push(row);
        return { rows: [row] };
      },
    });

    this.handlers.push({
      matcher: /^\s*update\s+tasks\s+set\s+state/i,
      handler: (params) => {
        const [state, updatedAt, id] = params as [string, Date, string];
        const task = this.tasks.find((row) => row.id === id);
        if (!task) {
          return { rows: [] };
        }
        task.state = state;
        task.updated_at = updatedAt;
        return { rows: [task] };
      },
    });

    this.handlers.push({
      matcher: /^\s*select\s+id,\s*founder,\s*title,\s*state,\s*data,\s*created_at,\s*updated_at\s+from\s+tasks/i,
      handler: (params) => {
        const [id] = params as [string];
        const task = this.tasks.find((row) => row.id === id);
        return { rows: task ? [task] : [] };
      },
    });
  }

  async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    const handlerEntry = this.handlers.find((entry) => entry.matcher.test(normalized));
    if (!handlerEntry) {
      throw new Error(`Unhandled SQL: ${normalized}`);
    }
    return handlerEntry.handler(params);
  }

  async end(): Promise<void> {
    this.memory.length = 0;
    this.tasks.length = 0;
  }
}

describe('context-memory module', () => {
  beforeEach(() => {
    const redisStore = new __internal.RedisTurnStore(null, { ttlSeconds: 60, maxTurns: 10 });
    __internal.setRedisStore(redisStore);

    const pool = new FakePool();
    __internal.setPgStore(new __internal.PgStore(pool as unknown as any));
  });

  it('redacts PII when appending and retrieving turns', async () => {
    await appendTurn({
      founder: 'shria',
      text: 'Contact me at founder@example.com or +1 (555) 123-4567',
      entities: {
        email: 'founder@example.com',
        phone: '+1 555 987 6543',
        nested: { value: 'Call 555-321-0987' },
      },
      ts: '2024-01-01T00:00:00.000Z',
    });

    const turns = await getSession({ founder: 'shria', limit: 5 });
    expect(turns).toHaveLength(1);
    const turn = turns[0] as SessionTurn;
    expect(turn.text).toContain('[REDACTED_EMAIL]');
    expect(turn.text).toContain('[REDACTED_PHONE]');
    expect(JSON.stringify(turn.entities)).not.toContain('founder@example.com');
    expect(JSON.stringify(turn.entities)).not.toContain('555-321-0987');
  });

  it('stores and recalls long term memory values', async () => {
    await remember({ founder: 'darnell', key: 'favorite_drink', value: 'matcha', source: 'voice-agent' });
    const memory = await recall({ founder: 'darnell', key: 'favorite_drink' });
    expect(memory).not.toBeNull();
    expect(memory?.value).toBe('matcha');
    expect(memory?.source).toBe('voice-agent');
  });

  it('enforces ordered task state transitions', async () => {
    const task = await taskState.create({ founder: 'darnell', title: 'Prep deck', data: { priority: 'high' } });
    expect(task.state).toBe('new');

    const inProgress = await taskState.updateState(task.id, 'in_progress');
    expect(inProgress.state).toBe('in_progress');

    await expect(taskState.updateState(task.id, 'done')).rejects.toThrow('Invalid state transition');

    const blocked = await taskState.updateState(task.id, 'blocked');
    expect(blocked.state).toBe('blocked');

    const done = await taskState.updateState(task.id, 'done');
    expect(done.state).toBe('done');

    const fetched = await taskState.get(task.id);
    expect(fetched?.state).toBe('done');
  });
});
