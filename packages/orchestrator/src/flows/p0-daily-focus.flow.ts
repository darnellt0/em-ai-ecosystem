import { OrchestratorRequest, OrchestratorResponse } from '../types';
import { runAgentsConcurrently } from '../dispatcher';
import { Insight, Action, ActionPack } from '../../../shared/contracts';
import { validateAgentOutput, validateActionPack } from '../../../shared/contracts/validation';

/**
 * P0-DAILY-FOCUS flow orchestrates P0 agents and QA.
 * Required agents:
 * - daily_brief.generate
 * - calendar.optimize_today
 * - insight.surface_top_signals
 * - journal.prompt_light
 * - content.action_pack (Action Layer)
 * - qa.verify_run (post-aggregation)
 */

export interface DailyFocusPayload {
  userId: string;
  mode: 'founder' | 'operator' | 'client_preview';
  tone?: string;
  debug?: {
    skipAgents?: string[];
    forceQaFail?: boolean;
    forceAgentFail?: string[];
  };
}

export interface DailyFocusResult {
  status: 'ok' | 'degraded' | 'failed';
  agentsRan: string[];
  qaStatus: 'PASS' | 'DEGRADED' | 'FAIL';
  qaReasons?: string[];
  focus: string;
  insights: Insight[];
  actions: Action[];
  actionPack: ActionPack;
  confidenceScore: number;
  meta: {
    userId: string;
    mode: DailyFocusPayload['mode'];
    generatedAt: string;
  };
}

export async function runP0DailyFocusFlow(req: OrchestratorRequest<DailyFocusPayload>): Promise<OrchestratorResponse<DailyFocusResult>> {
  const payload = req.payload || ({} as DailyFocusPayload);
  const userId = payload.userId;
  if (!userId) {
    return { success: false, error: 'userId is required' };
  }

  const debug = payload.debug || {};

  // Execute core agents concurrently (with optional debug skips/fails)
  const agentCalls = [
    {
      key: 'daily_brief.generate',
      payload: {
        userId,
        __skip: debug.skipAgents?.includes('daily_brief.generate'),
        __forceFail: debug.forceAgentFail?.includes('daily_brief.generate'),
      },
    },
    {
      key: 'calendar.optimize_today',
      payload: {
        userId,
        horizon: '90m',
        __skip: debug.skipAgents?.includes('calendar.optimize_today'),
        __forceFail: debug.forceAgentFail?.includes('calendar.optimize_today'),
      },
    },
    {
      key: 'insight.surface_top_signals',
      payload: {
        userId,
        __skip: debug.skipAgents?.includes('insight.surface_top_signals'),
        __forceFail: debug.forceAgentFail?.includes('insight.surface_top_signals'),
      },
    },
    {
      key: 'journal.prompt_light',
      payload: {
        userId,
        __skip: debug.skipAgents?.includes('journal.prompt_light'),
        __forceFail: debug.forceAgentFail?.includes('journal.prompt_light'),
      },
    },
  ];

  const results = await runAgentsConcurrently(agentCalls);

  const brief = results['daily_brief.generate']?.output;
  const calendar = results['calendar.optimize_today']?.output;
  const insights = results['insight.surface_top_signals']?.output;
  const journal = results['journal.prompt_light']?.output;

  // Action Layer: content.action_pack uses the aggregated executive brief
  const actionInput = {
    userId,
    mode: payload.mode || 'founder',
    brief,
    calendar,
    insights,
    journal,
  };

  const actionPackResp = await runAgentsConcurrently([
    {
      key: 'content.action_pack',
      payload: {
        ...actionInput,
        __skip: debug.skipAgents?.includes('content.action_pack'),
        __forceFail: debug.forceAgentFail?.includes('content.action_pack'),
      },
    },
  ]);
  const actionPack = actionPackResp['content.action_pack']?.output || {};

  // QA after aggregation
  const qaResp = await runAgentsConcurrently([
    {
      key: 'qa.verify_run',
      payload: {
        flow: 'P0-DAILY-FOCUS',
        agentsRan: Object.keys(results),
        statusHints: { brief: !!brief, calendar: !!calendar, insights: !!insights, journal: !!journal },
        debugFail: debug.forceQaFail,
        registryUsed: true,
        runtimeStubUsed: false,
      },
    },
  ]);
  const qa = qaResp['qa.verify_run']?.output || { status: 'DEGRADED', reasons: ['QA missing'] };

  const briefOk = results['daily_brief.generate']?.success;
  const insightOk = results['insight.surface_top_signals']?.success;
  const journalOk = results['journal.prompt_light']?.success;
  const contentOk = actionPackResp['content.action_pack']?.success;
  const coreSuccessCount = ['daily_brief.generate', 'calendar.optimize_today', 'insight.surface_top_signals', 'journal.prompt_light'].filter(
    (k) => results[k]?.success
  ).length;

  const passesContentCriteria = briefOk && contentOk && (insightOk || journalOk);

  const status: DailyFocusResult['status'] =
    qa.status === 'FAIL'
      ? 'failed'
      : passesContentCriteria
      ? qa.status === 'PASS'
        ? 'ok'
        : 'degraded'
      : coreSuccessCount > 0
      ? 'degraded'
      : 'failed';

  const focus =
    insights?.insights?.[0]?.title ||
    brief?.summary ||
    'Protect one 90m block for your top priority';

  const normalizedInsights: Insight[] = [];
  const seen = new Set<string>();
  if (insights?.insights) {
    insights.insights.forEach((i: any) => {
      const title = i.title || 'Insight';
      if (seen.has(title)) return;
      seen.add(title);
      normalizedInsights.push({ title, detail: i.detail || String(i) });
    });
  }
  if (journal?.prompts) {
    const title = 'Journal Prompt';
    if (!seen.has(title)) {
      seen.add(title);
      normalizedInsights.push({ title, detail: journal.prompts[0] });
    }
  }

  const actions: Action[] = [];
  if (actionPack.linkedinDraft) actions.push({ title: 'LinkedIn Draft', detail: actionPack.linkedinDraft });
  if (actionPack.emailDraft) actions.push({ title: 'Email Draft', detail: actionPack.emailDraft });
  if (actionPack.reflectionExercise) actions.push({ title: 'Reflection Exercise', detail: actionPack.reflectionExercise });
  if (calendar?.focusBlocks?.[0]) actions.push({ title: 'Focus Block', detail: calendar.focusBlocks[0] });

  const confidenceScore = qa.status === 'PASS' ? 0.9 : qa.status === 'DEGRADED' ? 0.6 : 0.3;

  const response: DailyFocusResult = {
    status,
    agentsRan: Object.keys(results),
    qaStatus: qa.status,
    qaReasons: qa.reasons,
    focus,
    insights: normalizedInsights,
    actions,
    actionPack: {
      linkedinDraft: actionPack.linkedinDraft,
      emailDraft: actionPack.emailDraft,
      journalExpansion: actionPack.journalExpansion,
      reflectionExercise: actionPack.reflectionExercise,
      focusNarrative: actionPack.focusNarrative,
    },
    confidenceScore,
    meta: {
      userId,
      mode: payload.mode || 'founder',
      generatedAt: new Date().toISOString(),
    },
  };

  // Contract validation
  const invalidOutputs = Object.values(results).filter((r) => !validateAgentOutput(r).valid);
  const actionPackValidation = validateActionPack(response.actionPack);
  if (invalidOutputs.length || !actionPackValidation.valid) {
    response.qaStatus = 'FAIL';
    response.qaReasons = [...(response.qaReasons || []), 'Contract validation failed'];
  }

  // Ensure actionPack always present and shaped with status/blockers
  if (!response.actionPack.status) {
    response.actionPack.status = response.qaStatus === 'FAIL' ? 'blocked' : 'ready';
  }
  if (response.qaStatus === 'FAIL') {
    response.actionPack.blockers = response.qaReasons || ['QA failed'];
    response.actionPack.safeNextSteps = ['Review agent errors', 'Try a lighter mode', 'Run a single agent check'];
  }

  return { success: status !== 'failed', output: response };
}
