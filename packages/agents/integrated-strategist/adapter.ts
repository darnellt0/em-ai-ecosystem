import { AgentOutput } from '../../shared/contracts';

export interface IntegratedStrategistPayload {
  userId?: string;
  focus?: string;
  calendarSummary?: string;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runIntegratedStrategistAdapter(payload: IntegratedStrategistPayload): Promise<AgentOutput<any>> {
  const focus = payload.focus || 'Protect deep work and ship one meaningful outcome';
  const priorities = [
    'Priority: One 90m deep work block on top goal.',
    'Priority: One relationship touchpoint.',
    'Priority: One restorative break.',
  ];
  const ignore = 'Ignore: low-ROI admin that can wait 48h.';

  return {
    status: 'OK',
    output: {
      summary: `Integrated plan for ${payload.userId || 'founder'}`,
      insights: [
        { title: 'Focus', detail: focus },
        { title: 'What to ignore', detail: ignore },
      ],
      suggestedActions: [
        { title: 'Propose calendar block', detail: '90m deep work', type: 'calendar.propose_block' },
        { title: 'Create follow-up task', detail: 'Relationship touchpoint', type: 'task.create' },
      ],
      confidence: 0.68,
    },
  };
}
