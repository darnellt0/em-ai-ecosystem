import { AgentOutput } from '../../shared/contracts';

export interface RelationshipTrackerPayload {
  userId?: string;
  contacts?: { name: string; reason?: string }[];
  mode?: 'PLAN' | 'EXECUTE';
}

export async function runRelationshipTrackerAdapter(payload: RelationshipTrackerPayload): Promise<AgentOutput<any>> {
  const contacts = payload.contacts && payload.contacts.length
    ? payload.contacts
    : [{ name: 'Key partner', reason: 'Recent win; send gratitude' }];

  return {
    status: 'OK',
    output: {
      summary: `Relationship follow-up plan for ${payload.userId || 'founder'}`,
      insights: contacts.map((c) => ({
        title: 'Follow-up',
        detail: `${c.name}: ${c.reason || 'Re-engage and share latest focus'}`,
      })),
      suggestedActions: [
        { title: 'Draft follow-up email', detail: 'Send gratitude + next step', type: 'gmail.draft_email' },
        { title: 'Create reminder', detail: 'Schedule follow-up in 7 days', type: 'task.create' },
      ],
      confidence: 0.6,
    },
  };
}
