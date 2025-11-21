/**
 * Growth Agent Orchestrator - Storage Implementations
 * Provides in-memory storage for agent state, with extensibility for Redis
 */
import { OrchestratorStorage, GrowthAgentKey, AgentStatus, ProgressEvent } from './types';
/**
 * In-Memory Storage Implementation
 * Thread-safe storage for development and testing
 * Can be swapped with RedisStorage for production
 */
export declare class InMemoryStorage implements OrchestratorStorage {
    private status;
    private ready;
    private progress;
    private lastError;
    private runCount;
    setStatus(key: GrowthAgentKey, status: AgentStatus): Promise<void>;
    getStatus(key: GrowthAgentKey): Promise<AgentStatus | null>;
    setReady(key: GrowthAgentKey, ready: boolean): Promise<void>;
    getReady(key: GrowthAgentKey): Promise<boolean>;
    addProgress(key: GrowthAgentKey, event: ProgressEvent): Promise<void>;
    getProgress(key: GrowthAgentKey, limit?: number): Promise<ProgressEvent[]>;
    setLastError(key: GrowthAgentKey, error: string): Promise<void>;
    getLastError(key: GrowthAgentKey): Promise<string | null>;
    incrementRunCount(key: GrowthAgentKey): Promise<number>;
    getRunCount(key: GrowthAgentKey): Promise<number>;
    isConnected(): Promise<boolean>;
    /**
     * Clear all storage (useful for testing)
     */
    clear(): Promise<void>;
}
/**
 * Redis Storage Implementation (Placeholder for future implementation)
 * When Redis is needed, implement this class with ioredis
 */
export declare class RedisStorage implements OrchestratorStorage {
    private connected;
    constructor(redisUrl?: string);
    setStatus(key: GrowthAgentKey, status: AgentStatus): Promise<void>;
    getStatus(key: GrowthAgentKey): Promise<AgentStatus | null>;
    setReady(key: GrowthAgentKey, ready: boolean): Promise<void>;
    getReady(key: GrowthAgentKey): Promise<boolean>;
    addProgress(key: GrowthAgentKey, event: ProgressEvent): Promise<void>;
    getProgress(key: GrowthAgentKey, limit?: number): Promise<ProgressEvent[]>;
    setLastError(key: GrowthAgentKey, error: string): Promise<void>;
    getLastError(key: GrowthAgentKey): Promise<string | null>;
    incrementRunCount(key: GrowthAgentKey): Promise<number>;
    getRunCount(key: GrowthAgentKey): Promise<number>;
    isConnected(): Promise<boolean>;
}
/**
 * Factory function to create storage based on environment
 */
export declare function createStorage(redisUrl?: string): OrchestratorStorage;
//# sourceMappingURL=storage.d.ts.map