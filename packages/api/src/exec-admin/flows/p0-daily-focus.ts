import { runP0DailyFocusFlow } from '../../../../orchestrator/src/flows';
import { Insight, Action } from '../../../../shared/contracts';
import { ensureP0AgentsRegistered } from '../../orchestrator/registerP0Agents';
import { savePlannedAction } from '../../actions/action.store';
import { recordP0RunStart, updateP0Run } from '../../services/p0RunHistory.service';
import { ensureToolHandlersRegistered } from '../../tools/registerTools';
import { runToolByName } from '../../tools/tool.registry';
import logger from '../../utils/logger';

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
  ensureToolHandlersRegistered();
  const inputSnapshot = { userId: req.userId, mode: req.mode || 'founder', tone: req.tone, force: req.force };
  logger.info('[ExecAdmin] p0.daily_focus start', inputSnapshot);

  const date = new Date().toISOString().slice(0, 10);
  const runRecord = await recordP0RunStart({ founderEmail: req.userId, date, force: req.force, kind: 'p0.daily_focus' });

  try {
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

    // Emit webhook via tool layer (best-effort, non-blocking)
    if (data?.actionPack) {
      const toolResult = await runToolByName('n8n.actionpack_webhook', {
        intent: 'p0.daily_focus',
        userId: req.userId,
        qaStatus: qaStatus,
        actionPack: data.actionPack,
        timestamp: new Date().toISOString(),
      });
      if (!toolResult.ok) {
        logger.error('[ExecAdmin] actionpack webhook failed', { error: toolResult.error });
      }
    }

    // Update run record
    await updateP0Run(runRecord.runId, {
      status: qa.blocked ? 'blocked' : 'complete',
      finishedAt: new Date().toISOString(),
      qaPassed: qa.passed,
      qaBlocked: qa.blocked,
      evalStatus: { status: qa.status, passed: qa.passed, blocked: qa.blocked, reasons: qa.reasons },
      inputSnapshot,
      outputSnapshot: {
        focus: data?.focus,
        insights: data?.insights,
        actions: data?.actions,
        qaStatus,
        confidenceScore: data?.confidenceScore,
      },
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

    logger.info('[ExecAdmin] p0.daily_focus complete', { runId: runRecord.runId, qaStatus });

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
  } catch (err: any) {
    logger.error('[ExecAdmin] p0.daily_focus failed', { error: err?.message || err, runId: runRecord.runId });
    await updateP0Run(runRecord.runId, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: err?.message || 'p0.daily_focus failed',
      evalStatus: { status: 'FAIL', passed: false, blocked: true, reasons: [err?.message || 'run failed'] },
      inputSnapshot,
      kind: 'p0.daily_focus',
    });
    throw err;
  }
}
