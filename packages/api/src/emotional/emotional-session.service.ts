import { mapFeatureToAgents } from './emotional-router.service';
import { EmotionalSessionRequest, EmotionalSessionResponse } from '../types/emotional-session';
import { resolveGrowthAgent } from '../services/growthAgents.service';

export class EmotionalSessionService {
  async runSession(payload: EmotionalSessionRequest): Promise<EmotionalSessionResponse> {
    this.validate(payload);

    const routedAgents = mapFeatureToAgents(payload.featureId);
    const replies: string[] = [];

    for (const agentKey of routedAgents) {
      const runner = resolveGrowthAgent(agentKey);
      if (!runner) {
        replies.push(`Queued agent ${agentKey}`);
        continue;
      }

      try {
        const result = await runner({
          founderEmail: payload.history?.find((m) => m.role === 'user')?.content || 'founder@example.com',
          context: {
            message: payload.message,
            featureId: payload.featureId,
            history: payload.history || [],
          },
        });
        replies.push(result.summary || `Agent ${agentKey} completed.`);
      } catch (error) {
        replies.push(`Agent ${agentKey} error: ${(error as Error).message}`);
      }
    }

    const reply = replies.join(' ');

    return {
      reply,
      routedAgents,
      featureId: payload.featureId,
      meta: {
        messageLength: payload.message.length,
        agentsInvoked: routedAgents.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private validate(payload: EmotionalSessionRequest) {
    if (!payload || !payload.featureId || !payload.message) {
      throw new Error('featureId and message are required.');
    }
  }
}

export const emotionalSessionService = new EmotionalSessionService();
