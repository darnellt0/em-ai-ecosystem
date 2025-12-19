import { AgentOutput } from '../../shared/contracts';

export interface AccountabilityPartnerPayload {
  userId?: string;
  goal?: string;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runAccountabilityPartnerAdapter(payload: AccountabilityPartnerPayload): Promise<AgentOutput<any>> {
  const goal = payload.goal || 'Ship one meaningful output today';
  const nextAction = 'Define a 90m block and one micro-step to start.';

  return {
    status: 'OK',
    output: {
      summary: `Check-in for ${payload.userId || 'founder'}`,
      insights: [
        { title: 'Goal', detail: goal },
        { title: 'One next action', detail: nextAction },
      ],
      suggestedActions: [
        { title: 'Create reminder', detail: 'Follow-up in 24h on goal progress', type: 'task.create' },
      ],
      confidence: 0.63,
    },
  };
}
