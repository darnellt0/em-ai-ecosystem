import { randomUUID } from 'crypto';
import { runDailyBriefWorkflow, DailyBriefPayload, DailyBriefResult } from '../../../agents/daily-brief/service';
import { calendarService } from './calendar.service';
import { insightsService } from './insights.service';
import logger from '../../core/src/utils/logger';

const DEFAULT_TZ = 'America/Los_Angeles';

const recipientsByUser: Record<string, string[]> = {
  darnell: [process.env.FOUNDER_DARNELL_EMAIL || ''],
  shria: [process.env.FOUNDER_SHRIA_EMAIL || ''],
};

function resolveEmail(user: DailyBriefPayload['user']): string {
  return recipientsByUser[user]?.[0] || '';
}

export async function runDailyBriefAgent(input: { user: DailyBriefPayload['user']; date?: string; runId?: string }): Promise<DailyBriefResult> {
  const runId = input.runId || randomUUID();
  const timezone = process.env.TZ || DEFAULT_TZ;

  const payload: DailyBriefPayload = { user: input.user, date: input.date, runId };

  const output = await runDailyBriefWorkflow(payload, {
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

  return output.output;
}
