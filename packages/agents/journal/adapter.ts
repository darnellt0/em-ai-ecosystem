import { AgentOutput } from '../../shared/contracts';
import { runJournalAgent } from '../../api/src/services/growthAgents.service';

interface JournalAdapterPayload {
  userId?: string;
  founderEmail?: string;
  __skip?: boolean;
  __forceFail?: boolean;
}

export async function runJournalPromptAdapter(payload: JournalAdapterPayload): Promise<AgentOutput<any>> {
  if (payload.__skip) return { status: 'SKIPPED', warnings: ['Skipped by debug flag'] };
  if (payload.__forceFail) return { status: 'FAILED', error: 'Forced failure (debug)' };

  const founderEmail = payload.founderEmail || payload.userId;
  if (!founderEmail) return { status: 'FAILED', error: 'founderEmail or userId required' };

  try {
    const result = await runJournalAgent({ founderEmail });
    const prompts = (result.insights || []).map((i) => i.detail || i.title).slice(0, 3);
    return {
      status: 'OK',
      output: {
        summary: result.summary,
        prompts: prompts.length ? prompts : ['What matters most to you today?'],
        recommendedNextStep: result.recommendations?.[0],
        confidence: 0.6,
      },
    };
  } catch (err: any) {
    return { status: 'FAILED', error: err.message };
  }
}
