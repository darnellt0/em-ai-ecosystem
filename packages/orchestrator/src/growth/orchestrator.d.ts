/**
 * Growth Agent Orchestrator
 * Coordinates execution of 5 Growth Agents with progress tracking and readiness monitoring
 */
import { GrowthAgentConfig, GrowthAgentKey, OrchestratorRunContext, OrchestratorRunSummary, OrchestratorHealth, ReadinessSummary, ProgressEvent, OrchestratorStorage } from './types';
/**
 * Main Orchestrator class
 */
export declare class GrowthAgentOrchestrator {
    private agents;
    private storage;
    private logger;
    constructor(storage?: OrchestratorStorage);
    /**
     * Register a Growth Agent
     */
    registerAgent(config: GrowthAgentConfig): void;
    /**
     * Get all registered agents
     */
    getAgents(): GrowthAgentConfig[];
    /**
     * Launch all Growth Agents concurrently
     */
    launchAllGrowthAgents(ctx: OrchestratorRunContext): Promise<OrchestratorRunSummary>;
    /**
     * Run a single agent with progress tracking
     */
    private runAgent;
    /**
     * Get orchestrator health status
     */
    getHealth(): Promise<OrchestratorHealth>;
    /**
     * Get readiness summary for all agents
     */
    getReadinessSummary(): Promise<ReadinessSummary>;
    /**
     * Get progress snapshot for all agents
     */
    getProgressSnapshot(limit?: number): Promise<Record<GrowthAgentKey, ProgressEvent[]>>;
    /**
     * Get storage instance (for testing)
     */
    getStorage(): OrchestratorStorage;
}
/**
 * Get or create the orchestrator instance
 */
export declare function getOrchestrator(): GrowthAgentOrchestrator;
/**
 * Reset orchestrator (for testing)
 */
export declare function resetOrchestrator(): void;
//# sourceMappingURL=orchestrator.d.ts.map