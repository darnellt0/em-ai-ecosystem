/**
 * Agent Registry - Centralized agent metadata and validation
 *
 * Purpose: Enumerate all agents with metadata, healthcheck, and execution functions
 */

import { JournalAgent } from './journal-agent';
import { NicheAgent } from './niche-agent';
import { MindsetAgent } from './mindset-agent';
import { RhythmAgent } from './rhythm-agent';
import { PurposeAgent } from './purpose-agent';
import { BaseAgent } from './base-agent';
import Redis from 'ioredis';
import { createRedisClient } from '../config/redis.config';

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  status?: 'active' | 'frozen';
  phase: 'Rooted' | 'Grounded' | 'Radiant';
  priority: number;
  version: string;
  dependencies: string[];
}

export interface AgentHealthStatus {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  checks: {
    redis?: boolean;
    envVars?: boolean;
    dependencies?: boolean;
  };
}

export interface AgentRegistryEntry {
  metadata: AgentMetadata;
  healthcheck: () => Promise<AgentHealthStatus>;
  execute: (config: { name: string; phase: 'Rooted' | 'Grounded' | 'Radiant'; priority: number }) => BaseAgent;
}

/**
 * Complete Agent Registry
 */
export const AGENT_REGISTRY: Record<string, AgentRegistryEntry> = {
  journal: {
    metadata: {
      id: 'journal',
      name: 'Daily Journal Agent',
      description: 'Sends personalized daily journal prompts based on founder preferences',
      status: 'frozen',
      phase: 'Rooted',
      priority: 1,
      version: '1.0.0',
      dependencies: ['OPENAI_API_KEY'],
    },
    healthcheck: async () => {
      const agentId = 'journal';
      const timestamp = new Date().toISOString();
      const checks = {
        envVars: !!process.env.OPENAI_API_KEY,
        redis: false,
      };

      try {
        const redis = createRedisClient();
        await redis.ping();
        checks.redis = true;
        await redis.quit();
      } catch (error) {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);

      return {
        agentId,
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy ? 'All checks passed' : 'Some checks failed',
        timestamp,
        checks,
      };
    },
    execute: (config) => {
      return new JournalAgent(config);
    },
  },

  niche: {
    metadata: {
      id: 'niche',
      name: 'Niche Research Agent',
      description: 'Analyzes growth opportunities and generates niche insights for founders',
      status: 'frozen',
      phase: 'Grounded',
      priority: 2,
      version: '1.0.0',
      dependencies: ['OPENAI_API_KEY'],
    },
    healthcheck: async () => {
      const agentId = 'niche';
      const timestamp = new Date().toISOString();
      const checks = {
        envVars: !!process.env.OPENAI_API_KEY,
        redis: false,
      };

      try {
        const redis = createRedisClient();
        await redis.ping();
        checks.redis = true;
        await redis.quit();
      } catch (error) {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);

      return {
        agentId,
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy ? 'All checks passed' : 'Some checks failed',
        timestamp,
        checks,
      };
    },
    execute: (config) => {
      return new NicheAgent(config);
    },
  },

  mindset: {
    metadata: {
      id: 'mindset',
      name: 'Mindset Coaching Agent',
      description: 'Provides mindset coaching and mental framework guidance for founders',
      status: 'frozen',
      phase: 'Grounded',
      priority: 3,
      version: '1.0.0',
      dependencies: ['OPENAI_API_KEY'],
    },
    healthcheck: async () => {
      const agentId = 'mindset';
      const timestamp = new Date().toISOString();
      const checks = {
        envVars: !!process.env.OPENAI_API_KEY,
        redis: false,
      };

      try {
        const redis = createRedisClient();
        await redis.ping();
        checks.redis = true;
        await redis.quit();
      } catch (error) {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);

      return {
        agentId,
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy ? 'All checks passed' : 'Some checks failed',
        timestamp,
        checks,
      };
    },
    execute: (config) => {
      return new MindsetAgent(config);
    },
  },

  rhythm: {
    metadata: {
      id: 'rhythm',
      name: 'Weekly Rhythm Agent',
      description: 'Tracks and optimizes founder weekly rhythms and productivity patterns',
      status: 'frozen',
      phase: 'Rooted',
      priority: 4,
      version: '1.0.0',
      dependencies: ['OPENAI_API_KEY'],
    },
    healthcheck: async () => {
      const agentId = 'rhythm';
      const timestamp = new Date().toISOString();
      const checks = {
        envVars: !!process.env.OPENAI_API_KEY,
        redis: false,
      };

      try {
        const redis = createRedisClient();
        await redis.ping();
        checks.redis = true;
        await redis.quit();
      } catch (error) {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);

      return {
        agentId,
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy ? 'All checks passed' : 'Some checks failed',
        timestamp,
        checks,
      };
    },
    execute: (config) => {
      return new RhythmAgent(config);
    },
  },

  purpose: {
    metadata: {
      id: 'purpose',
      name: 'Purpose Alignment Agent',
      description: 'Ensures founder activities align with long-term purpose and vision',
      status: 'frozen',
      phase: 'Radiant',
      priority: 5,
      version: '1.0.0',
      dependencies: ['OPENAI_API_KEY'],
    },
    healthcheck: async () => {
      const agentId = 'purpose';
      const timestamp = new Date().toISOString();
      const checks = {
        envVars: !!process.env.OPENAI_API_KEY,
        redis: false,
      };

      try {
        const redis = createRedisClient();
        await redis.ping();
        checks.redis = true;
        await redis.quit();
      } catch (error) {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(Boolean);

      return {
        agentId,
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy ? 'All checks passed' : 'Some checks failed',
        timestamp,
        checks,
      };
    },
    execute: (config) => {
      return new PurposeAgent(config);
    },
  },
};

/**
 * Get all agent IDs
 */
export function getAllAgentIds(): string[] {
  return Object.keys(AGENT_REGISTRY);
}

/**
 * Get agent metadata by ID
 */
export function getAgentMetadata(agentId: string): AgentMetadata | null {
  const entry = AGENT_REGISTRY[agentId];
  return entry ? entry.metadata : null;
}

/**
 * Run healthcheck for a specific agent
 */
export async function checkAgentHealth(agentId: string): Promise<AgentHealthStatus | null> {
  const entry = AGENT_REGISTRY[agentId];
  if (!entry) {
    return null;
  }
  return await entry.healthcheck();
}

/**
 * Run healthcheck for all agents
 */
export async function checkAllAgentsHealth(): Promise<Record<string, AgentHealthStatus>> {
  const results: Record<string, AgentHealthStatus> = {};

  for (const agentId of getAllAgentIds()) {
    const health = await checkAgentHealth(agentId);
    if (health) {
      results[agentId] = health;
    }
  }

  return results;
}

/**
 * Validate agent registry on startup
 */
export function validateAgentRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [agentId, entry] of Object.entries(AGENT_REGISTRY)) {
    // Check metadata
    if (!entry.metadata) {
      errors.push(`${agentId}: missing metadata`);
    } else {
      if (!entry.metadata.id) errors.push(`${agentId}: missing metadata.id`);
      if (!entry.metadata.name) errors.push(`${agentId}: missing metadata.name`);
      if (!entry.metadata.description) errors.push(`${agentId}: missing metadata.description`);
      if (!entry.metadata.phase) errors.push(`${agentId}: missing metadata.phase`);
      if (entry.metadata.priority === undefined) errors.push(`${agentId}: missing metadata.priority`);
    }

    // Check healthcheck function
    if (typeof entry.healthcheck !== 'function') {
      errors.push(`${agentId}: healthcheck must be a function`);
    }

    // Check execute function
    if (typeof entry.execute !== 'function') {
      errors.push(`${agentId}: execute must be a function`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
