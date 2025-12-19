import { AgentOutput } from '../../shared/contracts';

export interface BrandStorytellerPayload {
  userId?: string;
  founderEmail?: string;
  mission?: string;
  audience?: string;
  wins?: string[];
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runBrandStorytellerAdapter(payload: BrandStorytellerPayload): Promise<AgentOutput<any>> {
  const user = payload.userId || payload.founderEmail || 'founder';
  const mission = payload.mission || 'Elevated Movements empowers strengths-centered leaders';
  const audience = payload.audience || 'women of color and values-driven leaders';
  const wins = payload.wins && payload.wins.length ? payload.wins.join('; ') : 'recent client breakthroughs';

  const storyAngle = `Lead with purpose: ${mission}. Audience: ${audience}. Wins: ${wins}.`;
  const hooks = [
    'Hook 1: What if your strengths became your operating system?',
    'Hook 2: Rest as a leadership advantage.',
    'Hook 3: From clarity to community impact.',
  ];
  const cta = 'CTA: Invite peers to reflect and share one strength they’re leading with this week.';

  return {
    status: 'OK',
    output: {
      summary: `Brand story crafted for ${user}`,
      insights: [
        { title: 'Story Angle', detail: storyAngle },
        { title: 'Audience', detail: audience },
      ],
      suggestedActions: [
        { title: 'Draft LinkedIn post', detail: `${hooks[0]} ${cta}`, type: 'content.linkedin' },
        { title: 'Add to content queue', detail: 'Schedule in content calendar', type: 'task.create' },
      ],
      confidence: 0.7,
    },
  };
}
