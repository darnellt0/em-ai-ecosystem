/**
 * Growth Agent Orchestrator - API Router
 * Exposes REST endpoints for orchestrator operations
 */

import { Router, Request, Response } from 'express';
import {
  getOrchestrator,
  GROWTH_AGENTS,
  OrchestratorRunContext,
} from '../../../orchestrator/dist/growth';

const router = Router();

/**
 * Initialize orchestrator with all agents
 */
const orchestrator = getOrchestrator();

// Register all 5 Growth Agents
GROWTH_AGENTS.forEach((agent) => {
  orchestrator.registerAgent(agent);
});

console.log(`[Orchestrator Router] Registered ${GROWTH_AGENTS.length} Growth Agents`);

/**
 * POST /api/orchestrator/launch
 * Launch all Growth Agents for a user
 */
router.post('/launch', async (req: Request, res: Response) => {
  try {
    const { userId, email, userName } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
    }

    console.log(`[Orchestrator API] Launching agents for user: ${userId}`);

    // Create context
    const context: OrchestratorRunContext = {
      userId,
      email: email || userId,
      userName: userName || 'User',
      timestamp: new Date().toISOString(),
    };

    // Launch all agents
    const summary = await orchestrator.launchAllGrowthAgents(context);

    res.json({
      status: 'success',
      message: `Launched ${summary.totalAgents} Growth Agents`,
      summary: {
        success: summary.success,
        startedAt: summary.startedAt,
        completedAt: summary.completedAt,
        totalAgents: summary.totalAgents,
        successfulAgents: summary.successfulAgents,
        failedAgents: summary.failedAgents,
        errors: summary.errors,
      },
      results: Object.entries(summary.results).map(([key, result]) => ({
        agentKey: key,
        success: result.success,
        errors: result.errors,
        artifacts: result.artifacts,
      })),
    });
  } catch (error: any) {
    console.error('[Orchestrator API] Launch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/orchestrator/health
 * Get orchestrator and agent health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await orchestrator.getHealth();

    res.json({
      status: 'success',
      health: {
        redisConnected: health.redisConnected,
        timestamp: health.timestamp,
        agents: health.agents.map((agent) => ({
          key: agent.key,
          displayName: agent.displayName,
          phase: agent.phase,
          status: agent.status,
          ready: agent.ready,
          lastUpdated: agent.lastUpdated,
          lastError: agent.lastError,
          runCount: agent.runCount,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Orchestrator API] Health check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/orchestrator/readiness
 * Get readiness summary for all agents
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const readiness = await orchestrator.getReadinessSummary();

    res.json({
      status: 'success',
      readiness: {
        journal: readiness.journal,
        niche: readiness.niche,
        mindset: readiness.mindset,
        rhythm: readiness.rhythm,
        purpose: readiness.purpose,
        allReady: readiness.allReady,
        timestamp: readiness.timestamp,
      },
    });
  } catch (error: any) {
    console.error('[Orchestrator API] Readiness check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/orchestrator/progress
 * Get progress snapshot for all agents
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const progress = await orchestrator.getProgressSnapshot(limit);

    res.json({
      status: 'success',
      progress,
    });
  } catch (error: any) {
    console.error('[Orchestrator API] Progress fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/orchestrator/agents
 * List all registered agents
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const agents = orchestrator.getAgents();

    res.json({
      status: 'success',
      agents: agents.map((agent) => ({
        key: agent.key,
        displayName: agent.displayName,
        phase: agent.phase,
        priority: agent.priority,
        description: agent.description,
      })),
      count: agents.length,
    });
  } catch (error: any) {
    console.error('[Orchestrator API] Agents list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
