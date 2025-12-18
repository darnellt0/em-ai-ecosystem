import { registerAgent } from '@em/orchestrator/registry/agent-registry';
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
    run: (payload: any) => runDailyBriefAdapter(payload),
    health: async () => {
      const health = await healthDailyBrief({ version: 'p0.daily-brief.v1' });
      return { status: health.ok ? 'OK' : 'FAILED', details: health };
    },
  });

  registerAgent({
    key: 'insight.surface_top_signals',
    description: 'Surface top signals from insights service',
    run: (payload: any) => runInsightAdapter(payload),
  });

  registerAgent({
    key: 'journal.prompt_light',
    description: 'Lightweight journal prompt adapter',
    run: (payload: any) => runJournalPromptAdapter(payload),
  });

  registerAgent({
    key: 'calendar.optimize_today',
    description: 'Propose today focus blocks (PLAN-only)',
    run: (payload: any) => runCalendarOptimizeAdapter(payload),
  });

  registerAgent({
    key: 'content.action_pack',
    description: 'Content Action Pack builder',
    run: (payload: any) => runContentActionPackAdapter(payload),
  });

  registerAgent({
    key: 'qa.verify_run',
    description: 'QA verification',
    run: async (payload: any) => ({ status: 'OK', output: await verifyRun(payload) }),
  });

  registered = true;
}

// helper for tests
export function isP0Registered() {
  return registered;
}
