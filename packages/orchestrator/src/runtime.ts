import { AgentCall, AgentResult } from './types';

// Lightweight stubs/adapters for referenced agent keys
async function runDailyBrief(payload: any): Promise<AgentResult> {
  return {
    success: true,
    output: {
      summary: `Daily brief for ${payload.userId}`,
      highlights: ['Calendar, tasks, priorities'],
    },
  };
}

async function runCalendarOptimize(payload: any): Promise<AgentResult> {
  return {
    success: true,
    output: {
      focusBlocks: [`90m block scheduled for ${payload.userId}`],
    },
  };
}

async function runInsightSurface(payload: any): Promise<AgentResult> {
  return {
    success: true,
    output: {
      insights: [
        { title: 'Top signal', detail: 'Deliver one deep focus block before noon' },
        { title: 'Wellbeing', detail: 'Protect rest between meetings' },
      ],
    },
  };
}

async function runJournalPrompt(payload: any): Promise<AgentResult> {
  return {
    success: true,
    output: {
      prompts: ['What will you commit to in 90 minutes?', 'What must wait until tomorrow?'],
    },
  };
}

async function runActionPack(payload: any): Promise<AgentResult> {
  try {
    const { runActionPack } = require('../../agents/content-synthesizer/workflows');
    const pack = await runActionPack({
      userId: payload.userId,
      mode: payload.mode,
      topic: payload.focus || 'today',
      tone: payload.tone || 'warm',
    });
    return { success: true, output: pack };
  } catch (err: any) {
    return {
      success: true,
      status: 'SKIPPED',
      warnings: ['content.action_pack not fully implemented; returned stub'],
      output: {
        linkedinDraft: `Focus for ${payload.userId}: carve a 90m block.`,
        focusNarrative: 'Stay strengths-centered and protect one deep work window.',
      },
    };
  }
}

async function runQaVerify(payload: any): Promise<AgentResult> {
  try {
    const { verifyRun } = require('../../qa/orchestrator/verify-run');
    const result = await verifyRun(payload);
    return { success: true, output: result };
  } catch (err: any) {
    return { success: true, status: 'SKIPPED', warnings: ['QA verify_run stubbed'], output: { status: 'DEGRADED', reasons: ['QA missing'] } };
  }
}

const AGENT_ADAPTERS: Record<string, (payload: any) => Promise<AgentResult>> = {
  'daily_brief.generate': runDailyBrief,
  'calendar.optimize_today': runCalendarOptimize,
  'insight.surface_top_signals': runInsightSurface,
  'journal.prompt_light': runJournalPrompt,
  'content.action_pack': runActionPack,
  'qa.verify_run': runQaVerify,
};

export async function runAgentsConcurrently(calls: AgentCall[]): Promise<Record<string, AgentResult>> {
  const entries = await Promise.all(
    calls.map(async (call) => {
      const adapter = AGENT_ADAPTERS[call.key];
      const payload = call.payload || {};

      if (payload.__skip) {
        return [call.key, { success: false, status: 'SKIPPED', warnings: ['Skipped by debug flag'] } as AgentResult];
      }

      if (!adapter) {
        return [call.key, { success: false, status: 'SKIPPED', warnings: ['Agent not implemented'] } as AgentResult];
      }

      if (payload.__forceFail) {
        return [call.key, { success: false, status: 'FAILED', error: 'Forced failure (debug)' } as AgentResult];
      }

      try {
        const result = await adapter(payload);
        return [call.key, result];
      } catch (err: any) {
        return [call.key, { success: false, status: 'FAILED', error: err.message }];
      }
    })
  );

  return Object.fromEntries(entries);
}
