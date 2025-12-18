import { AgentOutput } from '../../shared/contracts';

export interface CreativeDirectorPayload {
  userId?: string;
  draft?: string;
  channel?: string;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runCreativeDirectorAdapter(payload: CreativeDirectorPayload): Promise<AgentOutput<any>> {
  const draft = payload.draft || 'Placeholder draft content';
  const channel = payload.channel || 'LinkedIn';
  const improved = `${draft} (tightened for ${channel}, add visual focus and CTA to save/share)`;
  const toneCheck = 'Aligned to Elevated Movements: warm, strengths-centered, clear CTA.';

  return {
    status: 'OK',
    output: {
      summary: `Creative review for ${channel}`,
      insights: [
        { title: 'Tone Check', detail: toneCheck },
        { title: 'Visual Direction', detail: 'Use clean blocks, warm neutrals + amber accents, human-centric imagery.' },
      ],
      suggestedActions: [
        { title: 'Create revision plan', detail: 'Outline edits and visual cues', type: 'task.create' },
      ],
      confidence: 0.65,
    },
  };
}
