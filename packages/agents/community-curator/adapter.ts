import { AgentOutput } from '../../shared/contracts';

export interface CommunityCuratorPayload {
  userId?: string;
  theme?: string;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runCommunityCuratorAdapter(payload: CommunityCuratorPayload): Promise<AgentOutput<any>> {
  const theme = payload.theme || 'Rested leadership and strengths';
  const prompts = [
    'What strengths are you leading with this week?',
    'How are you protecting rest while scaling impact?',
    'Share one win and one obstacle.',
  ];

  return {
    status: 'OK',
    output: {
      summary: `Community prompts for ${theme}`,
      insights: prompts.map((p) => ({ title: 'Prompt', detail: p })),
      suggestedActions: [
        { title: 'Draft community post', detail: `Share prompts on ${theme}`, type: 'content.community' },
        { title: 'Draft email/newsletter blurb', detail: 'Invite replies with top prompt', type: 'gmail.draft_email' },
      ],
      confidence: 0.6,
    },
  };
}
