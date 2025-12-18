import { AgentOutput } from '../../shared/contracts';

export interface EventArchitectPayload {
  userId?: string;
  eventType?: string;
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runEventArchitectAdapter(payload: EventArchitectPayload): Promise<AgentOutput<any>> {
  const eventType = payload.eventType || 'Community workshop';
  const runOfShow = [
    'Arrival + welcome (10m)',
    'Opening story + intention (10m)',
    'Main activity (40m)',
    'Q&A / Reflection (15m)',
    'Close + CTA (10m)',
  ];
  const promoTimeline = [
    'T-14d: Send save-the-date',
    'T-7d: Send primary invite',
    'T-1d: Reminder + materials',
  ];

  return {
    status: 'OK',
    output: {
      summary: `Event plan for ${eventType}`,
      insights: [
        { title: 'Run of show', detail: runOfShow.join('; ') },
        { title: 'Promotion', detail: promoTimeline.join('; ') },
      ],
      suggestedActions: [
        { title: 'Draft outreach email', detail: 'Invite + RSVP link', type: 'gmail.draft_email' },
        { title: 'Create tasks', detail: 'Logistics checklist', type: 'task.create' },
      ],
      confidence: 0.62,
    },
  };
}
