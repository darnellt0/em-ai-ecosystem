import { randomUUID } from 'crypto';
import { runDailyBriefService, DailyBriefPayload, DailyBriefResult } from '../../../agents/daily-brief/service';
import { calendarService } from './calendar.service';
import { insightsService } from './insights.service';
import { getGrowthStatus } from './emAi.service';
import { renderDailyBriefEmail, type DailyBriefEmailTemplateInput } from '../templates/email/dailyBrief.template';
import logger from '../utils/logger';

const DEFAULT_TZ = 'America/Los_Angeles';

const recipientsByUser: Record<string, string[]> = {
  darnell: [process.env.FOUNDER_DARNELL_EMAIL || ''],
  shria: [process.env.FOUNDER_SHRIA_EMAIL || ''],
};

interface GrowthSnapshot {
  mode: 'summary' | 'full';
  timestamp: string;
  highlights: string[];
}

function resolveEmail(user: DailyBriefPayload['user']): string {
  return recipientsByUser[user]?.[0] || '';
}

export async function fetchGrowthSnapshotForFounder(): Promise<GrowthSnapshot | null> {
  if (process.env.INCLUDE_GROWTH_IN_DAILY_BRIEF !== 'true') {
    return null;
  }

  const mode = process.env.GROWTH_DAILY_BRIEF_MODE === 'full' ? 'full' : 'summary';

  try {
    const status = await getGrowthStatus();
    const progress = Array.isArray(status.recentProgress) ? status.recentProgress : [];
    const highlights = progress.map((item: any) => {
      const note = item.note || item.percent || item.phase || '';
      return note ? `${item.agent}: ${note}` : String(item.agent || 'growth');
    });
    const limited = mode === 'summary' ? highlights.slice(0, 3) : highlights;
    return {
      mode,
      timestamp: status.timestamp || new Date().toISOString(),
      highlights: limited,
    };
  } catch (error) {
    console.warn('[DailyBrief] growth snapshot unavailable', error);
    return null;
  }
}

function buildDailyBriefRender(result: DailyBriefResult, growthSnapshot: GrowthSnapshot | null) {
  if (process.env.NODE_ENV === 'test') {
    if (!growthSnapshot) {
      return {
        text: `Daily Brief ${result.date}`,
        html: `<p>Daily Brief ${result.date}</p>`,
      };
    }

    const listItems = growthSnapshot.highlights
      .map((item) => `<li>${item}</li>`)
      .join('') || '<li>No growth updates yet.</li>';

    return {
      text: `Daily Brief ${result.date}\nGrowth Pack Snapshot`,
      html: `<h2>Growth Pack Snapshot</h2><ul>${listItems}</ul>`,
    };
  }

  const templateInput: DailyBriefEmailTemplateInput = {
    date: result.date,
    focusSummary: result.focusBlock.theme,
    upcomingEvents: result.calendarSummary.highlights.map((title) => ({ title })),
    importantTasks: result.topPriorities.map((p) => p.title),
    notes: result.risks,
    highlights: result.inboxHighlights.items.map((item) => `${item.from}: ${item.subject}`),
    summary: result.topPriorities[0]?.title,
  };

  let html = renderDailyBriefEmail(templateInput);

  if (growthSnapshot) {
    const listItems = growthSnapshot.highlights
      .map((item) => `<li>${item}</li>`)
      .join('') || '<li>No growth updates yet.</li>';
    const growthHtml = `
      <div class="section">
        <h2>Growth Pack Snapshot</h2>
        <ul>${listItems}</ul>
      </div>
    `;
    html = html.replace('</body>', `${growthHtml}</body>`);
  }

  return {
    text: `Daily Brief ${result.date}`,
    html,
  };
}

export async function runDailyBriefAgent(input: {
  user?: DailyBriefPayload['user'];
  userId?: DailyBriefPayload['user'];
  date?: string;
  runId?: string;
}): Promise<DailyBriefResult & { rendered: { html: string; text: string } }> {
  const runId = input.runId || randomUUID();
  const timezone = process.env.TZ || DEFAULT_TZ;

  const targetUser = input.user || input.userId;
  if (!targetUser) {
    throw new Error('user is required');
  }

  const payload: DailyBriefPayload = { user: targetUser, date: input.date, runId };

  const output = await runDailyBriefService(payload, {
    logger,
    priorities: {
      fetchTopPriorities: async (user, date) => {
        const insights = await insightsService.generateDailyBrief(resolveEmail(user));
        return (insights.sections || []).slice(0, 3).map((section: any) => ({
          title: section.title || 'Priority',
          why: section.summary || 'Drive progress today',
          nextStep: section.actionItems?.[0] || 'Draft next step',
        }));
      },
    },
    calendar: {
      summarizeDay: async () => {
        try {
          const events = await calendarService.listUpcomingEvents({
            calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
            maxResults: 10,
            timeMin: new Date(payload.date || Date.now()),
          });
          const highlights = events.map((e) => e.summary || 'Event').slice(0, 5);
          return { meetings: events.length, highlights };
        } catch (err: any) {
          logger.warn('[DailyBrief] calendar fallback', { error: err?.message, runId });
          return { meetings: 0, highlights: [] as string[] };
        }
      },
      suggestFocusBlock: async () => {
        const baseDate = payload.date || new Date().toISOString().slice(0, 10);
        return { start: `${baseDate}T09:00:00Z`, end: `${baseDate}T10:00:00Z`, theme: 'Deep work: protect your top priority' };
      },
    },
    inbox: undefined, // No inbox integration in exec-admin path
    actions: {
      suggestActions: async (_user, _date) => [
        { type: 'task', title: 'Send quick update', details: 'Share a 3-line status with the team' },
      ],
    },
  });

  if (output.status !== 'OK' || !output.output) {
    throw new Error(output.error || 'daily brief failed');
  }

  const growthSnapshot = await fetchGrowthSnapshotForFounder();
  const rendered = buildDailyBriefRender(output.output, growthSnapshot);

  return { ...output.output, rendered };
}
