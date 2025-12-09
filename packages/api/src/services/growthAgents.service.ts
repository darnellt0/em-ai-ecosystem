import { activityLogService } from './activity-log.service';
import { JournalAgent } from '../growth-agents/journal-agent';
import { NicheAgent } from '../growth-agents/niche-agent';
import { MindsetAgent } from '../growth-agents/mindset-agent';
import { RhythmAgent } from '../growth-agents/rhythm-agent';
import { PurposeAgent } from '../growth-agents/purpose-agent';
import { AgentResult } from '../growth-agents/base-agent';

export interface GrowthAgentInput {
  founderEmail: string;
  context?: any;
}

export interface GrowthAgentResult {
  summary: string;
  insights: any[];
  recommendations?: string[];
  metadata?: Record<string, any>;
}

type AgentFn = (input: GrowthAgentInput) => Promise<GrowthAgentResult>;

async function runWithLogging(
  agentName: string,
  founderEmail: string,
  fn: () => Promise<GrowthAgentResult>
): Promise<GrowthAgentResult> {
  try {
    const result = await fn();
    await activityLogService.logAgentRun({
      agentName,
      founderEmail,
      status: 'success',
      metadata: {
        insightsCount: result.insights?.length || 0,
        hasRecommendations: !!result.recommendations?.length,
      },
    });
    return result;
  } catch (error) {
    await activityLogService.logAgentRun({
      agentName,
      founderEmail,
      status: 'error',
      metadata: { errorMessage: (error as Error).message },
    });
    throw error;
  }
}

function toResult(agentResult: AgentResult, fallbackSummary: string, fallbackLabel: string): GrowthAgentResult {
  const outputs = agentResult.outputs || {};
  const insights = (outputs.insights as any[]) || [
    { title: `${fallbackLabel} insight`, detail: 'No insights provided' },
  ];
  const recommendations = (outputs.recommendations as string[]) || [];
  return {
    summary: (outputs.summary as string) || fallbackSummary,
    insights,
    recommendations,
    metadata: outputs,
  };
}

export const runJournalAgent: AgentFn = async (input) =>
  runWithLogging('JournalGrowth', input.founderEmail, async () => {
    const agent = new JournalAgent({ name: 'journal', phase: 'Rooted', priority: 1 });
    await agent.setup();
    const result = await agent.run();
    await agent.teardown();
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Journal agent failed');
    return toResult(result, 'Journal reflection completed', 'Journal');
  });

export const runNicheAgent: AgentFn = async (input) =>
  runWithLogging('NicheGrowth', input.founderEmail, async () => {
    if (input.context?.forceError) {
      await input.context.forceError();
    }
    const agent = new NicheAgent({ name: 'niche', phase: 'Grounded', priority: 2 });
    await agent.setup();
    const result = await agent.run();
    await agent.teardown();
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Niche agent failed');
    return toResult(result, 'Niche analysis ready', 'Niche');
  });

export const runMindsetAgent: AgentFn = async (input) =>
  runWithLogging('MindsetGrowth', input.founderEmail, async () => {
    const agent = new MindsetAgent({ name: 'mindset', phase: 'Grounded', priority: 3 });
    await agent.setup();
    const result = await agent.run();
    await agent.teardown();
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Mindset agent failed');
    return toResult(result, 'Mindset check-in complete', 'Mindset');
  });

export const runRhythmAgent: AgentFn = async (input) =>
  runWithLogging('RhythmGrowth', input.founderEmail, async () => {
    const agent = new RhythmAgent({ name: 'rhythm', phase: 'Rooted', priority: 4 });
    await agent.setup();
    const result = await agent.run();
    await agent.teardown();
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Rhythm agent failed');
    return toResult(result, 'Rhythm plan generated', 'Rhythm');
  });

export const runPurposeAgent: AgentFn = async (input) =>
  runWithLogging('PurposeGrowth', input.founderEmail, async () => {
    const agent = new PurposeAgent({ name: 'purpose', phase: 'Radiant', priority: 5 });
    await agent.setup();
    const result = await agent.run();
    await agent.teardown();
    if (!result.success) throw new Error(result.errors?.join(', ') || 'Purpose agent failed');
    return toResult(result, 'Purpose alignment updated', 'Purpose');
  });

export function resolveGrowthAgent(key: string): AgentFn | null {
  switch (key) {
    case 'growth.journal':
      return runJournalAgent;
    case 'growth.niche':
      return runNicheAgent;
    case 'growth.mindset':
      return runMindsetAgent;
    case 'growth.rhythm':
      return runRhythmAgent;
    case 'growth.purpose':
      return runPurposeAgent;
    default:
      return null;
  }
}
