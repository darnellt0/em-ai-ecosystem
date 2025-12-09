/**
 * Express Router for Growth Agents Orchestrator
 * Provides endpoints for launching, monitoring, and checking agent status
 */

import express, { Request, Response, NextFunction } from 'express';
import { orchestrator } from './orchestrator';
import { checkAllAgentsHealth, validateAgentRegistry, getAllAgentIds, getAgentMetadata } from './agent-registry';
import { runPhase6QA } from './integration-qa-agent';

const router = express.Router();

/**
 * Feature flag middleware - guards all growth agent endpoints
 */
const requireGrowthAgentsEnabled = (req: Request, res: Response, next: NextFunction) => {
  const enabled = process.env.ENABLE_GROWTH_AGENTS === 'true';

  if (!enabled) {
    return res.status(403).json({
      success: false,
      error: 'Growth agents are not enabled',
      message: 'Set ENABLE_GROWTH_AGENTS=true in environment to enable this feature',
    });
  }

  next();
};

// Apply feature flag middleware to all routes
router.use(requireGrowthAgentsEnabled);

/**
 * POST /api/orchestrator/launch
 * Launch all growth agents
 */
router.post('/launch', async (req: Request, res: Response) => {
  try {
    const result = await orchestrator.launchAllAgents();

    res.json({
      success: true,
      message: `Launched ${result.count} growth agents`,
      jobIds: result.jobIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Orchestrator API] Launch failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/orchestrator/health
 * Check orchestrator and worker health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await orchestrator.getHealth();

    res.json({
      success: true,
      ...health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Orchestrator API] Health check failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/orchestrator/monitor
 * Stream recent progress and events
 */
router.get('/monitor', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const data = await orchestrator.getMonitorData(limit);

    res.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Orchestrator API] Monitor failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/orchestrator/agents/health
 * Registry healthcheck - validates all agents and their dependencies
 */
router.get('/agents/health', async (req: Request, res: Response) => {
  try {
    // Validate registry structure
    const validation = validateAgentRegistry();

    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        error: 'Agent registry validation failed',
        errors: validation.errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Run healthchecks for all agents
    const healthStatuses = await checkAllAgentsHealth();

    // Determine overall health
    const allHealthy = Object.values(healthStatuses).every(
      (status) => status.status === 'healthy'
    );

    // Get all agent metadata
    const agentIds = getAllAgentIds();
    const agents = agentIds.map((id) => ({
      id,
      metadata: getAgentMetadata(id),
      health: healthStatuses[id],
    }));

    res.json({
      success: true,
      overall_status: allHealthy ? 'healthy' : 'degraded',
      agent_count: agentIds.length,
      agents,
      validation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Orchestrator API] Agent health check failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/orchestrator/qa/phase6
 * Run Phase 6 integration QA tests on all agents
 */
router.post('/qa/phase6', async (req: Request, res: Response) => {
  try {
    const report = await runPhase6QA();

    const statusCode = report.overall_status === 'PASS' ? 200 : 500;

    res.status(statusCode).json({
      success: report.overall_status === 'PASS',
      report,
    });
  } catch (error) {
    console.error('[Orchestrator API] Phase 6 QA failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/orchestrator/readiness
 * Check readiness status of all agents
 */
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const status = await orchestrator.getReadinessStatus();

    // If all agents are ready, generate verification summary
    if (status.all_ready) {
      const monitorData = await orchestrator.getMonitorData(50);

      // Extract key metrics
      const summary = {
        all_ready: true,
        agents: ['journal', 'niche', 'mindset', 'rhythm', 'purpose'],
        completion_time: new Date().toISOString(),
        progress_events: monitorData.progress.length,
        verification: 'All 5 growth agents completed successfully',
      };

      console.log('\n' + '='.repeat(80));
      console.log('VERIFICATION SUMMARY - Phase 6 Growth Agents');
      console.log('='.repeat(80));
      console.log(JSON.stringify(summary, null, 2));
      console.log('='.repeat(80) + '\n');

      res.json({
        success: true,
        ...status,
        summary,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        success: true,
        ...status,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Orchestrator API] Readiness check failed:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
