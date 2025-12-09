/**
 * GrowthOrchestrator - Phase 6 Agent Coordination
 * Launches and monitors 5 growth agents concurrently using BullMQ
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';

export interface AgentRegistration {
  module: string;
  className: string;
  phase: 'Rooted' | 'Grounded' | 'Radiant';
  priority: number;
}

/**
 * Agent configuration registry
 */
export const AGENT_CONFIG: Record<string, AgentRegistration> = {
  journal: {
    module: './journal-agent',
    className: 'JournalAgent',
    phase: 'Rooted',
    priority: 1,
  },
  niche: {
    module: './niche-agent',
    className: 'NicheAgent',
    phase: 'Grounded',
    priority: 2,
  },
  mindset: {
    module: './mindset-agent',
    className: 'MindsetAgent',
    phase: 'Grounded',
    priority: 3,
  },
  rhythm: {
    module: './rhythm-agent',
    className: 'RhythmAgent',
    phase: 'Rooted',
    priority: 4,
  },
  purpose: {
    module: './purpose-agent',
    className: 'PurposeAgent',
    phase: 'Radiant',
    priority: 5,
  },
  'growth.journal': {
    module: './journal-agent',
    className: 'JournalAgent',
    phase: 'Rooted',
    priority: 1,
  },
  'growth.niche': {
    module: './niche-agent',
    className: 'NicheAgent',
    phase: 'Grounded',
    priority: 2,
  },
  'growth.mindset': {
    module: './mindset-agent',
    className: 'MindsetAgent',
    phase: 'Grounded',
    priority: 3,
  },
  'growth.rhythm': {
    module: './rhythm-agent',
    className: 'RhythmAgent',
    phase: 'Rooted',
    priority: 4,
  },
  'growth.purpose': {
    module: './purpose-agent',
    className: 'PurposeAgent',
    phase: 'Radiant',
    priority: 5,
  },
};

/**
 * GrowthOrchestrator - Coordinates all growth agents
 */
export class GrowthOrchestrator {
  private redis: Redis;
  private queue: Queue;
  private logger = console;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.queue = new Queue('growth-agents', {
      connection: new Redis(redisUrl),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  /**
   * Launch all configured growth agents
   */
  async launchAllAgents(): Promise<{ jobIds: string[]; count: number }> {
    this.logger.info('[Orchestrator] Launching all growth agents...');
    const jobIds: string[] = [];

    for (const [name, config] of Object.entries(AGENT_CONFIG)) {
      try {
        const job = await this.queue.add(
          'execute-agent',
          {
            agentName: name,
            config: {
              name,
              ...config,
            },
          },
          {
            priority: config.priority,
            jobId: `agent-${name}-${Date.now()}`,
          }
        );

        jobIds.push(job.id as string);
        this.logger.info(`[Orchestrator] Enqueued ${name} agent (job: ${job.id})`);
      } catch (error) {
        this.logger.error(`[Orchestrator] Failed to enqueue ${name}:`, error);
      }
    }

    return { jobIds, count: jobIds.length };
  }

  /**
   * Get health status of orchestrator
   */
  async getHealth(): Promise<{
    redis: string;
    queue: string;
    agentRegistry: string[];
    workers: number;
  }> {
    try {
      // Check Redis connectivity
      const redisPing = await this.redis.ping();

      // Check queue stats
      const queueCounts = await this.queue.getJobCounts('wait', 'active', 'completed', 'failed');

      // Get worker count (approximate by checking active jobs)
      const workers = queueCounts.active || 0;

      return {
        redis: redisPing === 'PONG' ? 'OK' : 'ERROR',
        queue: 'OK',
        agentRegistry: Object.keys(AGENT_CONFIG),
        workers,
      };
    } catch (error) {
      this.logger.error('[Orchestrator] Health check failed:', error);
      return {
        redis: 'ERROR',
        queue: 'ERROR',
        agentRegistry: Object.keys(AGENT_CONFIG),
        workers: 0,
      };
    }
  }

  /**
   * Get recent progress events from Redis stream
   */
  async getMonitorData(limit: number = 200): Promise<{
    progress: Array<{ agent: string; phase: string; percent: string; note: string; timestamp: string }>;
    events: Array<{ agent: string; kind: string; payload: string; timestamp: string }>;
  }> {
    try {
      // Get progress events
      const progressStream = await this.redis.xrevrange('agent:progress', '+', '-', 'COUNT', limit);
      const progress = progressStream.map((entry) => {
        const [, fields] = entry;
        const obj: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          obj[fields[i]] = fields[i + 1];
        }
        return obj as { agent: string; phase: string; percent: string; note: string; timestamp: string };
      });

      // Get events
      const eventsStream = await this.redis.xrevrange('agent:events', '+', '-', 'COUNT', limit);
      const events = eventsStream.map((entry) => {
        const [, fields] = entry;
        const obj: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          obj[fields[i]] = fields[i + 1];
        }
        return obj as { agent: string; kind: string; payload: string; timestamp: string };
      });

      return { progress, events };
    } catch (error) {
      this.logger.error('[Orchestrator] Failed to get monitor data:', error);
      return { progress: [], events: [] };
    }
  }

  /**
   * Get readiness status for all agents
   */
  async getReadinessStatus(): Promise<{
    journal: boolean;
    niche: boolean;
    mindset: boolean;
    rhythm: boolean;
    purpose: boolean;
    all_ready: boolean;
  }> {
    const statuses = {
      journal: false,
      niche: false,
      mindset: false,
      rhythm: false,
      purpose: false,
      all_ready: false,
    };

    try {
      for (const agent of Object.keys(AGENT_CONFIG)) {
        const ready = await this.redis.get(`agent:ready:${agent}`);
        statuses[agent as keyof typeof statuses] = ready === 'true';
      }

      statuses.all_ready = Object.entries(statuses)
        .filter(([key]) => key !== 'all_ready')
        .every(([, value]) => value === true);
    } catch (error) {
      this.logger.error('[Orchestrator] Failed to get readiness status:', error);
    }

    return statuses;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.queue.close();
    await this.redis.quit();
  }
}

export const orchestrator = new GrowthOrchestrator();
