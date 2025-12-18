/**
 * Tests for GrowthOrchestrator
 */

import { GrowthOrchestrator, AGENT_CONFIG } from '../../src/growth-agents/orchestrator';

// Mock Redis and BullMQ
jest.mock('ioredis');
jest.mock('bullmq');

describe('GrowthOrchestrator', () => {
  let orchestrator: GrowthOrchestrator;

  beforeEach(() => {
    orchestrator = new GrowthOrchestrator();
  });

  afterEach(async () => {
    await orchestrator.close();
  });

  describe('Agent Configuration', () => {
    it('should have 10 agents registered (core + growth variants)', () => {
      expect(Object.keys(AGENT_CONFIG)).toHaveLength(10);
    });

    it('should include all required agents', () => {
      expect(AGENT_CONFIG).toHaveProperty('journal');
      expect(AGENT_CONFIG).toHaveProperty('niche');
      expect(AGENT_CONFIG).toHaveProperty('mindset');
      expect(AGENT_CONFIG).toHaveProperty('rhythm');
      expect(AGENT_CONFIG).toHaveProperty('purpose');
      const keys = Object.keys(AGENT_CONFIG);
      expect(keys).toContain('growth.journal');
      expect(keys).toContain('growth.niche');
      expect(keys).toContain('growth.mindset');
      expect(keys).toContain('growth.rhythm');
      expect(keys).toContain('growth.purpose');
    });

    it('should have correct agent metadata', () => {
      expect(AGENT_CONFIG.journal.phase).toBe('Rooted');
      expect(AGENT_CONFIG.niche.phase).toBe('Grounded');
      expect(AGENT_CONFIG.mindset.phase).toBe('Grounded');
      expect(AGENT_CONFIG.rhythm.phase).toBe('Rooted');
      expect(AGENT_CONFIG.purpose.phase).toBe('Radiant');
    });
  });

  describe('launchAllAgents', () => {
    it('should enqueue 10 agent jobs', async () => {
      const result = await orchestrator.launchAllAgents();

      expect(result.count).toBe(10);
      expect(result.jobIds).toHaveLength(10);
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const health = await orchestrator.getHealth();

      expect(health).toHaveProperty('redis');
      expect(health).toHaveProperty('queue');
      expect(health).toHaveProperty('agentRegistry');
      expect(health.agentRegistry).toHaveLength(10);
    });
  });

  describe('getReadinessStatus', () => {
    it('should return readiness for all agents', async () => {
      const status = await orchestrator.getReadinessStatus();

      expect(status).toHaveProperty('journal');
      expect(status).toHaveProperty('niche');
      expect(status).toHaveProperty('mindset');
      expect(status).toHaveProperty('rhythm');
      expect(status).toHaveProperty('purpose');
      expect(status).toHaveProperty('all_ready');
    });
  });
});
