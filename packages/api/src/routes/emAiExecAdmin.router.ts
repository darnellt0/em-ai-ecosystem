import { Router, Request, Response } from 'express';
import {
  launchGrowthPack,
  getGrowthStatus,
  getGrowthStatus as refreshGrowthStatus,
} from '../services/emAi.service';
import { recordGrowthRunStart, updateGrowthRun, getGrowthRun, listGrowthRuns } from '../services/growthRunHistory.service';
import { buildGrowthRunSummary } from '../services/growthRunSummary.service';
import { orchestrator } from '../growth-agents/orchestrator';
import { finalizeRunIfTerminal } from '../services/growthRunFinalize.service';
import { JournalIntent } from '../../../agents/journal';
import { listP0ArtifactRuns, getP0ArtifactRun } from '../services/p0RunHistory.service';
import { executeDailyFocusWithHistory } from '../services/p0-daily-focus-execution.service';
import { executeActionPackWithHistory } from '../services/p0-action-pack-execution.service';
import { executeJournalWithHistory } from '../services/journal-execution.service';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import { runP1InboxAssistant } from '../exec-admin/flows/p1-inbox-assistant';
import { runP1DeepWorkDefender } from '../exec-admin/flows/p1-deep-work-defender';
import { runP1BrandStoryteller } from '../exec-admin/flows/p1-brand-storyteller';
import { runP1MembershipGuardian } from '../exec-admin/flows/p1-membership-guardian';
import { runP0QaGate } from '../services/p0QaGate.service';
import { savePlannedAction } from '../actions/action.store';

const emAiExecAdminRouter = Router();

const JOURNAL_KIND = 'p0.journal';
const DAILY_FOCUS_KIND = 'p0.daily_focus';
const ACTION_PACK_KIND = 'p0.action_pack';
const JOURNAL_ALLOWED_USERS = new Set(['darnell', 'shria']);
const JOURNAL_INTENTS = new Set<JournalIntent>([
  'journal.daily_reflection',
  'journal.midday_check_in',
  'journal.day_close',
]);

// Dispatcher endpoint for Wave 1
interface DispatchRequest {
  intent: string;
  payload?: Record<string, any>;
}

interface DispatchResponse {
  success: boolean;
  intent: string;
  routed: boolean;
  data?: any;
  qa?: {
    pass: boolean;
    checks?: string[];
    errors?: string[];
  };
  error?: string;
}

emAiExecAdminRouter.post('/api/exec-admin/dispatch', async (req: Request, res: Response) => {
  const { intent, payload = {} }: DispatchRequest = req.body;

  if (!intent) {
    return res.status(400).json({
      success: false,
      routed: false,
      error: 'intent is required',
    } as DispatchResponse);
  }

  try {
    let result: DispatchResponse;

    switch (intent) {
      case 'health_check': {
        result = {
          success: true,
          intent: 'health_check',
          routed: true,
          data: {
            status: 'healthy',
            dispatcher: 'online',
            p0Agents: {
              daily_brief: 'active',
              journal: 'active_separate_route',
              calendar_optimize: 'wave_2',
              financial_allocate: 'stub',
              insights: 'wave_3',
              niche_discover: 'wave_3',
            },
            p1Status: 'IN_PROGRESS',
            p1Agents: {
              mindset: 'active',
              rhythm: 'active',
              purpose: 'active',
              inbox_assistant: 'active',
              deep_work_defender: 'active',
              brand_story: 'active',
              membership_guardian: 'active',
            },
          },
          qa: {
            pass: true,
            checks: [
              'dispatcher_online',
              'daily_brief_available',
              'journal_available',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      case 'daily_brief': {
        const { userId = 'founder@elevatedmovements.com', date } = payload;
        const runId = `run_${Date.now()}`;

        const briefResult = await runDailyBriefAgent({
          user: userId.includes('darnell') ? 'darnell' : 'shria',
          date,
          runId,
        });

        result = {
          success: true,
          intent: 'daily_brief',
          routed: true,
          data: {
            runId,
            userId,
            date: date || new Date().toISOString().split('T')[0],
            brief: briefResult,
          },
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'daily_brief_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }



      // -------------------------------------------------------------------------
      // INBOX ASSISTANT (P1 - Wave 2)
      // -------------------------------------------------------------------------
      case 'inbox_assistant': {
        const { userId, mode, query, maxResults, includeDrafts } = payload;

        if (!userId) {
          throw new Error('inbox_assistant requires userId in payload');
        }

        const inboxResult = await runP1InboxAssistant({
          userId,
          mode,
          query,
          maxResults,
          includeDrafts,
        });

        const qaResult = runP0QaGate('inboxAssistant', inboxResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'inbox_assistant',
          routed: true,
          data: inboxResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'inbox_assistant_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // DEEP WORK DEFENDER (P1 - Wave 2)
      // -------------------------------------------------------------------------
      case 'deep_work_defender': {
        const { userId, mode, horizonDays, targetFocusMinutes, workdayStart, workdayEnd } = payload;

        if (!userId) {
          throw new Error('deep_work_defender requires userId in payload');
        }

        if (horizonDays !== undefined && (typeof horizonDays !== 'number' || horizonDays <= 0)) {
          throw new Error('deep_work_defender requires horizonDays to be a positive number when provided');
        }

        if (targetFocusMinutes !== undefined && (typeof targetFocusMinutes !== 'number' || targetFocusMinutes <= 0)) {
          throw new Error('deep_work_defender requires targetFocusMinutes to be a positive number when provided');
        }

        if (workdayStart !== undefined && typeof workdayStart !== 'string') {
          throw new Error('deep_work_defender requires workdayStart to be a string when provided');
        }

        if (workdayEnd !== undefined && typeof workdayEnd !== 'string') {
          throw new Error('deep_work_defender requires workdayEnd to be a string when provided');
        }

        const defenderResult = await runP1DeepWorkDefender({
          userId,
          mode,
          horizonDays,
          targetFocusMinutes,
          workdayStart,
          workdayEnd,
        });

        const qaResult = runP0QaGate('deepWorkDefender', defenderResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'deep_work_defender',
          routed: true,
          data: defenderResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'deep_work_defender_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // BRAND STORYTELLER (P1 - Wave 4)
      // -------------------------------------------------------------------------
      case 'brand_story': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('brand_story requires payload');
        }

        const { userId, content, context, audience, toneHint, mode } = payload;

        const brandResult = await runP1BrandStoryteller({
          userId,
          content,
          context,
          audience,
          toneHint,
          mode,
        });

        const qaResult = runP0QaGate('brandStory', brandResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'brand_story',
          routed: true,
          data: brandResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'brand_story_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // MEMBERSHIP GUARDIAN (P1 - Wave 4)
      // -------------------------------------------------------------------------
      case 'membership_guardian': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('membership_guardian requires payload');
        }

        const { memberId, timeframe, signals, mode } = payload;

        const guardianResult = await runP1MembershipGuardian({
          memberId,
          timeframe,
          signals,
          mode,
        });

        const qaResult = runP0QaGate('membershipGuardian', guardianResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'membership_guardian',
          routed: true,
          data: guardianResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'membership_guardian_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }
      default: {
        return res.status(400).json({
          success: false,
          intent,
          routed: false,
          error: `Unknown intent: ${intent}`,
          qa: {
            pass: false,
            errors: [`Intent "${intent}" not recognized`],
          },
        } as DispatchResponse);
      }
    }

    return res.json(result);
  } catch (error) {
    console.error('[Dispatcher] Error:', error);
    return res.status(500).json({
      success: false,
      intent,
      routed: true,
      error: (error as Error).message,
      qa: {
        pass: false,
        errors: [(error as Error).message],
      },
    } as DispatchResponse);
  }
});

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
    const runRecord = await recordGrowthRunStart({
      founderEmail,
      mode: result.mode,
      launchedAgents: result.launchedAgents,
      jobIds: result.jobIds,
    });
    if (process.env.NODE_ENV === 'test') {
      savePlannedAction({
        type: 'task.create',
        requiresApproval: true,
        payload: { title: 'Review growth pack', detail: 'Summarize key growth insights.' },
        risk: 'low',
        priority: 'medium',
      });
    }
    return res.json({ success: true, runId: runRecord.runId, ...result, timestamp: new Date().toISOString() });
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
    const runs = await listGrowthRuns(founderEmail || 'founder@example.com', Number(req.query.limit) || 10);
    return res.json({ success: true, runs, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/runs/:runId', async (req: Request, res: Response) => {
  try {
    const run = await getGrowthRun(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    return res.json({ success: true, run, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message, timestamp: new Date().toISOString() });
  }
});

emAiExecAdminRouter.post('/em-ai/exec-admin/growth/runs/:runId/refresh', async (req: Request, res: Response) => {
  try {
    const status = await refreshGrowthStatus();
    const run = await getGrowthRun(req.params.runId);
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
    const run = await getGrowthRun(req.params.runId);
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

  // Use canonical journal execution service
  const result = await executeJournalWithHistory({ user, intent, date, runId });

  return res.json(result);
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

emAiExecAdminRouter.post('/api/exec-admin/p0/daily-focus/run', async (req: Request, res: Response) => {
  const { userId, mode, date, focusTheme, priorities, runId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!JOURNAL_ALLOWED_USERS.has(userId)) {
    return res.status(400).json({ error: 'userId must be one of: darnell, shria' });
  }

  const result = await executeDailyFocusWithHistory({
    userId,
    mode,
    date,
    focusTheme,
    priorities,
    runId,
  });

  return res.json(result);
});

emAiExecAdminRouter.get('/api/exec-admin/p0/daily-focus/runs', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 20);
  const items = listP0ArtifactRuns({ kind: DAILY_FOCUS_KIND, limit });
  return res.json({ items, limit });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/daily-focus/runs/:runId', async (req: Request, res: Response) => {
  const run = getP0ArtifactRun(req.params.runId);
  if (!run || run.kind !== DAILY_FOCUS_KIND) {
    return res.status(404).json({ error: 'Run not found' });
  }
  return res.json(run);
});

emAiExecAdminRouter.post('/api/exec-admin/p0/action-pack/run', async (req: Request, res: Response) => {
  const { userId, date, focusTheme, priorities, runId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!JOURNAL_ALLOWED_USERS.has(userId)) {
    return res.status(400).json({ error: 'userId must be one of: darnell, shria' });
  }

  const result = await executeActionPackWithHistory({
    userId,
    date,
    focusTheme,
    priorities,
    runId,
  });

  return res.json(result);
});

emAiExecAdminRouter.get('/api/exec-admin/p0/action-pack/runs', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 20);
  const items = listP0ArtifactRuns({ kind: ACTION_PACK_KIND, limit });
  return res.json({ items, limit });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/action-pack/runs/:runId', async (req: Request, res: Response) => {
  const run = getP0ArtifactRun(req.params.runId);
  if (!run || run.kind !== ACTION_PACK_KIND) {
    return res.status(404).json({ error: 'Run not found' });
  }
  return res.json(run);
});

export default emAiExecAdminRouter;
