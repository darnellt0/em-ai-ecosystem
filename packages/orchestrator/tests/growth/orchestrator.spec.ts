/**
 * Growth Agent Orchestrator Tests
 */

import {
  GrowthAgentOrchestrator,
  InMemoryStorage,
  OrchestratorRunContext,
  GrowthAgentConfig,
  GrowthAgentResult,
} from '../../src/growth';

describe('GrowthAgentOrchestrator', () => {
  let orchestrator: GrowthAgentOrchestrator;
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    orchestrator = new GrowthAgentOrchestrator(storage);
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Agent Registration', () => {
    it('should register agents correctly', () => {
      const mockAgent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Test Journal Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test agent',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(mockAgent);
      const agents = orchestrator.getAgents();

      expect(agents).toHaveLength(1);
      expect(agents[0].key).toBe('journal');
      expect(agents[0].displayName).toBe('Test Journal Agent');
    });

    it('should sort agents by priority', () => {
      const agent1: GrowthAgentConfig = {
        key: 'purpose',
        displayName: 'Purpose Agent',
        phase: 'Radiant',
        priority: 5,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      const agent2: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Journal Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(agent1);
      orchestrator.registerAgent(agent2);

      const agents = orchestrator.getAgents();

      expect(agents[0].key).toBe('journal'); // Priority 1 comes first
      expect(agents[1].key).toBe('purpose'); // Priority 5 comes second
    });
  });

  describe('Launch All Growth Agents', () => {
    it('should launch all agents successfully', async () => {
      const successAgent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Success Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          artifacts: { data: 'test' },
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(successAgent);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
        email: 'test@example.com',
      };

      const summary = await orchestrator.launchAllGrowthAgents(ctx);

      expect(summary.success).toBe(true);
      expect(summary.totalAgents).toBe(1);
      expect(summary.successfulAgents).toBe(1);
      expect(summary.failedAgents).toBe(0);
      expect(summary.results.journal.success).toBe(true);
    });

    it('should handle agent failures gracefully', async () => {
      const failAgent: GrowthAgentConfig = {
        key: 'niche',
        displayName: 'Fail Agent',
        phase: 'Grounded',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: false,
          errors: ['Test error'],
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(failAgent);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
      };

      const summary = await orchestrator.launchAllGrowthAgents(ctx);

      expect(summary.success).toBe(false);
      expect(summary.totalAgents).toBe(1);
      expect(summary.successfulAgents).toBe(0);
      expect(summary.failedAgents).toBe(1);
      expect(summary.results.niche.success).toBe(false);
    });

    it('should launch agents concurrently', async () => {
      const executionOrder: number[] = [];

      const agent1: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Agent 1',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          executionOrder.push(1);
          return {
            success: true,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            retries: 0,
          };
        },
      };

      const agent2: GrowthAgentConfig = {
        key: 'niche',
        displayName: 'Agent 2',
        phase: 'Grounded',
        priority: 2,
        description: 'Test',
        runAgent: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionOrder.push(2);
          return {
            success: true,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            retries: 0,
          };
        },
      };

      orchestrator.registerAgent(agent1);
      orchestrator.registerAgent(agent2);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
      };

      await orchestrator.launchAllGrowthAgents(ctx);

      // Agent 2 should finish first (50ms < 100ms)
      expect(executionOrder[0]).toBe(2);
      expect(executionOrder[1]).toBe(1);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const agent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Test Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(agent);

      const health = await orchestrator.getHealth();

      expect(health.redisConnected).toBe(true); // InMemoryStorage always connected
      expect(health.agents).toHaveLength(1);
      expect(health.agents[0].key).toBe('journal');
      expect(health.agents[0].status).toBe('idle');
      expect(health.agents[0].ready).toBe(false);
    });
  });

  describe('Readiness Summary', () => {
    it('should return readiness for all agents', async () => {
      const agent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Test Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(agent);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
      };

      // Before running, all should be not ready
      let readiness = await orchestrator.getReadinessSummary();
      expect(readiness.journal).toBe(false);
      expect(readiness.allReady).toBe(false);

      // After running, should be ready
      await orchestrator.launchAllGrowthAgents(ctx);

      readiness = await orchestrator.getReadinessSummary();
      expect(readiness.journal).toBe(true);
      expect(readiness.allReady).toBe(true);
    });

    it('should set allReady to false if any agent fails', async () => {
      const successAgent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Success Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      const failAgent: GrowthAgentConfig = {
        key: 'niche',
        displayName: 'Fail Agent',
        phase: 'Grounded',
        priority: 2,
        description: 'Test',
        runAgent: async () => ({
          success: false,
          errors: ['Test error'],
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(successAgent);
      orchestrator.registerAgent(failAgent);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
      };

      await orchestrator.launchAllGrowthAgents(ctx);

      const readiness = await orchestrator.getReadinessSummary();
      expect(readiness.journal).toBe(true);
      expect(readiness.niche).toBe(false);
      expect(readiness.allReady).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress events', async () => {
      const agent: GrowthAgentConfig = {
        key: 'journal',
        displayName: 'Test Agent',
        phase: 'Rooted',
        priority: 1,
        description: 'Test',
        runAgent: async () => ({
          success: true,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          retries: 0,
        }),
      };

      orchestrator.registerAgent(agent);

      const ctx: OrchestratorRunContext = {
        userId: 'test-user',
      };

      await orchestrator.launchAllGrowthAgents(ctx);

      const progress = await orchestrator.getProgressSnapshot(10);
      expect(progress.journal.length).toBeGreaterThan(0);
      expect(progress.journal[0].message).toContain('Starting');
    });
  });
});
