#!/usr/bin/env node

/**
 * BullMQ Worker for Growth Agents
 * Processes agent execution jobs with retry logic
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { BaseAgent, AgentResult } from './base-agent';
import { AGENT_CONFIG } from './orchestrator';

const logger = console;

/**
 * Worker job processor
 */
async function processAgentJob(job: Job): Promise<AgentResult> {
  const { agentName, config } = job.data;

  logger.info(`[Worker] Processing ${agentName} agent (job: ${job.id})`);

  try {
    // Dynamically import the agent module
    const agentConfig = AGENT_CONFIG[agentName];
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    // Import agent class
    const agentModule = await import(agentConfig.module);
    const AgentClass = agentModule[agentConfig.className] as new (cfg: any) => BaseAgent;

    // Instantiate and execute
    const agent = new AgentClass(config);
    const result = await agent.execute();

    logger.info(`[Worker] Completed ${agentName} agent:`, result.success ? '✓' : '✗');
    return result;
  } catch (error) {
    logger.error(`[Worker] Agent ${agentName} failed:`, error);
    throw error;
  }
}

/**
 * Start the worker
 */
function startWorker() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const worker = new Worker('growth-agents', processAgentJob, {
    connection: new Redis(redisUrl, { maxRetriesPerRequest: null }),
    concurrency: 5, // Run up to 5 agents concurrently
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute
    },
  });

  worker.on('completed', (job: Job) => {
    logger.info(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error(`[Worker] Job ${job?.id || 'unknown'} failed:`, error.message);
  });

  worker.on('error', (error: Error) => {
    logger.error('[Worker] Worker error:', error);
  });

  logger.info('[Worker] Growth agents worker started');
  logger.info(`[Worker] Concurrency: 5`);
  logger.info(`[Worker] Redis: ${redisUrl}`);
  logger.info('[Worker] Waiting for jobs...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('[Worker] SIGTERM received, shutting down...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('[Worker] SIGINT received, shutting down...');
    await worker.close();
    process.exit(0);
  });
}

// Start worker if running as main module
if (require.main === module) {
  startWorker();
}

export { startWorker };
