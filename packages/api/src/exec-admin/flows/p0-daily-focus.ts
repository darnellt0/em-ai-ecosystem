import { runP0DailyFocusFlow } from '@em/orchestrator/flows';
import { Insight, Action } from '../../../../shared/contracts';
import { ensureP0AgentsRegistered } from '../../orchestrator/registerP0Agents';
import { savePlannedAction } from '../../actions/action.store';
import { publishActionPackWebhook } from '../../actions/actionpack.webhook';
import { recordP0RunStart, updateP0Run } from '../../services/p0RunHistory.service';

export interface P0DailyFocusRequest {
  userId: string;
  mode?: 'founder' | 'operator' | 'client_preview';
  tone?: string;
  force?: boolean;
}

export async function runP0DailyFocusExecAdmin(req: P0DailyFocusRequest) {
  if (!req.userId) {
    throw new Error('userId is required');
  }

  ensureP0AgentsRegistered();

  const date = new Date().toISOString().slice(0, 10);
  const runRecord = await recordP0RunStart({ founderEmail: req.userId, date, force: req.force, kind: 'p0.daily_focus' });

  // Executive Admin as front door delegates to orchestrator flow
  const orchestratorResponse = await runP0DailyFocusFlow({
    flow: 'P0-DAILY-FOCUS',
    payload: {
      userId: req.userId,
      mode: req.mode || 'founder',
      tone: req.tone,
    },
  } as any);

  const data = orchestratorResponse.output;
  const qaStatus = data?.qaStatus || 'DEGRADED';
  const qa = {
    passed: qaStatus === 'PASS',
    blocked: qaStatus === 'FAIL',
    status: qaStatus,
    reasons: data?.qaReasons || [],
  };

  const clear: Insight[] = data?.insights || [];
  const uncertain: Insight[] = [];
  const blocked: Action[] = [];
  const canWait: Action[] = data?.actions ? data.actions.slice(1) : [];

  // PLAN actions into store (no execution)
  if (data?.actionPack) {
    if (data.actionPack.linkedinDraft) {
      savePlannedAction({
        type: 'gmail.draft_email',
        requiresApproval: true,
        payload: { subject: 'LinkedIn draft', body: data.actionPack.linkedinDraft },
        risk: 'medium',
        priority: 'medium',
      });
    }
    if (data.actionPack.emailDraft) {
      savePlannedAction({
        type: 'gmail.draft_email',
        requiresApproval: true,
        payload: { subject: 'Daily focus email', body: data.actionPack.emailDraft },
        risk: 'medium',
        priority: 'medium',
      });
    }
  }

  // Emit webhook (best-effort, non-blocking)
  if (data?.actionPack) {
    publishActionPackWebhook({
      intent: 'p0.daily_focus',
      userId: req.userId,
      qaStatus: qaStatus,
      actionPack: data.actionPack,
      timestamp: new Date().toISOString(),
    });
  }

  // Update run record
  await updateP0Run(runRecord.runId, {
    status: qa.blocked ? 'blocked' : 'complete',
    finishedAt: new Date().toISOString(),
    qaPassed: qa.passed,
    qaBlocked: qa.blocked,
    actionPackSummary: data?.focus || 'Daily Focus generated',
    kind: 'p0.daily_focus',
  });

  const safeActionPack = {
    version: 'p0.v1',
    date,
    founderEmail: req.userId,
    summary: data?.focus || 'Daily Focus generated',
    priorities: data?.insights || [],
    tasks: data?.actions || [],
    scheduleBlocks: [],
    status: qa.blocked ? 'blocked' : 'ready',
    blockers: qa.blocked ? qa.reasons || ['QA blocked'] : undefined,
    safeNextSteps: qa.blocked ? ['Review QA issues', 'Retry with lighter mode'] : undefined,
    ...data?.actionPack,
  };

  return {
    success: orchestratorResponse.success,
    intent: 'p0.daily_focus',
    message: data?.focus || 'Daily focus generated.',
    runId: runRecord.runId,
    data: {
      runId: runRecord.runId,
      focus: data?.focus,
      insights: data?.insights,
      actions: data?.actions,
      qaStatus: qaStatus,
      confidenceScore: data?.confidenceScore,
      qa,
      actionPack: safeActionPack,
      meta: data?.meta,
      clear,
      uncertain,
      blocked,
      canWait,
    },
  };
}
