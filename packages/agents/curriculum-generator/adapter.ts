import { AgentOutput } from '../../shared/contracts';

export interface CurriculumGeneratorPayload {
  userId?: string;
  theme?: string;
  durationMinutes?: number;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runCurriculumGeneratorAdapter(payload: CurriculumGeneratorPayload): Promise<AgentOutput<any>> {
  const theme = payload.theme || 'Strengths-centered leadership reset';
  const duration = payload.durationMinutes || 75;

  const outline = [
    `Intro (5m): Set intention for ${theme}`,
    'Section 1 (20m): Story + reflection',
    'Section 2 (20m): Practice + breakout prompts',
    'Section 3 (20m): Action commitments',
    'Close (10m): Share wins and next steps',
  ];

  return {
    status: 'OK',
    output: {
      summary: `Workshop outline (${duration}m) for ${payload.userId || 'founder'}`,
      insights: outline.map((o, idx) => ({ title: `Segment ${idx + 1}`, detail: o })),
      suggestedActions: [
        { title: 'Create doc', detail: 'Draft slides/agenda', type: 'task.create' },
        { title: 'Draft promo email', detail: `Invite to ${theme} session`, type: 'gmail.draft_email' },
      ],
      confidence: 0.64,
    },
  };
}
