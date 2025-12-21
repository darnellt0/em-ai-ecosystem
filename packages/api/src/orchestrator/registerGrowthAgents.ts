import { registerAgent } from '../../orchestrator/src/registry/agent-registry';
import {
  runJournalAgent,
  runNicheAgent,
  runMindsetAgent,
  runRhythmAgent,
  runPurposeAgent,
} from '../services/growthAgents.service';
import { AgentOutput } from '../../../shared/contracts';
import { runContentActionPackAdapter } from '../../../agents/content-synthesizer/adapter';

let growthRegistered = false;

function wrap(fn: (input: any) => Promise<any>, key: string) {
  return async (payload: any): Promise<AgentOutput<any>> => {
    try {
      const founderEmail = payload.founderEmail || payload.userId;
      if (!founderEmail) return { status: 'FAILED', error: 'founderEmail or userId required' };
      const result = await fn({ founderEmail, context: payload.context });
      return {
        status: 'OK',
        output: {
          summary: result.summary,
          insights: result.insights,
          suggestedActions: result.recommendations || [],
          metadata: result.metadata,
        },
      };
    } catch (err: any) {
      return { status: 'FAILED', error: `${key} failed: ${err.message}` };
    }
  };
}

export function ensureGrowthAgentsRegistered() {
  if (growthRegistered) return;

  registerAgent({ key: 'growth.journal', description: 'Journal growth agent', status: 'frozen', run: wrap(runJournalAgent, 'growth.journal') });
  registerAgent({ key: 'growth.niche', description: 'Niche growth agent', status: 'frozen', run: wrap(runNicheAgent, 'growth.niche') });
  registerAgent({ key: 'growth.mindset', description: 'Mindset growth agent', status: 'frozen', run: wrap(runMindsetAgent, 'growth.mindset') });
  registerAgent({ key: 'growth.rhythm', description: 'Rhythm growth agent', status: 'frozen', run: wrap(runRhythmAgent, 'growth.rhythm') });
  registerAgent({ key: 'growth.purpose', description: 'Purpose growth agent', status: 'frozen', run: wrap(runPurposeAgent, 'growth.purpose') });

  registerAgent({
    key: 'growth.pack',
    description: 'Exec Admin growth pack (all growth agents + content action pack)',
    status: 'frozen',
    run: async (payload: any): Promise<AgentOutput<any>> => {
      const founderEmail = payload.founderEmail || payload.userId;
      if (!founderEmail) return { status: 'FAILED', error: 'founderEmail or userId required' };
      const agents = ['growth.journal', 'growth.niche', 'growth.mindset', 'growth.rhythm', 'growth.purpose'];
      const reqs = agents.map((key) => ({ key, payload: { founderEmail } }));
      const { runAgentsConcurrently } = await import('../../../orchestrator/src/dispatcher');
      const results = await runAgentsConcurrently(reqs);

      const insights: any[] = [];
      agents.forEach((k) => {
        const out = results[k]?.output;
        if (out?.insights) insights.push(...out.insights);
      });

      const actionPackRes = await runAgentsConcurrently([
        {
          key: 'content.action_pack',
          payload: {
            userId: founderEmail,
            mode: payload.mode || 'founder',
            focus: insights[0]?.title || 'growth check-in',
          },
        },
      ]);

      return {
        status: 'OK',
        output: {
          summary: 'Growth pack executed',
          insights,
          suggestedActions: [],
          content: actionPackRes['content.action_pack']?.output,
        },
      };
    },
  });

  growthRegistered = true;
}
