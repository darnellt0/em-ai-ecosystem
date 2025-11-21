/**
 * Growth Agent Orchestrator
 * Coordinates execution of 5 Growth Agents with progress tracking and readiness monitoring
 */

import {
  GrowthAgentConfig,
  GrowthAgentKey,
  GrowthAgentResult,
  OrchestratorRunContext,
  OrchestratorRunSummary,
  OrchestratorHealth,
  ReadinessSummary,
  ProgressEvent,
  AgentHealth,
  OrchestratorStorage,
} from './types';
import { createStorage } from './storage';

/**
 * Main Orchestrator class
 */
export class GrowthAgentOrchestrator {
  private agents: Map<GrowthAgentKey, GrowthAgentConfig> = new Map();
  private storage: OrchestratorStorage;
  private logger = console;

  constructor(storage?: OrchestratorStorage) {
    this.storage = storage || createStorage(process.env.REDIS_URL);
  }

  /**
   * Register a Growth Agent
   */
  registerAgent(config: GrowthAgentConfig): void {
    this.agents.set(config.key, config);
    this.logger.info(`[Orchestrator] Registered agent: ${config.displayName} (${config.phase})`);
  }

  /**
   * Get all registered agents
   */
  getAgents(): GrowthAgentConfig[] {
    return Array.from(this.agents.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Launch all Growth Agents concurrently
   */
  async launchAllGrowthAgents(ctx: OrchestratorRunContext): Promise<OrchestratorRunSummary> {
    const startedAt = new Date().toISOString();
    this.logger.info(`[Orchestrator] Launching ${this.agents.size} Growth Agents for user: ${ctx.userId}`);

    const results: Record<string, GrowthAgentResult> = {};
    const errors: string[] = [];

    // Get all agents sorted by priority
    const agentList = this.getAgents();

    // Launch all agents concurrently
    const agentPromises = agentList.map(async (agent) => {
      try {
        const result = await this.runAgent(agent, ctx);
        results[agent.key] = result;
        return result;
      } catch (error: any) {
        const errorMsg = `Agent ${agent.key} failed: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(`[Orchestrator] ${errorMsg}`);

        // Create failed result
        results[agent.key] = {
          success: false,
          errors: [error.message],
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        };

        return results[agent.key];
      }
    });

    // Wait for all agents to complete
    await Promise.all(agentPromises);

    const completedAt = new Date().toISOString();

    // Calculate summary
    const successfulAgents = Object.values(results).filter((r) => r.success).length;
    const failedAgents = Object.values(results).filter((r) => !r.success).length;

    const summary: OrchestratorRunSummary = {
      success: failedAgents === 0,
      startedAt,
      completedAt,
      results: results as Record<GrowthAgentKey, GrowthAgentResult>,
      totalAgents: this.agents.size,
      successfulAgents,
      failedAgents,
      errors,
    };

    this.logger.info(
      `[Orchestrator] Run completed: ${successfulAgents}/${this.agents.size} agents successful`
    );

    return summary;
  }

  /**
   * Run a single agent with progress tracking
   */
  private async runAgent(
    agent: GrowthAgentConfig,
    ctx: OrchestratorRunContext
  ): Promise<GrowthAgentResult> {
    const agentKey = agent.key;

    // Set status to running
    await this.storage.setStatus(agentKey, 'running');
    await this.storage.setReady(agentKey, false);

    // Add start progress event
    await this.storage.addProgress(agentKey, {
      agentKey,
      timestamp: new Date().toISOString(),
      message: `Starting ${agent.displayName}`,
      progress: 0,
    });

    this.logger.info(`[Orchestrator] Running agent: ${agent.displayName}`);

    try {
      // Run the agent
      const result = await agent.runAgent(ctx);

      // Update storage based on result
      await this.storage.setStatus(agentKey, result.success ? 'ready' : 'error');
      await this.storage.setReady(agentKey, result.success);
      await this.storage.incrementRunCount(agentKey);

      if (result.errors && result.errors.length > 0) {
        await this.storage.setLastError(agentKey, result.errors.join('; '));
      }

      // Add completion progress event
      await this.storage.addProgress(agentKey, {
        agentKey,
        timestamp: new Date().toISOString(),
        message: result.success ? `Completed ${agent.displayName}` : `Failed ${agent.displayName}`,
        progress: 100,
        data: { success: result.success, artifacts: result.artifacts },
      });

      return result;
    } catch (error: any) {
      // Handle unexpected errors
      await this.storage.setStatus(agentKey, 'error');
      await this.storage.setReady(agentKey, false);
      await this.storage.setLastError(agentKey, error.message);

      await this.storage.addProgress(agentKey, {
        agentKey,
        timestamp: new Date().toISOString(),
        message: `Error in ${agent.displayName}: ${error.message}`,
        progress: 0,
      });

      throw error;
    }
  }

  /**
   * Get orchestrator health status
   */
  async getHealth(): Promise<OrchestratorHealth> {
    const agents: AgentHealth[] = [];
    const redisConnected = await this.storage.isConnected();

    for (const agent of this.getAgents()) {
      const status = (await this.storage.getStatus(agent.key)) || 'idle';
      const ready = await this.storage.getReady(agent.key);
      const lastError = await this.storage.getLastError(agent.key);
      const runCount = await this.storage.getRunCount(agent.key);

      // Get last update from progress
      const progressEvents = await this.storage.getProgress(agent.key, 1);
      const lastUpdated = progressEvents.length > 0 ? progressEvents[0].timestamp : undefined;

      agents.push({
        key: agent.key,
        displayName: agent.displayName,
        phase: agent.phase,
        status,
        ready,
        lastUpdated,
        lastError: lastError || undefined,
        runCount,
      });
    }

    return {
      redisConnected,
      agents,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get readiness summary for all agents
   */
  async getReadinessSummary(): Promise<ReadinessSummary> {
    const readiness: any = {
      timestamp: new Date().toISOString(),
    };

    let allReady = true;

    for (const agent of this.getAgents()) {
      const ready = await this.storage.getReady(agent.key);
      readiness[agent.key] = ready;

      if (!ready) {
        allReady = false;
      }
    }

    readiness.allReady = allReady;

    return readiness as ReadinessSummary;
  }

  /**
   * Get progress snapshot for all agents
   */
  async getProgressSnapshot(limit: number = 100): Promise<Record<GrowthAgentKey, ProgressEvent[]>> {
    const snapshot: any = {};

    for (const agent of this.getAgents()) {
      snapshot[agent.key] = await this.storage.getProgress(agent.key, limit);
    }

    return snapshot;
  }

  /**
   * Get storage instance (for testing)
   */
  getStorage(): OrchestratorStorage {
    return this.storage;
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: GrowthAgentOrchestrator | null = null;

/**
 * Get or create the orchestrator instance
 */
export function getOrchestrator(): GrowthAgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new GrowthAgentOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Reset orchestrator (for testing)
 */
export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
