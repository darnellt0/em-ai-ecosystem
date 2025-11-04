export interface SessionTurn {
  founder: string;
  text: string;
  entities?: Record<string, unknown> | null;
  ts: string;
}

export interface RedisStoreOptions {
  ttlSeconds?: number;
  maxTurns?: number;
  keyPrefix?: string;
}

interface RedisLikeClient {
  multi(): RedisLikePipeline;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  quit(): Promise<void>;
}

interface RedisLikePipeline {
  rpush(key: string, value: string): RedisLikePipeline;
  ltrim(key: string, start: number, stop: number): RedisLikePipeline;
  expire(key: string, seconds: number): RedisLikePipeline;
  exec(): Promise<unknown>;
}

class InMemoryRedisClient implements RedisLikeClient {
  private readonly store = new Map<string, { items: string[]; expiresAt: number | null }>();

  constructor(private readonly ttlSeconds: number, private readonly maxTurns: number) {}

  multi(): RedisLikePipeline {
    const commands: Array<() => void> = [];
    const pipeline: RedisLikePipeline = {
      rpush: (key, value) => {
        commands.push(() => {
          const entry = this.ensureEntry(key);
          entry.items.push(value);
          if (entry.items.length > this.maxTurns) {
            entry.items.splice(0, entry.items.length - this.maxTurns);
          }
        });
        return pipeline;
      },
      ltrim: (key, start, stop) => {
        commands.push(() => {
          const entry = this.ensureEntry(key);
          const resolvedStart = start < 0 ? Math.max(entry.items.length + start, 0) : start;
          const resolvedStop = stop < 0 ? entry.items.length + stop + 1 : stop + 1;
          entry.items = entry.items.slice(resolvedStart, resolvedStop);
        });
        return pipeline;
      },
      expire: (key, seconds) => {
        commands.push(() => {
          const entry = this.ensureEntry(key);
          entry.expiresAt = Date.now() + seconds * 1000;
        });
        return pipeline;
      },
      exec: async () => {
        for (const command of commands) {
          command();
        }
      },
    };
    return pipeline;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const entry = this.store.get(key);
    if (!entry) {
      return [];
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return [];
    }

    const resolvedStart = start < 0 ? Math.max(entry.items.length + start, 0) : start;
    const resolvedStop = stop < 0 ? entry.items.length + stop + 1 : stop + 1;
    return entry.items.slice(resolvedStart, resolvedStop);
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  private ensureEntry(key: string): { items: string[]; expiresAt: number | null } {
    const existing = this.store.get(key);
    if (existing) {
      return existing;
    }

    const created = { items: [] as string[], expiresAt: null as number | null };
    this.store.set(key, created);
    return created;
  }
}

const DEFAULT_TTL_SECONDS = Number(process.env.CONTEXT_SESSION_TTL_SECONDS ?? 7 * 24 * 60 * 60);
const DEFAULT_MAX_TURNS = Number(process.env.CONTEXT_SESSION_MAX_TURNS ?? 100);
const DEFAULT_PREFIX = 'context:turns';

const createRedisClient = (): RedisLikeClient | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });
    client.on('error', (err: Error) => {
      console.warn('[RedisTurnStore] Redis error', err.message);
    });
    return client as RedisLikeClient;
  } catch (error) {
    return null;
  }
};

export class RedisTurnStore {
  private readonly client: RedisLikeClient;
  private readonly ttlSeconds: number;
  private readonly maxTurns: number;
  private readonly keyPrefix: string;
  private readonly isFallback: boolean;

  constructor(client?: RedisLikeClient | null, options: RedisStoreOptions = {}) {
    this.ttlSeconds = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    this.maxTurns = Math.max(1, options.maxTurns ?? DEFAULT_MAX_TURNS);
    this.keyPrefix = options.keyPrefix ?? DEFAULT_PREFIX;

    const resolvedClient = client ?? createRedisClient();
    if (resolvedClient) {
      this.client = resolvedClient;
      this.isFallback = false;
    } else {
      this.client = new InMemoryRedisClient(this.ttlSeconds, this.maxTurns);
      this.isFallback = true;
    }
  }

  async append(turn: SessionTurn): Promise<void> {
    const key = this.keyFor(turn.founder);
    const payload = JSON.stringify(turn);
    const pipeline = this.client.multi();
    pipeline.rpush(key, payload);
    pipeline.ltrim(key, -this.maxTurns, -1);
    pipeline.expire(key, this.ttlSeconds);
    await pipeline.exec();
  }

  async getRecent(founder: string, limit: number): Promise<SessionTurn[]> {
    const key = this.keyFor(founder);
    if (limit <= 0) {
      return [];
    }

    const start = -Math.min(this.maxTurns, limit);
    const items = await this.client.lrange(key, start, -1);
    return items.map((item) => JSON.parse(item) as SessionTurn);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  private keyFor(founder: string): string {
    return `${this.keyPrefix}:${founder}`;
  }

  get fallback(): boolean {
    return this.isFallback;
  }
}

let redisStoreSingleton: RedisTurnStore | null = null;

export const getRedisStore = (): RedisTurnStore => {
  if (!redisStoreSingleton) {
    redisStoreSingleton = new RedisTurnStore();
  }
  return redisStoreSingleton;
};

export const setRedisStore = (store: RedisTurnStore): void => {
  redisStoreSingleton = store;
};
