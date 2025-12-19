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
import { runJournalAgent } from '../services/journal.service';
import { buildJournalArtifact, getJournalPrompts, JournalArtifact, JournalIntent } from '../../../agents/journal';
import { startP0ArtifactRun, finalizeP0ArtifactRun, listP0ArtifactRuns, getP0ArtifactRun } from '../services/p0RunHistory.service';

const emAiExecAdminRouter = Router();

const JOURNAL_KIND = 'p0.journal';
const JOURNAL_ALLOWED_USERS = new Set(['darnell', 'shria']);
const JOURNAL_INTENTS = new Set<JournalIntent>([
  'journal.daily_reflection',
  'journal.midday_check_in',
  'journal.day_close',
]);

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


emAiExecAdminRouter.post('/api/exec-admin/p0/journal/run', async (req: Request, res: Response) => {
  const { user, intent, date, runId } = req.body || {};
  if (!user) {
    return res.status(400).json({ error: 'user is required' });
  }
  if (!JOURNAL_ALLOWED_USERS.has(user)) {
    return res.status(400).json({ error: 'user must be one of: darnell, shria' });
  }
  if (!intent || !JOURNAL_INTENTS.has(intent)) {
    return res.status(400).json({
      error: 'intent must be one of: journal.daily_reflection, journal.midday_check_in, journal.day_close',
    });
  }

  const kind = JOURNAL_KIND;
  const run = startP0ArtifactRun({ kind, runId });
  const warnings: string[] = [];
  let artifact: JournalArtifact;
  let status: 'success' | 'fail' = 'success';
  const resolvedDate = date || new Date().toISOString().slice(0, 10);

  try {
    artifact = await runJournalAgent({ user, intent, date });
  } catch (err) {
    warnings.push('Journal generation failed; returning placeholder output.');
    artifact = buildJournalArtifact({
      intent,
      user,
      date: resolvedDate,
      prompts: getJournalPrompts(intent),
    });
    status = 'fail';
  }

  const finalized = finalizeP0ArtifactRun(run.runId, { status, artifact, kind });

  return res.json({
    runId: finalized.runId,
    kind,
    status: finalized.status,
    artifact,
    ...(warnings.length ? { warnings } : {}),
  });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/journal/runs', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 20);
  const items = listP0ArtifactRuns({ kind: JOURNAL_KIND, limit });
  return res.json({ items, limit });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/journal/runs/:runId', async (req: Request, res: Response) => {
  const run = getP0ArtifactRun(req.params.runId);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  return res.json(run);
});

export default emAiExecAdminRouter;
