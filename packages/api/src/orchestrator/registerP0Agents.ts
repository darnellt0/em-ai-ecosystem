import { registerAgent } from '../../../orchestrator/src/registry/agent-registry';
import { runDailyBriefAdapter } from '../../../agents/daily-brief/adapter';
import { runInsightAdapter } from '../../../agents/insights/adapter';
import { runJournalPromptAdapter } from '../../../agents/journal/adapter';
import { runCalendarOptimizeAdapter } from '../../../agents/calendar/adapter';
import { runContentActionPackAdapter } from '../../../agents/content-synthesizer/adapter';
import { verifyRun } from '../../../qa/orchestrator/verify-run';
import { healthDailyBrief } from '../../../agents/daily-brief/workflows';

let registered = false;

export function ensureP0AgentsRegistered() {
  if (registered) return;

  registerAgent({
    key: 'daily_brief.generate',
    description: 'Adapter to real daily brief',
    status: 'active',
    inputContract: '{ userId?: string; user: string; date?: string; runId?: string }',
    outputContract:
      '{ date: string; summary?: string; topPriorities: Array; focusBlock: { start: string; end: string; theme: string }; calendarSummary: object; inboxHighlights: object; risks: Array; suggestedActions: Array }',
    run: (payload: any) => runDailyBriefAdapter(payload),
    health: async () => {
      const health = await healthDailyBrief({ version: 'p0.daily-brief.v1' });
      return { status: health.ok ? 'OK' : 'FAILED', details: health };
    },
  });

  registerAgent({
    key: 'insight.surface_top_signals',
    description: 'Surface top signals from insights service',
    status: 'active',
    inputContract: '{ userId: string }',
    outputContract: '{ insights: Array<{ title: string; detail?: string }> }',
    run: (payload: any) => runInsightAdapter(payload),
    health: async () => ({ status: 'OK', details: { source: 'insights.adapter' } }),
  });

  registerAgent({
    key: 'journal.prompt_light',
    description: 'Lightweight journal prompt adapter',
    status: 'active',
    inputContract: '{ userId: string }',
    outputContract: '{ prompts: string[] }',
    run: (payload: any) => runJournalPromptAdapter(payload),
    health: async () => ({ status: 'OK', details: { source: 'journal.adapter' } }),
  });

  registerAgent({
    key: 'calendar.optimize_today',
    description: 'Propose today focus blocks (PLAN-only)',
    status: 'active',
    inputContract: '{ userId: string; horizon?: string }',
    outputContract: '{ focusBlocks: Array<string> | Array<{ start: string; end: string; theme?: string }> }',
    run: (payload: any) => runCalendarOptimizeAdapter(payload),
    health: async () => ({ status: 'OK', details: { source: 'calendar.adapter' } }),
  });

  registerAgent({
    key: 'content.action_pack',
    description: 'Content Action Pack builder',
    status: 'active',
    inputContract: '{ userId: string; mode: string; brief?: object; calendar?: object; insights?: object; journal?: object }',
    outputContract:
      '{ linkedinDraft?: string; emailDraft?: string; journalExpansion?: string; reflectionExercise?: string; focusNarrative?: string }',
    run: (payload: any) => runContentActionPackAdapter(payload),
    health: async () => ({ status: 'OK', details: { source: 'content.action_pack' } }),
  });

  registerAgent({
    key: 'qa.verify_run',
    description: 'QA verification',
    status: 'active',
    inputContract:
      '{ flow: string; agentsRan: string[]; statusHints?: object; debugFail?: boolean; registryUsed: boolean; runtimeStubUsed: boolean }',
    outputContract: '{ status: "PASS" | "DEGRADED" | "FAIL"; reasons?: string[] }',
    run: async (payload: any) => ({ status: 'OK', output: await verifyRun(payload) }),
    health: async () => ({ status: 'OK', details: { source: 'qa.verify_run' } }),
  });

  registered = true;
}

// helper for tests
export function isP0Registered() {
  return registered;
}
