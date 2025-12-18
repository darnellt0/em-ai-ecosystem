import { Router, Request, Response } from 'express';
import {
  launchGrowthPack,
  getGrowthStatus,
  listGrowthRunRecords,
  getGrowthRunRecord,
  getGrowthStatus as refreshGrowthStatus,
} from '../services/emAi.service';
import { updateGrowthRun, getGrowthRun } from '../services/growthRunHistory.service';
import { buildGrowthRunSummary } from '../services/growthRunSummary.service';
import { orchestrator } from '../growth-agents/orchestrator';
import { finalizeRunIfTerminal } from '../services/growthRunFinalize.service';

const emAiExecAdminRouter = Router();

emAiExecAdminRouter.post('/em-ai/exec-admin/growth/run', async (req: Request, res: Response) => {
  const { founderEmail, mode } = req.body || {};

  if (!founderEmail) {
    return res.status(400).json({
      success: false,
      error: 'founderEmail is required.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await launchGrowthPack({ founderEmail, mode });
    return res.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Exec Admin] Growth run failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/status', async (_req: Request, res: Response) => {
  try {
    const status = await getGrowthStatus();
    return res.json({ success: true, ...status, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Exec Admin] Growth status failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/runs', async (req: Request, res: Response) => {
  const founderEmail = (req.query.founderEmail as string) || process.env.FOUNDER_SHRIA_EMAIL || process.env.FOUNDER_DARNELL_EMAIL;
  try {
    const runs = await listGrowthRunRecords(founderEmail || 'founder@example.com', Number(req.query.limit) || 10);
    return res.json({ success: true, runs, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/runs/:runId', async (req: Request, res: Response) => {
  try {
    const run = await getGrowthRunRecord(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    return res.json({ success: true, run, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

emAiExecAdminRouter.post('/em-ai/exec-admin/growth/runs/:runId/refresh', async (req: Request, res: Response) => {
  try {
    const status = await refreshGrowthStatus();
    const run = await getGrowthRunRecord(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    // simple summary update
    const updated = await updateGrowthRun(req.params.runId, {
      summary: {
        topProgress: status.recentProgress?.slice(0, 10) || [],
        topEvents: status.recentEvents?.slice(0, 10) || [],
      },
      lastProgressAt: new Date().toISOString(),
    });
    return res.json({ success: true, run: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

// Run summary (server-computed)
emAiExecAdminRouter.get('/em-ai/exec-admin/growth/runs/:runId/summary', async (req: Request, res: Response) => {
  try {
    const run = await getGrowthRunRecord(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });

    // attempt to refresh with latest monitor data (best effort)
    let monitor: { progress?: any[]; events?: any[] } | undefined;
    try {
      const monitorData = await orchestrator.getMonitorData(20);
      monitor = { progress: monitorData.progress, events: monitorData.events };
    } catch {
      // soft fail, ignore
    }

    const summary = buildGrowthRunSummary(run, monitor);
    return res.json({ success: true, summary, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

// Retry failed agents (feature-flagged)
emAiExecAdminRouter.post('/em-ai/exec-admin/growth/runs/:runId/retry', async (req: Request, res: Response) => {
  if (process.env.ENABLE_GROWTH_RETRY !== 'true') {
    return res.status(403).json({ success: false, error: 'Retry disabled (set ENABLE_GROWTH_RETRY=true)', timestamp: new Date().toISOString() });
  }

  try {
    const run = await getGrowthRun(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });

    const summary = buildGrowthRunSummary(run);
    const failedAgents = summary.agents.failed;
    const requestedAgents: string[] | undefined = Array.isArray(req.body?.agents) ? req.body.agents : undefined;
    const retryAgents = (requestedAgents || failedAgents || []).filter((a) => failedAgents.includes(a));

    if (!retryAgents.length) {
      return res.json({
        success: true,
        message: 'Nothing to retry',
        retriedAgents: [],
        jobIds: [],
        runId: run.runId,
        timestamp: new Date().toISOString(),
      });
    }

    const jobIds: string[] = [];
    for (const agentName of retryAgents) {
      try {
        const job = await orchestrator.launchAgent(agentName, { founderEmail: run.founderEmail, mode: run.mode, metadata: { runId: run.runId } });
        jobIds.push(job.jobId);
      } catch (err) {
        console.error('[Exec Admin] Retry failed for agent', agentName, err);
      }
    }

    await updateGrowthRun(run.runId, {
      status: 'running',
      jobIds: [...(run.jobIds || []), ...jobIds],
      retriedAgents: Array.from(new Set([...(run.retriedAgents || []), ...retryAgents])),
      lastProgressAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      runId: run.runId,
      retriedAgents: retryAgents,
      jobIds,
      message: 'Retry enqueued',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

// Finalize run (terminal check)
emAiExecAdminRouter.post('/em-ai/exec-admin/growth/runs/:runId/finalize', async (req: Request, res: Response) => {
  try {
    const result = await finalizeRunIfTerminal(req.params.runId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    }
    return res.json({
      success: true,
      run: result.run,
      summary: result.summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

export default emAiExecAdminRouter;
