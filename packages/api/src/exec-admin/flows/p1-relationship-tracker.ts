/**
 * P1 Wave 5 - Relationship Tracker
 *
 * Intent: relationship_track
 *
 * Manages contacts, tracks touchpoints, and suggests relationship maintenance actions.
 *
 * Features:
 * - Contact list management with last contact tracking
 * - Touchpoint status calculation (overdue, due_soon, ok)
 * - Smart touchpoint suggestions based on relationship type and history
 * - Offline mode with deterministic sample data
 * - Degradation with confidence scoring
 */

export interface RelationshipTrackerInput {
  userId: string;
  action?: 'list' | 'get' | 'update' | 'suggest_touchpoints';
  contactId?: string;  // Required for 'get' and 'update'
  filters?: {
    status?: 'overdue' | 'due_soon' | 'ok' | 'all';
    relationship?: 'investor' | 'partner' | 'mentor' | 'client' | 'community' | 'all';
    limit?: number;
  };
  updateData?: {
    lastContactDate?: string;  // ISO date
    notes?: string;
    nextTouchpointDate?: string;  // ISO date
  };
  mode?: 'offline' | 'live';
}

export interface Contact {
  contactId: string;
  name: string;
  relationship: 'investor' | 'partner' | 'mentor' | 'client' | 'community';
  email?: string;
  lastContactDate: string;  // ISO date
  daysSinceContact: number;
  touchpointStatus: 'overdue' | 'due_soon' | 'ok';
  suggestedTouchpointDate: string;  // ISO date
  notes?: string;
  tags?: string[];
}

export interface TouchpointSuggestion {
  contactId: string;
  contactName: string;
  reason: string;
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;  // ISO date
}

export interface RelationshipTrackerOutput {
  runId: string;
  userId: string;
  action: string;
  contacts?: Contact[];
  contact?: Contact;  // For 'get' action
  touchpointSuggestions?: TouchpointSuggestion[];
  stats?: {
    totalContacts: number;
    overdue: number;
    dueSoon: number;
    ok: number;
  };
  confidenceScore: number;  // 0-1
  insight: string;
  recommendedNextAction: string;
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

/**
 * Calculate touchpoint status based on relationship type and days since contact
 */
function calculateTouchpointStatus(
  relationship: Contact['relationship'],
  daysSinceContact: number
): Contact['touchpointStatus'] {
  const thresholds = {
    investor: { overdue: 30, dueSoon: 21 },
    partner: { overdue: 21, dueSoon: 14 },
    mentor: { overdue: 45, dueSoon: 30 },
    client: { overdue: 14, dueSoon: 7 },
    community: { overdue: 60, dueSoon: 45 },
  };

  const threshold = thresholds[relationship];
  if (daysSinceContact >= threshold.overdue) return 'overdue';
  if (daysSinceContact >= threshold.dueSoon) return 'due_soon';
  return 'ok';
}

/**
 * Generate suggested touchpoint date based on relationship type
 */
function suggestNextTouchpoint(relationship: Contact['relationship'], fromDate: Date): string {
  const intervals = {
    investor: 21,  // 3 weeks
    partner: 14,   // 2 weeks
    mentor: 30,    // 1 month
    client: 7,     // 1 week
    community: 45, // 1.5 months
  };

  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + intervals[relationship]);
  return nextDate.toISOString().split('T')[0];
}

/**
 * Generate offline sample contacts
 */
function generateOfflineContacts(userId: string): Contact[] {
  const now = new Date();
  const contacts: Contact[] = [
    {
      contactId: 'contact_001',
      name: 'Sarah Chen',
      relationship: 'investor',
      email: 'sarah@venturelab.com',
      lastContactDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceContact: 35,
      touchpointStatus: 'overdue',
      suggestedTouchpointDate: new Date().toISOString().split('T')[0],
      notes: 'Interested in Q1 growth metrics',
      tags: ['seed-round', 'active'],
    },
    {
      contactId: 'contact_002',
      name: 'Marcus Johnson',
      relationship: 'partner',
      email: 'marcus@fitnesshub.io',
      lastContactDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceContact: 18,
      touchpointStatus: 'due_soon',
      suggestedTouchpointDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Co-marketing opportunity discussed',
      tags: ['partnership', 'marketing'],
    },
    {
      contactId: 'contact_003',
      name: 'Dr. Amelia Rodriguez',
      relationship: 'mentor',
      email: 'amelia@stanford.edu',
      lastContactDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceContact: 25,
      touchpointStatus: 'ok',
      suggestedTouchpointDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Advisor for strategic planning',
      tags: ['advisor', 'monthly-check-in'],
    },
    {
      contactId: 'contact_004',
      name: 'Elevated Movements Community',
      relationship: 'community',
      email: 'community@elevatedmovements.com',
      lastContactDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceContact: 50,
      touchpointStatus: 'ok',
      suggestedTouchpointDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Monthly newsletter and engagement',
      tags: ['community', 'newsletter'],
    },
  ];

  return contacts;
}

/**
 * Generate touchpoint suggestions
 */
function generateTouchpointSuggestions(contacts: Contact[]): TouchpointSuggestion[] {
  const suggestions: TouchpointSuggestion[] = [];

  for (const contact of contacts) {
    if (contact.touchpointStatus === 'overdue' || contact.touchpointStatus === 'due_soon') {
      const priority = contact.touchpointStatus === 'overdue' ? 'high' : 'medium';

      let suggestedAction = '';
      let reason = '';

      switch (contact.relationship) {
        case 'investor':
          suggestedAction = 'Send quarterly update email with key metrics and milestones';
          reason = `${contact.daysSinceContact} days since last contact (threshold: 30 days)`;
          break;
        case 'partner':
          suggestedAction = 'Schedule coffee chat to discuss collaboration opportunities';
          reason = `${contact.daysSinceContact} days since last contact (threshold: 21 days)`;
          break;
        case 'mentor':
          suggestedAction = 'Request 30-min call for strategic advice';
          reason = `${contact.daysSinceContact} days since last contact (threshold: 45 days)`;
          break;
        case 'client':
          suggestedAction = 'Check in on satisfaction and gather feedback';
          reason = `${contact.daysSinceContact} days since last contact (threshold: 14 days)`;
          break;
        case 'community':
          suggestedAction = 'Send community update or host virtual event';
          reason = `${contact.daysSinceContact} days since last contact (threshold: 60 days)`;
          break;
      }

      suggestions.push({
        contactId: contact.contactId,
        contactName: contact.name,
        reason,
        suggestedAction,
        priority,
        dueDate: contact.suggestedTouchpointDate,
      });
    }
  }

  // Sort by priority (high first) and then by days since contact
  return suggestions.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === 'high' ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Main execution function
 */
export async function runP1RelationshipTracker(
  input: RelationshipTrackerInput
): Promise<RelationshipTrackerOutput> {
  const runId = `relationship_track_${Date.now()}`;
  const mode = input.mode || 'offline';
  const action = input.action || 'list';

  // Validation and degradation logic
  let confidenceScore = 1.0;

  if (!input.userId) {
    confidenceScore = 0.3;
  }

  if (action === 'get' && !input.contactId) {
    confidenceScore = Math.min(confidenceScore, 0.4);
  }

  if (action === 'update' && (!input.contactId || !input.updateData)) {
    confidenceScore = Math.min(confidenceScore, 0.4);
  }

  // Offline mode: deterministic sample data
  const contacts = generateOfflineContacts(input.userId || 'unknown');

  let filteredContacts = contacts;
  if (input.filters) {
    if (input.filters.status && input.filters.status !== 'all') {
      filteredContacts = filteredContacts.filter(c => c.touchpointStatus === input.filters!.status);
    }
    if (input.filters.relationship && input.filters.relationship !== 'all') {
      filteredContacts = filteredContacts.filter(c => c.relationship === input.filters!.relationship);
    }
    if (input.filters.limit) {
      filteredContacts = filteredContacts.slice(0, input.filters.limit);
    }
  }

  const touchpointSuggestions = generateTouchpointSuggestions(contacts);

  const stats = {
    totalContacts: contacts.length,
    overdue: contacts.filter(c => c.touchpointStatus === 'overdue').length,
    dueSoon: contacts.filter(c => c.touchpointStatus === 'due_soon').length,
    ok: contacts.filter(c => c.touchpointStatus === 'ok').length,
  };

  let insight = '';
  let recommendedNextAction = '';

  switch (action) {
    case 'list':
      insight = `You have ${stats.totalContacts} contacts tracked. ${stats.overdue} overdue, ${stats.dueSoon} due soon, ${stats.ok} on track.`;
      recommendedNextAction = stats.overdue > 0
        ? `Reach out to ${contacts.find(c => c.touchpointStatus === 'overdue')?.name} (overdue by ${contacts.find(c => c.touchpointStatus === 'overdue')?.daysSinceContact} days)`
        : 'All contacts are on track. Review due soon list.';
      break;

    case 'get':
      const contact = contacts.find(c => c.contactId === input.contactId);
      insight = contact
        ? `${contact.name} (${contact.relationship}): ${contact.daysSinceContact} days since last contact. Status: ${contact.touchpointStatus}.`
        : 'Contact not found in offline mode.';
      recommendedNextAction = contact && contact.touchpointStatus !== 'ok'
        ? `Reach out to ${contact.name} within ${contact.touchpointStatus === 'overdue' ? '24 hours' : '3 days'}`
        : 'Contact is on track.';

      return {
        runId,
        userId: input.userId || 'unknown',
        action,
        contact: contact || undefined,
        confidenceScore,
        insight,
        recommendedNextAction,
        mode,
        offline: true,
        generatedAt: new Date().toISOString(),
      };

    case 'update':
      insight = 'Offline mode: update simulated successfully.';
      recommendedNextAction = 'Refresh contact list to see changes (in live mode).';
      break;

    case 'suggest_touchpoints':
      insight = `Generated ${touchpointSuggestions.length} touchpoint suggestions based on relationship types and last contact dates.`;
      recommendedNextAction = touchpointSuggestions.length > 0
        ? `Start with: ${touchpointSuggestions[0].suggestedAction} (${touchpointSuggestions[0].contactName})`
        : 'All contacts are on track. No immediate actions needed.';
      break;
  }

  return {
    runId,
    userId: input.userId || 'unknown',
    action,
    contacts: action === 'list' ? filteredContacts : undefined,
    touchpointSuggestions: action === 'suggest_touchpoints' ? touchpointSuggestions : undefined,
    stats,
    confidenceScore,
    insight,
    recommendedNextAction,
    mode,
    offline: true,
    generatedAt: new Date().toISOString(),
  };
}
