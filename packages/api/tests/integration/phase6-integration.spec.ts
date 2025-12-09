/**
 * Phase 6 Integration Tests
 * Verifies Growth Agents orchestrator integration and feature flags
 */

import request from 'supertest';

// Mock environment for testing
process.env.ENABLE_GROWTH_AGENTS = 'true';
process.env.ENABLE_GROWTH_DASHBOARD = 'true';

const CORE_GROWTH_AGENTS = ['journal', 'niche', 'mindset', 'rhythm', 'purpose'];
const EXPECTED_TOTAL_GROWTH_AGENTS = 10;

describe('Phase 6 Integration Tests', () => {
  let app: any;

  beforeAll(() => {
    // Import app after setting environment variables
    app = require('../../src/index').default;
  });

  describe('Feature Flags', () => {
    it('should block orchestrator endpoints when ENABLE_GROWTH_AGENTS=false', async () => {
      // Temporarily disable
      process.env.ENABLE_GROWTH_AGENTS = 'false';

      // Re-import to pick up new env
      delete require.cache[require.resolve('../../src/index')];
      delete require.cache[require.resolve('../../src/growth-agents/orchestrator.router')];
      const disabledApp = require('../../src/index').default;

      const response = await request(disabledApp)
        .get('/api/orchestrator/health')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not enabled');

      // Re-enable for other tests
      process.env.ENABLE_GROWTH_AGENTS = 'true';
    });
  });

  describe('Orchestrator Endpoints', () => {
    it('GET /api/orchestrator/health should return health status', async () => {
      const response = await request(app)
        .get('/api/orchestrator/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('redis');
      expect(response.body).toHaveProperty('queue');
      expect(response.body).toHaveProperty('agentRegistry');

      const registry = response.body.agentRegistry;
      expect(Array.isArray(registry)).toBe(true);

      // Total count: core + growth.* variants
      expect(registry).toHaveLength(EXPECTED_TOTAL_GROWTH_AGENTS);

      // Ensure the 5 core agents are present
      CORE_GROWTH_AGENTS.forEach((agentKey) => {
        expect(registry).toContain(agentKey);
      });
    });

    it('GET /api/orchestrator/readiness should return agent readiness', async () => {
      const response = await request(app)
        .get('/api/orchestrator/readiness')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('journal');
      expect(response.body).toHaveProperty('niche');
      expect(response.body).toHaveProperty('mindset');
      expect(response.body).toHaveProperty('rhythm');
      expect(response.body).toHaveProperty('purpose');
    });

    it('POST /api/orchestrator/launch should launch agents', async () => {
      const response = await request(app)
        .post('/api/orchestrator/launch')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('jobIds');

      const jobIds = response.body.jobIds;
      expect(Array.isArray(jobIds)).toBe(true);

      // One job per registered growth agent (core + growth.*)
      expect(jobIds).toHaveLength(EXPECTED_TOTAL_GROWTH_AGENTS);

      // Optional sanity check: job IDs look like "agent-<something>"
      jobIds.forEach((id: string) => {
        expect(typeof id).toBe('string');
        expect(id.startsWith('agent-')).toBe(true);
      });
    });

    it('GET /api/orchestrator/monitor should return monitor data', async () => {
      const response = await request(app)
        .get('/api/orchestrator/monitor')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('events');
    });

    it('GET /api/orchestrator/monitor/latest filters by agent', async () => {
      const response = await request(app)
        .get('/api/orchestrator/monitor/latest?agent=journal&limit=5&eventsLimit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.agent === 'journal' || response.body.agent === 'growth.journal').toBe(true);
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('events');
    });
  });

  describe('Core Agents Regression Test', () => {
    it('GET /health should still work', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('running');
      expect(response.body.version).toBe('1.0.0');
    });

    it('GET /api/agents should still list core agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toHaveProperty('agents');
      expect(response.body.agents).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('GET /api/dashboard should still return dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body.dashboard).toBe('Elevated Movements AI Ecosystem');
      expect(response.body).toHaveProperty('agents_running');
      expect(response.body).toHaveProperty('key_metrics');
    });
  });

  describe('Voice API Regression Test', () => {
    it('Voice endpoints should remain accessible', async () => {
      // Just verify the endpoint exists (may fail without proper auth/data)
      const response = await request(app)
        .post('/api/voice/scheduler/block')
        .send({
          founder: 'darnell',
          minutes: 45,
          reason: 'Test focus block',
        });

      // Should not be 404
      expect(response.status).not.toBe(404);
    });
  });
});
