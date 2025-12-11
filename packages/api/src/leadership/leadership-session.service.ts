import { LeadershipSessionRequest, LeadershipSessionResponse } from '../types/leadership-session';
import { mapFeatureToLeadershipAgents } from './leadership-router.service';
import { resolveGrowthAgent } from '../services/growthAgents.service';

export class LeadershipSessionService {
  async runSession(payload: LeadershipSessionRequest): Promise<LeadershipSessionResponse> {
    this.validate(payload);

    const routedAgents = mapFeatureToLeadershipAgents(payload.featureId);
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
            framing: 'leadership_strengths_rest_intent',
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
        framing: 'leadership + rest + I.N.T.E.N.T.',
      },
    };
  }

  private validate(payload: LeadershipSessionRequest) {
    if (!payload || !payload.featureId || !payload.message) {
      throw new Error('featureId and message are required.');
    }
  }
}

export const leadershipSessionService = new LeadershipSessionService();
