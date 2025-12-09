import fs from 'fs';
import path from 'path';
import { DailyBriefInput, DailyBriefOutput, FocusWindow } from './types';

export interface CalendarEvent {
  start: string;
  end: string;
  summary?: string;
  description?: string;
}

export interface BriefSections {
  priorities: string[];
  agenda: string[];
  tasks: string[];
  inboxHighlights: string[];
  suggestedFocusWindows: FocusWindow[];
  renderedText: string;
  renderedHtml?: string;
}

export interface DailyBriefDependencies {
  calendar: {
    listEvents(date: Date, timeZone: string): Promise<CalendarEvent[]>;
  };
  summarizer: {
    generateDailyBrief(
      events: CalendarEvent[],
      date: Date
    ): Promise<{
      priorities: string[];
      agenda: string[];
      tasks: string[];
      inboxHighlights: string[];
      suggestedFocusWindows: FocusWindow[];
      text?: string;
      html?: string;
      greeting?: string;
      dayOverview?: string;
    }>;
  };
  email: {
    sendEmail(
      to: string | string[],
      subject: string,
      html: string,
      options?: { cc?: string[]; bcc?: string[]; attachments?: Array<{ filename: string; path: string }> }
    ): Promise<{ success: boolean; messageId?: string }>;
  };
  voice?: {
    synthesize(text: string, outPath: string): Promise<string>;
  };
  recipientsResolver: (userId: string) => string[];
  activityLog?: {
    logAgentRun: (input: {
      agentName: string;
      founderEmail: string;
      status: 'success' | 'error';
      metadata?: any;
    }) => Promise<{ success: boolean }>;
  };
  timeZone?: string;
}

const DEFAULT_TZ = 'America/Los_Angeles';

function ensureOutDir(): string {
  const outDir = path.join(process.cwd(), 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return outDir;
}

function formatDate(date: Date, timeZone: string): string {
  return date.toLocaleDateString('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildNarration(brief: BriefSections): string {
  const priorities = brief.priorities.slice(0, 3).join('. ');
  return `Good morning. Here are your top priorities. ${priorities}. Agenda: ${brief.agenda.slice(0, 3).join('. ')}`;
}

function renderFallbackHtml(sections: BriefSections, dateLabel: string): string {
  const section = (title: string, items: string[]) =>
    `<h3>${title}</h3><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  return `
    <html>
      <body>
        <h2>Daily Brief - ${dateLabel}</h2>
        ${section('Priorities', sections.priorities)}
        ${section('Agenda', sections.agenda)}
        ${section('Tasks', sections.tasks)}
        ${section('Inbox Highlights', sections.inboxHighlights)}
        ${section(
          'Suggested Focus Windows',
          sections.suggestedFocusWindows.map(
            (fw) => `${fw.start} - ${fw.end}: ${fw.reason}`
          )
        )}
      </body>
    </html>
  `;
}

export async function runDailyBrief(
  input: DailyBriefInput,
  deps: DailyBriefDependencies
): Promise<DailyBriefOutput> {
  const timeZone = deps.timeZone || DEFAULT_TZ;
  const date = input.date ? new Date(input.date) : new Date();
  const dateLabel = formatDate(date, timeZone);

  const recipients = deps.recipientsResolver(input.userId);
  if (!recipients || recipients.length === 0) {
    throw new Error(`No recipients found for userId: ${input.userId}`);
  }

  try {
    const events = await deps.calendar.listEvents(date, timeZone);
    const brief = await deps.summarizer.generateDailyBrief(events, date);

    const sections: BriefSections = {
      priorities: brief.priorities || [],
      agenda: brief.agenda || [],
      tasks: brief.tasks || [],
      inboxHighlights: brief.inboxHighlights || [],
      suggestedFocusWindows: brief.suggestedFocusWindows || [],
      renderedText:
        brief.text ||
        `Priorities: ${brief.priorities?.join(', ')}. Agenda: ${brief.agenda?.join(', ')}`,
      renderedHtml: brief.html,
    };

    let audioPath: string | undefined;
    if (deps.voice && process.env.ELEVENLABS_API_KEY) {
      const narration = buildNarration(sections);
      const outDir = ensureOutDir();
      const filePath = path.join(outDir, `daily-brief-${input.userId}-${date.toISOString().split('T')[0]}.mp3`);
      audioPath = await deps.voice.synthesize(narration, filePath);
    }

    const html = sections.renderedHtml || renderFallbackHtml(sections, dateLabel);
    const subject = `Your Daily Brief - ${dateLabel}`;
    const attachments = audioPath
      ? [
          {
            filename: `daily-brief-${input.userId}.mp3`,
            path: audioPath,
          },
        ]
      : [];

    await deps.email.sendEmail(recipients, subject, html, { attachments });

    if (deps.activityLog) {
      await deps.activityLog.logAgentRun({
        agentName: 'DailyBrief',
        founderEmail: recipients[0],
        status: 'success',
        metadata: {
          subjectLine: subject,
          recipientsCount: recipients.length,
          prioritiesCount: sections.priorities.length,
          agendaCount: sections.agenda.length,
          mp3Attached: !!audioPath,
        },
      });
    }

    return {
      date: date.toISOString().split('T')[0],
      userId: input.userId,
      priorities: sections.priorities,
      agenda: sections.agenda,
      tasks: sections.tasks,
      inboxHighlights: sections.inboxHighlights,
      suggestedFocusWindows: sections.suggestedFocusWindows,
      rendered: {
        text: sections.renderedText,
        html,
        audioPath,
      },
    };
  } catch (error) {
    if (deps.activityLog) {
      await deps.activityLog.logAgentRun({
        agentName: 'DailyBrief',
        founderEmail: deps.recipientsResolver(input.userId)[0] || 'unknown',
        status: 'error',
        metadata: { errorMessage: (error as Error).message },
      });
    }
    throw error;
  }
}
