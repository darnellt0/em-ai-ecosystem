/**
 * Rhythm Agent - Rest & Rhythm Planner
 * Phase: Rooted
 * Helps users find balance between productivity and rest
 */

import { OrchestratorRunContext, GrowthAgentResult } from '../types';

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  duration: number; // minutes
}

/**
 * Pause block suggestion
 */
export interface PauseBlock {
  title: string;
  suggestedStart: Date;
  suggestedEnd: Date;
  duration: number; // minutes
  reason: string;
  dayDate: string;
}

/**
 * Dense day analysis
 */
export interface DenseDayAnalysis {
  date: string;
  totalMeetingMinutes: number;
  eventCount: number;
  longestGapMinutes: number;
  isDense: boolean;
  pauseBlocksNeeded: number;
}

/**
 * Mock calendar service - generates sample events
 */
function generateMockCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();

  // Create dense schedule for the next 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    // Create 6-8 meetings per day (dense schedule)
    const meetingCount = 6 + Math.floor(Math.random() * 3);

    for (let i = 0; i < meetingCount; i++) {
      const startHour = 9 + i; // Start at 9am
      const start = new Date(date);
      start.setHours(startHour, 0, 0, 0);

      const duration = 60; // 1 hour meetings
      const end = new Date(start.getTime() + duration * 60000);

      events.push({
        id: `evt_${date.toISOString().split('T')[0]}_${i}`,
        title: `Meeting ${i + 1}`,
        start,
        end,
        duration,
      });
    }
  }

  return events;
}

/**
 * Analyze a single day for density
 */
function analyzeDayDensity(events: CalendarEvent[], date: Date): DenseDayAnalysis {
  const dateStr = date.toISOString().split('T')[0];

  // Filter events for this day
  const dayEvents = events.filter((e) => {
    const eventDate = e.start.toISOString().split('T')[0];
    return eventDate === dateStr;
  });

  // Calculate metrics
  const totalMeetingMinutes = dayEvents.reduce((sum, e) => sum + e.duration, 0);
  const eventCount = dayEvents.length;

  // Calculate gaps between events
  let longestGapMinutes = 0;
  const sortedEvents = dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = sortedEvents[i].end.getTime();
    const nextStart = sortedEvents[i + 1].start.getTime();
    const gapMinutes = (nextStart - currentEnd) / 60000;

    if (gapMinutes > longestGapMinutes) {
      longestGapMinutes = gapMinutes;
    }
  }

  // Define "dense" as >6 hours of meetings OR <30min longest gap
  const isDense = totalMeetingMinutes > 360 || (longestGapMinutes < 30 && eventCount > 0);

  // Calculate pause blocks needed (one per 2 hours of meetings)
  const pauseBlocksNeeded = Math.max(1, Math.floor(totalMeetingMinutes / 120));

  return {
    date: dateStr,
    totalMeetingMinutes,
    eventCount,
    longestGapMinutes,
    isDense,
    pauseBlocksNeeded,
  };
}

/**
 * Generate pause block suggestions for a dense day
 */
function generatePauseBlocks(events: CalendarEvent[], analysis: DenseDayAnalysis): PauseBlock[] {
  const blocks: PauseBlock[] = [];
  const dateStr = analysis.date;
  const date = new Date(dateStr);

  // Filter events for this day
  const dayEvents = events.filter((e) => {
    const eventDate = e.start.toISOString().split('T')[0];
    return eventDate === dateStr;
  });

  if (dayEvents.length === 0) {
    return blocks;
  }

  // Sort events
  const sortedEvents = dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find gaps and suggest pause blocks
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = sortedEvents[i].end;
    const nextStart = sortedEvents[i + 1].start;
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;

    // If gap is at least 30 minutes, suggest a 15-minute pause
    if (gapMinutes >= 30) {
      const pauseDuration = 15;
      const suggestedStart = new Date(currentEnd.getTime() + 5 * 60000); // 5 min buffer
      const suggestedEnd = new Date(suggestedStart.getTime() + pauseDuration * 60000);

      blocks.push({
        title: '🕯️ Pause Block',
        suggestedStart,
        suggestedEnd,
        duration: pauseDuration,
        reason: `Gap between "${sortedEvents[i].title}" and "${sortedEvents[i + 1].title}"`,
        dayDate: dateStr,
      });

      if (blocks.length >= analysis.pauseBlocksNeeded) {
        break;
      }
    }
  }

  // If no gaps found, suggest end-of-day pause
  if (blocks.length === 0 && analysis.pauseBlocksNeeded > 0) {
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const suggestedStart = new Date(lastEvent.end.getTime() + 5 * 60000);
    const suggestedEnd = new Date(suggestedStart.getTime() + 20 * 60000);

    blocks.push({
      title: '🕯️ Pause Block (End of Day)',
      suggestedStart,
      suggestedEnd,
      duration: 20,
      reason: 'Recovery after dense day',
      dayDate: dateStr,
    });
  }

  return blocks;
}

/**
 * Run Rhythm Agent
 */
export async function runRhythmAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  console.info(`[RhythmAgent] Starting Rest & Rhythm Planner for ${ctx.userId}`);

  try {
    // Check if Google Calendar is configured
    const calendarConfigured = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!calendarConfigured) {
      errors.push('Google Calendar not configured - using mock data');
      console.warn('[RhythmAgent] Google Calendar not configured, using mock data');
    }

    // Get calendar events (mock for now)
    console.info('[RhythmAgent] Fetching calendar events for next 14 days...');
    const events = generateMockCalendarEvents();

    console.info(`[RhythmAgent] Retrieved ${events.length} events`);

    // Analyze next 14 days
    const today = new Date();
    const analyses: DenseDayAnalysis[] = [];
    const allPauseBlocks: PauseBlock[] = [];

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      const analysis = analyzeDayDensity(events, date);
      analyses.push(analysis);

      if (analysis.isDense) {
        const pauseBlocks = generatePauseBlocks(events, analysis);
        allPauseBlocks.push(...pauseBlocks);
        console.info(
          `[RhythmAgent] Dense day detected: ${analysis.date} - suggesting ${pauseBlocks.length} pause blocks`
        );
      }
    }

    const denseDayCount = analyses.filter((a) => a.isDense).length;

    console.info(`[RhythmAgent] Analysis complete: ${denseDayCount} dense days, ${allPauseBlocks.length} pause blocks suggested`);

    // TODO: Write pause blocks to Google Calendar if configured
    // For now, just return as suggestions

    const completedAt = new Date().toISOString();

    return {
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      artifacts: {
        daysAnalyzed: analyses.length,
        denseDays: denseDayCount,
        pauseBlocksSuggested: allPauseBlocks.length,
        calendarConfigured,
        denseDayDetails: analyses
          .filter((a) => a.isDense)
          .map((a) => ({
            date: a.date,
            eventCount: a.eventCount,
            totalHours: Math.round(a.totalMeetingMinutes / 60),
          })),
        pauseBlocks: allPauseBlocks.map((pb) => ({
          date: pb.dayDate,
          time: pb.suggestedStart.toTimeString().substring(0, 5),
          duration: pb.duration,
          reason: pb.reason,
        })),
      },
      startedAt,
      completedAt,
      retries: 0,
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    console.error(`[RhythmAgent] Error: ${error.message}`);

    return {
      success: false,
      errors: [error.message],
      startedAt,
      completedAt,
      retries: 0,
    };
  }
}
