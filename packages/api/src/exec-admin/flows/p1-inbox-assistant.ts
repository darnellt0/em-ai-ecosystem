import { inboxService, InboxEmail } from '../../services/inbox.service';

export interface InboxAssistantInput {
  userId: string;
  mode?: 'offline' | 'live';
  query?: string;
  maxResults?: number;
  includeDrafts?: boolean;
}

export interface InboxAssistantOutput {
  userId: string;
  mode: 'offline' | 'live';
  query?: string;
  summary: {
    total: number;
    urgent: number;
    important: number;
    needsReply: number;
    readLater: number;
  };
  topEmails: Array<{
    id: string;
    from: string;
    subject: string;
    snippet: string;
    labels?: string[];
  }>;
  recommendedActions: string[];
  draftReplies?: Array<{
    emailId: string;
    suggestions: string[];
  }>;
  offline: boolean;
  generatedAt: string;
}

type InboxCategory = 'urgent' | 'important' | 'needs_reply' | 'read_later';

const CATEGORY_PRIORITY: InboxCategory[] = ['urgent', 'needs_reply', 'important', 'read_later'];

export async function runP1InboxAssistant(
  input: InboxAssistantInput
): Promise<{ runId: string; data: InboxAssistantOutput }> {
  if (!input?.userId) {
    throw new Error('userId is required');
  }

  const runId = `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const maxResults = typeof input.maxResults === 'number' && input.maxResults > 0 ? input.maxResults : 5;

  let offline = input.mode === 'offline' || !inboxService.isConfigured();
  let emails: InboxEmail[] = [];

  if (!offline) {
    try {
      emails = await inboxService.listEmails({
        userId: input.userId,
        query: input.query,
        maxResults,
      });
    } catch (error) {
      console.warn('[P1 Inbox Assistant] Inbox service error, switching to offline mode:', error);
      offline = true;
    }
  }

  if (offline || emails.length === 0) {
    emails = buildOfflineEmails(input.userId);
    offline = true;
  }

  const categorized = emails.map((email) => ({
    email,
    category: categorizeEmail(email),
  }));

  const summary = {
    total: categorized.length,
    urgent: categorized.filter((item) => item.category === 'urgent').length,
    important: categorized.filter((item) => item.category === 'important').length,
    needsReply: categorized.filter((item) => item.category === 'needs_reply').length,
    readLater: categorized.filter((item) => item.category === 'read_later').length,
  };

  const topEmails = categorized
    .sort((a, b) => CATEGORY_PRIORITY.indexOf(a.category) - CATEGORY_PRIORITY.indexOf(b.category))
    .slice(0, maxResults)
    .map((item) => ({
      id: item.email.id,
      from: item.email.from,
      subject: item.email.subject,
      snippet: item.email.snippet,
      labels: item.email.labels,
    }));

  const recommendedActions = buildRecommendedActions(summary);

  const draftReplies = input.includeDrafts ? buildDraftReplies(topEmails) : undefined;

  const output: InboxAssistantOutput = {
    userId: input.userId,
    mode: offline ? 'offline' : 'live',
    query: input.query,
    summary,
    topEmails,
    recommendedActions,
    draftReplies,
    offline,
    generatedAt: new Date().toISOString(),
  };

  console.log('[P1 Inbox Assistant] Complete', { runId, offline, topEmails: topEmails.length });

  return { runId, data: output };
}

function buildOfflineEmails(userId: string): InboxEmail[] {
  const domain = userId.includes('@') ? userId.split('@')[1] : 'example.com';
  return [
    {
      id: 'sample-urgent-1',
      from: `ceo@${domain}`,
      subject: 'Urgent: contract review needed today',
      snippet: 'Please review the attached agreement before 5pm.',
      labels: ['urgent', 'needs_reply'],
    },
    {
      id: 'sample-important-1',
      from: `finance@${domain}`,
      subject: 'Q4 budget adjustments',
      snippet: 'We need confirmation on updated budget allocations.',
      labels: ['important'],
    },
    {
      id: 'sample-needs-reply-1',
      from: 'client@partner.io',
      subject: 'Quick question about timeline',
      snippet: 'Can we push the kickoff by one week?',
      labels: ['needs_reply'],
    },
    {
      id: 'sample-read-later-1',
      from: 'newsletter@updates.io',
      subject: 'Weekly leadership insights',
      snippet: 'Top 5 trends leaders are watching this week.',
      labels: ['read_later'],
    },
  ];
}

function categorizeEmail(email: InboxEmail): InboxCategory {
  const labels = email.labels || [];
  const subject = (email.subject || '').toLowerCase();
  if (labels.includes('urgent') || subject.includes('urgent')) return 'urgent';
  if (labels.includes('needs_reply') || subject.includes('reply')) return 'needs_reply';
  if (labels.includes('important')) return 'important';
  return 'read_later';
}

function buildRecommendedActions(summary: {
  total: number;
  urgent: number;
  important: number;
  needsReply: number;
  readLater: number;
}): string[] {
  const actions: string[] = [];

  if (summary.urgent > 0) {
    actions.push(`Reply to ${summary.urgent} urgent email(s) first.`);
  }
  if (summary.needsReply > 0) {
    actions.push(`Draft replies for ${summary.needsReply} message(s) needing response.`);
  }
  if (summary.important > 0) {
    actions.push(`Schedule time to handle ${summary.important} important email(s).`);
  }
  if (summary.readLater > 0) {
    actions.push(`Batch ${summary.readLater} read-later email(s) into a single review block.`);
  }
  if (actions.length === 0) {
    actions.push('Inbox is clear. Protect focus time.');
  }

  return actions;
}

function buildDraftReplies(
  topEmails: Array<{ id: string; from: string; subject: string }>
): Array<{ emailId: string; suggestions: string[] }> {
  return topEmails.slice(0, 2).map((email) => ({
    emailId: email.id,
    suggestions: [
      `Acknowledge receipt of "${email.subject}".`,
      'Confirm next step and timing.',
      'Offer one clear option for follow-up.',
    ],
  }));
}
