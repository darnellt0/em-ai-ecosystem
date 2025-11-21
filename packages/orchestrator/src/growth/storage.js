"use strict";
/**
 * Growth Agent Orchestrator - Storage Implementations
 * Provides in-memory storage for agent state, with extensibility for Redis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStorage = exports.InMemoryStorage = void 0;
exports.createStorage = createStorage;
/**
 * In-Memory Storage Implementation
 * Thread-safe storage for development and testing
 * Can be swapped with RedisStorage for production
 */
class InMemoryStorage {
    constructor() {
        this.status = new Map();
        this.ready = new Map();
        this.progress = new Map();
        this.lastError = new Map();
        this.runCount = new Map();
    }
    async setStatus(key, status) {
        this.status.set(key, status);
    }
    async getStatus(key) {
        return this.status.get(key) || null;
    }
    async setReady(key, ready) {
        this.ready.set(key, ready);
    }
    async getReady(key) {
        return this.ready.get(key) || false;
    }
    async addProgress(key, event) {
        const events = this.progress.get(key) || [];
        events.push(event);
        // Keep only last 200 events per agent
        if (events.length > 200) {
            events.shift();
        }
        this.progress.set(key, events);
    }
    async getProgress(key, limit = 100) {
        const events = this.progress.get(key) || [];
        return events.slice(-limit);
    }
    async setLastError(key, error) {
        this.lastError.set(key, error);
    }
    async getLastError(key) {
        return this.lastError.get(key) || null;
    }
    async incrementRunCount(key) {
        const count = (this.runCount.get(key) || 0) + 1;
        this.runCount.set(key, count);
        return count;
    }
    async getRunCount(key) {
        return this.runCount.get(key) || 0;
    }
    async isConnected() {
        return true; // In-memory storage is always connected
    }
    /**
     * Clear all storage (useful for testing)
     */
    async clear() {
        this.status.clear();
        this.ready.clear();
        this.progress.clear();
        this.lastError.clear();
        this.runCount.clear();
    }
}
exports.InMemoryStorage = InMemoryStorage;
/**
 * Redis Storage Implementation (Placeholder for future implementation)
 * When Redis is needed, implement this class with ioredis
 */
class RedisStorage {
    // private redis: Redis; // Add ioredis client when needed
    constructor(redisUrl) {
        this.connected = false;
        // TODO: Initialize Redis client when needed
        // this.redis = new Redis(redisUrl);
        // this.connected = true;
        console.warn('[RedisStorage] Redis not implemented yet, falling back to in-memory');
    }
    async setStatus(key, status) {
        // TODO: await this.redis.set(`agent:status:${key}`, status);
    }
    async getStatus(key) {
        // TODO: return (await this.redis.get(`agent:status:${key}`)) as AgentStatus | null;
        return null;
    }
    async setReady(key, ready) {
        // TODO: await this.redis.set(`agent:ready:${key}`, ready ? '1' : '0');
    }
    async getReady(key) {
        // TODO: const val = await this.redis.get(`agent:ready:${key}`);
        // return val === '1';
        return false;
    }
    async addProgress(key, event) {
        // TODO: await this.redis.lpush(`agent:progress:${key}`, JSON.stringify(event));
        // TODO: await this.redis.ltrim(`agent:progress:${key}`, 0, 199); // Keep last 200
    }
    async getProgress(key, limit = 100) {
        // TODO: const events = await this.redis.lrange(`agent:progress:${key}`, 0, limit - 1);
        // return events.map(e => JSON.parse(e));
        return [];
    }
    async setLastError(key, error) {
        // TODO: await this.redis.set(`agent:error:${key}`, error);
    }
    async getLastError(key) {
        // TODO: return await this.redis.get(`agent:error:${key}`);
        return null;
    }
    async incrementRunCount(key) {
        // TODO: return await this.redis.incr(`agent:runcount:${key}`);
        return 0;
    }
    async getRunCount(key) {
        // TODO: const count = await this.redis.get(`agent:runcount:${key}`);
        // return parseInt(count || '0', 10);
        return 0;
    }
    async isConnected() {
        // TODO: try { await this.redis.ping(); return true; } catch { return false; }
        return this.connected;
    }
}
exports.RedisStorage = RedisStorage;
/**
 * Factory function to create storage based on environment
 */
function createStorage(redisUrl) {
    if (redisUrl && redisUrl.startsWith('redis://')) {
        // TODO: Uncomment when Redis is needed
        // return new RedisStorage(redisUrl);
        console.info('[Storage] Redis URL provided but not implemented, using in-memory storage');
    }
    return new InMemoryStorage();
}
//# sourceMappingURL=storage.js.map