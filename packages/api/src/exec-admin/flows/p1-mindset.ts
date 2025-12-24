/**
 * P1 Mindset Flow
 *
 * Per MAB v1.0 Section 6.1:
 * "Helps clients identify and reframe limiting beliefs."
 *
 * Features:
 * - Limiting belief identification
 * - Cognitive reframing
 * - Google Sheets integration
 * - Offline mode support
 */

import { MindsetAgent } from '../../services/growth-agents/mindset.agent';

export interface MindsetInput {
  userId: string;
  challenge?: string;
  limitingBelief?: string;
  desiredState?: string;
}

export interface MindsetOutput {
  userId: string;
  beliefs: Array<{
    limiting: string;
    reframe: string;
    evidence: string;
    actionStep: string;
  }>;
  challenge?: string;
  spreadsheetUrl?: string;
  offline: boolean;
  generatedAt: string;
}

export async function runP1Mindset(
  input: MindsetInput
): Promise<{ runId: string; data: MindsetOutput }> {
  const runId = `mindset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[P1 Mindset] Starting run ${runId} for ${input.userId}`);
  console.log(`[P1 Mindset] Challenge: ${input.challenge || 'none'}`);

  let output: MindsetOutput;
  let offline = false;

  try {
    const mindsetAgent = new MindsetAgent();

    // Build prompt from input
    let prompt = 'Help me reframe limiting beliefs.';
    if (input.challenge) {
      prompt = `Challenge: ${input.challenge}.`;
      if (input.limitingBelief) {
        prompt += ` Limiting belief: ${input.limitingBelief}.`;
      }
      if (input.desiredState) {
        prompt += ` Desired state: ${input.desiredState}.`;
      }
    }

    const result = await mindsetAgent.run(prompt);

    // Parse beliefs from agent output
    const beliefs: MindsetOutput['beliefs'] = [];

    // Try to extract structured beliefs from result
    if (result && typeof result === 'object') {
      if (Array.isArray(result.beliefs)) {
        beliefs.push(...result.beliefs);
      } else if (result.limiting && result.reframe) {
        beliefs.push({
          limiting: result.limiting,
          reframe: result.reframe,
          evidence: result.evidence || 'Evidence to be gathered',
          actionStep: result.actionStep || 'Take one small step today',
        });
      }
    }

    // If no structured beliefs found, create default from input
    if (beliefs.length === 0 && input.limitingBelief) {
      beliefs.push({
        limiting: input.limitingBelief,
        reframe: `What if the opposite is true? ${input.desiredState || 'You are capable of growth.'}`,
        evidence: 'Look for evidence that supports this new perspective',
        actionStep: 'Identify one action that aligns with this reframe',
      });
    }

    output = {
      userId: input.userId,
      beliefs,
      challenge: input.challenge,
      spreadsheetUrl: typeof result === 'object' && result.spreadsheetUrl ? result.spreadsheetUrl : undefined,
      offline: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[P1 Mindset] Agent error, using offline mode:', error);
    offline = true;

    // Offline stub data
    output = {
      userId: input.userId,
      beliefs: [
        {
          limiting: input.limitingBelief || "I'm not good enough",
          reframe: input.desiredState || "I'm learning and growing every day",
          evidence: "Past successes, positive feedback from others",
          actionStep: "Write down three recent wins",
        },
      ],
      challenge: input.challenge || 'General mindset work',
      offline: true,
      generatedAt: new Date().toISOString(),
    };
  }

  console.log(`[P1 Mindset] Complete: ${runId}`, {
    beliefs: output.beliefs.length,
    offline: output.offline,
  });

  return { runId, data: output };
}
