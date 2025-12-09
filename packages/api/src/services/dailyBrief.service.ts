import fs from 'fs';
import path from 'path';
import { runDailyBrief } from '../../../agents/daily-brief/src';
import { calendarService } from './calendar.service';
import { emailService } from './email.service';
import { insightsService } from './insights.service';
import { activityLogService } from './activity-log.service';
import { generateAudio } from '../voice/voice.elevenlabs';
import { DailyBriefOutput } from '../../../agents/daily-brief/src/types';

const DEFAULT_TZ = 'America/Los_Angeles';

const recipientsByUser: Record<string, string[]> = {
  darnell: [process.env.FOUNDER_DARNELL_EMAIL || ''],
  shria: [process.env.FOUNDER_SHRIA_EMAIL || ''],
  founder: [process.env.FOUNDER_DARNELL_EMAIL || '', process.env.FOUNDER_SHRIA_EMAIL || ''].filter(Boolean),
};

function resolveRecipients(userId: string): string[] {
  return recipientsByUser[userId] || [userId].filter(Boolean);
}

function ensureOutDir(): string {
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  return outDir;
}

export async function runDailyBriefAgent(input: { userId: string; date?: string }): Promise<DailyBriefOutput> {
  const tz = process.env.TZ || DEFAULT_TZ;

  const deps = {
    calendar: {
      listEvents: async (date: Date, timeZone: string) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const events = await calendarService.listUpcomingEvents({
          calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
          timeMin: start,
          timeMax: end,
        });
        return events.map((e) => ({
          start: e.start,
          end: e.end,
          summary: e.summary,
          description: e.description || undefined,
        }));
      },
    },
    summarizer: {
      generateDailyBrief: async (events: any[], date: Date) => {
        // Use insightsService to get sections; derive priorities/agenda
        const founderEmail = resolveRecipients(input.userId)[0] || '';
        const insights = await insightsService.generateDailyBrief(founderEmail);
        const priorities = insights.sections
          .filter((s) => s.priority === 'high')
          .map((s) => s.title);
        const agenda = events.map((e) => e.summary || 'Untitled event');
        const tasks = insights.sections.flatMap((s) => s.actionItems || []);
        const inboxHighlights: string[] = [];
        const suggestedFocusWindows: { start: string; end: string; reason: string }[] = [];
        return {
          priorities,
          agenda,
          tasks,
          inboxHighlights,
          suggestedFocusWindows,
          text: `${insights.title}: ${insights.summary}`,
          html: `<html><body><h2>${insights.title}</h2><p>${insights.summary}</p></body></html>`,
          greeting: 'Good morning',
          dayOverview: insights.summary,
        };
      },
    },
    email: {
      sendEmail: async (to: string | string[], subject: string, html: string, options?: any) =>
        emailService.sendEmail(to, subject, html, options),
    },
    voice: process.env.ELEVENLABS_API_KEY
      ? {
          synthesize: async (text: string, outPath: string) => {
            const audio = await generateAudio(text, {}, false);
            if (!audio.success || !audio.audioBuffer) throw new Error(audio.error || 'Voice synth failed');
            ensureOutDir();
            fs.writeFileSync(outPath, audio.audioBuffer);
            return outPath;
          },
        }
      : undefined,
    recipientsResolver: (userId: string) => resolveRecipients(userId),
    activityLog: activityLogService,
    timeZone: tz,
  };

  return runDailyBrief(input, deps);
}
