import {
  runJournalAgent,
  runNicheAgent,
  runMindsetAgent,
  runRhythmAgent,
  runPurposeAgent,
  GrowthAgentInput,
} from './growthAgents.service';
import { runDailyBriefAgent } from './dailyBrief.service';

export interface ExecAdminAgentAdapterContext {
  mode: 'single' | 'orchestrated';
  payload: Record<string, any>;
  userContext?: Record<string, any>;
}

const toGrowthInput = (payload: Record<string, any>): GrowthAgentInput => {
  const { founderEmail, ...rest } = payload || {};

  if (!founderEmail || typeof founderEmail !== 'string') {
    throw new Error(
      'ExecAdmin growth.* requires payload.founderEmail (string). Make sure the UI or caller provides { founderEmail, ... } in input.'
    );
  }

  return { founderEmail, ...rest } as GrowthAgentInput;
};

export type ExecAdminAgentAdapter = (ctx: ExecAdminAgentAdapterContext) => Promise<any>;

const EXEC_ADMIN_AGENT_ADAPTERS: Record<string, ExecAdminAgentAdapter> = {
  'growth.journal': async (ctx) => runJournalAgent(toGrowthInput(ctx.payload)),
  'growth.niche': async (ctx) => runNicheAgent(toGrowthInput(ctx.payload)),
  'growth.mindset': async (ctx) => runMindsetAgent(toGrowthInput(ctx.payload)),
  'growth.rhythm': async (ctx) => runRhythmAgent(toGrowthInput(ctx.payload)),
  'growth.purpose': async (ctx) => runPurposeAgent(toGrowthInput(ctx.payload)),
  'productivity.dailyBrief': async (ctx) => {
    const { userId = 'darnell', date } = ctx.payload;
    return runDailyBriefAgent({ user: userId as 'darnell' | 'shria', date });
  },
};

export async function dispatchExecAdminAgent(agentKey: string, ctx: ExecAdminAgentAdapterContext): Promise<any> {
  const adapter = EXEC_ADMIN_AGENT_ADAPTERS[agentKey];
  if (!adapter) {
    throw new Error(`Unknown agentKey "${agentKey}" in Exec Admin adapter`);
  }
  return adapter(ctx);
}
