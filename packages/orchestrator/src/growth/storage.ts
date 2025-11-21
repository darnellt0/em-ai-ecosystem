/**
 * Growth Agent Orchestrator - Storage Implementations
 * Provides in-memory storage for agent state, with extensibility for Redis
 */

import {
  OrchestratorStorage,
  GrowthAgentKey,
  AgentStatus,
  ProgressEvent,
} from './types';

/**
 * In-Memory Storage Implementation
 * Thread-safe storage for development and testing
 * Can be swapped with RedisStorage for production
 */
export class InMemoryStorage implements OrchestratorStorage {
  private status: Map<GrowthAgentKey, AgentStatus> = new Map();
  private ready: Map<GrowthAgentKey, boolean> = new Map();
  private progress: Map<GrowthAgentKey, ProgressEvent[]> = new Map();
  private lastError: Map<GrowthAgentKey, string> = new Map();
  private runCount: Map<GrowthAgentKey, number> = new Map();

  async setStatus(key: GrowthAgentKey, status: AgentStatus): Promise<void> {
    this.status.set(key, status);
  }

  async getStatus(key: GrowthAgentKey): Promise<AgentStatus | null> {
    return this.status.get(key) || null;
  }

  async setReady(key: GrowthAgentKey, ready: boolean): Promise<void> {
    this.ready.set(key, ready);
  }

  async getReady(key: GrowthAgentKey): Promise<boolean> {
    return this.ready.get(key) || false;
  }

  async addProgress(key: GrowthAgentKey, event: ProgressEvent): Promise<void> {
    const events = this.progress.get(key) || [];
    events.push(event);

    // Keep only last 200 events per agent
    if (events.length > 200) {
      events.shift();
    }

    this.progress.set(key, events);
  }

  async getProgress(key: GrowthAgentKey, limit: number = 100): Promise<ProgressEvent[]> {
    const events = this.progress.get(key) || [];
    return events.slice(-limit);
  }

  async setLastError(key: GrowthAgentKey, error: string): Promise<void> {
    this.lastError.set(key, error);
  }

  async getLastError(key: GrowthAgentKey): Promise<string | null> {
    return this.lastError.get(key) || null;
  }

  async incrementRunCount(key: GrowthAgentKey): Promise<number> {
    const count = (this.runCount.get(key) || 0) + 1;
    this.runCount.set(key, count);
    return count;
  }

  async getRunCount(key: GrowthAgentKey): Promise<number> {
    return this.runCount.get(key) || 0;
  }

  async isConnected(): Promise<boolean> {
    return true; // In-memory storage is always connected
  }

  /**
   * Clear all storage (useful for testing)
   */
  async clear(): Promise<void> {
    this.status.clear();
    this.ready.clear();
    this.progress.clear();
    this.lastError.clear();
    this.runCount.clear();
  }
}

/**
 * Redis Storage Implementation (Placeholder for future implementation)
 * When Redis is needed, implement this class with ioredis
 */
export class RedisStorage implements OrchestratorStorage {
  private connected: boolean = false;
  // private redis: Redis; // Add ioredis client when needed

  constructor(redisUrl?: string) {
    // TODO: Initialize Redis client when needed
    // this.redis = new Redis(redisUrl);
    // this.connected = true;
    console.warn('[RedisStorage] Redis not implemented yet, falling back to in-memory');
  }

  async setStatus(key: GrowthAgentKey, status: AgentStatus): Promise<void> {
    // TODO: await this.redis.set(`agent:status:${key}`, status);
  }

  async getStatus(key: GrowthAgentKey): Promise<AgentStatus | null> {
    // TODO: return (await this.redis.get(`agent:status:${key}`)) as AgentStatus | null;
    return null;
  }

  async setReady(key: GrowthAgentKey, ready: boolean): Promise<void> {
    // TODO: await this.redis.set(`agent:ready:${key}`, ready ? '1' : '0');
  }

  async getReady(key: GrowthAgentKey): Promise<boolean> {
    // TODO: const val = await this.redis.get(`agent:ready:${key}`);
    // return val === '1';
    return false;
  }

  async addProgress(key: GrowthAgentKey, event: ProgressEvent): Promise<void> {
    // TODO: await this.redis.lpush(`agent:progress:${key}`, JSON.stringify(event));
    // TODO: await this.redis.ltrim(`agent:progress:${key}`, 0, 199); // Keep last 200
  }

  async getProgress(key: GrowthAgentKey, limit: number = 100): Promise<ProgressEvent[]> {
    // TODO: const events = await this.redis.lrange(`agent:progress:${key}`, 0, limit - 1);
    // return events.map(e => JSON.parse(e));
    return [];
  }

  async setLastError(key: GrowthAgentKey, error: string): Promise<void> {
    // TODO: await this.redis.set(`agent:error:${key}`, error);
  }

  async getLastError(key: GrowthAgentKey): Promise<string | null> {
    // TODO: return await this.redis.get(`agent:error:${key}`);
    return null;
  }

  async incrementRunCount(key: GrowthAgentKey): Promise<number> {
    // TODO: return await this.redis.incr(`agent:runcount:${key}`);
    return 0;
  }

  async getRunCount(key: GrowthAgentKey): Promise<number> {
    // TODO: const count = await this.redis.get(`agent:runcount:${key}`);
    // return parseInt(count || '0', 10);
    return 0;
  }

  async isConnected(): Promise<boolean> {
    // TODO: try { await this.redis.ping(); return true; } catch { return false; }
    return this.connected;
  }
}

/**
 * Factory function to create storage based on environment
 */
export function createStorage(redisUrl?: string): OrchestratorStorage {
  if (redisUrl && redisUrl.startsWith('redis://')) {
    // TODO: Uncomment when Redis is needed
    // return new RedisStorage(redisUrl);
    console.info('[Storage] Redis URL provided but not implemented, using in-memory storage');
  }

  return new InMemoryStorage();
}
