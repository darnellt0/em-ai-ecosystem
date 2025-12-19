import { Router, Request, Response } from 'express';
import { launchGrowthPack, getGrowthStatus } from '../services/emAi.service';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import {
  startP0Run,
  finalizeP0Run,
  listP0Runs,
  getP0Run,
} from '../services/p0RunHistory.service';

const emAiExecAdminRouter = Router();

emAiExecAdminRouter.post('/em-ai/exec-admin/growth/run', async (req: Request, res: Response) => {
  const { founderEmail, mode } = req.body || {};

  if (!founderEmail) {
    return res.status(400).json({
      success: false,
      error: 'founderEmail is required.',
    });
  }

  try {
    const result = await launchGrowthPack({ founderEmail, mode });
    return res.json(result);
  } catch (error) {
    console.error('[Exec Admin] Growth run failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/status', async (_req: Request, res: Response) => {
  try {
    const status = await getGrowthStatus();
    return res.json(status);
  } catch (error) {
    console.error('[Exec Admin] Growth status failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

type DailyBriefArtifact = {
  date: string;
  topPriorities: Array<{ title: string; why: string; nextStep: string }>;
  focusBlock: { start: string; end: string; theme: string };
  calendarSummary: { meetings: number; highlights: string[] };
  inboxHighlights: { items: Array<{ from: string; subject: string; whyImportant: string }> };
  risks: string[];
  suggestedActions: Array<{ type: 'task' | 'email_draft' | 'calendar_block'; title: string; details: string }>;
};

function toDailyBriefArtifact(output: any, fallbackDate: string): DailyBriefArtifact {
  const date = output?.date || fallbackDate;
  const priorities = Array.isArray(output?.priorities) ? output.priorities : [];
  const agenda = Array.isArray(output?.agenda) ? output.agenda : [];
  const tasks = Array.isArray(output?.tasks) ? output.tasks : [];
  const inbox = Array.isArray(output?.inboxHighlights) ? output.inboxHighlights : [];
  const focus = Array.isArray(output?.suggestedFocusWindows) ? output.suggestedFocusWindows[0] : null;

  return {
    date,
    topPriorities: priorities.map((title: string) => ({
      title,
      why: 'From daily brief insights',
      nextStep: 'Review and act',
    })),
    focusBlock: {
      start: focus?.start || `${date}T09:00:00`,
      end: focus?.end || `${date}T10:30:00`,
      theme: focus?.reason || 'Deep work focus',
    },
    calendarSummary: {
      meetings: agenda.length,
      highlights: agenda,
    },
    inboxHighlights: {
      items: inbox.map((subject: string) => ({
        from: 'Inbox',
        subject,
        whyImportant: 'Flagged highlight',
      })),
    },
    risks: [],
    suggestedActions: tasks.map((title: string) => ({
      type: 'task',
      title,
      details: 'Follow up from daily brief',
    })),
  };
}

emAiExecAdminRouter.post('/api/exec-admin/p0/daily-brief', async (req: Request, res: Response) => {
  const { user, date, runId } = req.body || {};
  if (!user) {
    return res.status(400).json({ error: 'user is required' });
  }

  const kind = 'p0.daily_brief';
  const run = startP0Run({ kind, runId });
  const warnings: string[] = [];
  let artifact: DailyBriefArtifact;

  try {
    const output = await runDailyBriefAgent({ userId: user, date });
    const resolvedDate = output?.date || date || new Date().toISOString().slice(0, 10);
    artifact = toDailyBriefArtifact(output, resolvedDate);
  } catch (err) {
    warnings.push('Daily brief generation failed; returning placeholder output.');
    const resolvedDate = date || new Date().toISOString().slice(0, 10);
    artifact = toDailyBriefArtifact(null, resolvedDate);
  }

  const finalized = finalizeP0Run(run.runId, {
    status: 'success',
    artifact,
  });

  return res.json({
    runId: finalized.runId,
    kind,
    status: finalized.status,
    artifact,
    ...(warnings.length ? { warnings } : {}),
  });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/daily-brief/runs', async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 20);
  const items = listP0Runs({ kind: 'p0.daily_brief', limit });
  return res.json({ items, limit });
});

emAiExecAdminRouter.get('/api/exec-admin/p0/daily-brief/runs/:runId', async (req: Request, res: Response) => {
  const run = getP0Run(req.params.runId);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  return res.json(run);
});

export default emAiExecAdminRouter;
