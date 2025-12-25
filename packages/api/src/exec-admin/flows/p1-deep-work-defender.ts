import { calendarService, CalendarEvent } from '../../services/calendar.service';

export interface DeepWorkDefenderInput {
  userId: string;
  mode?: 'offline' | 'live';
  horizonDays?: number;
  targetFocusMinutes?: number;
  workdayStart?: string;
  workdayEnd?: string;
}

export interface DeepWorkDefenderOutput {
  userId: string;
  mode: 'offline' | 'live';
  horizonDays: number;
  targetFocusMinutes: number;
  workdayStart: string;
  workdayEnd: string;
  meetingLoad: {
    totalMeetings: number;
    meetingMinutes: number;
  };
  suggestedFocusBlocks: Array<{
    start: string;
    end: string;
    minutes: number;
    reason: string;
  }>;
  conflicts: Array<{
    date: string;
    reason: string;
  }>;
  recommendations: string[];
  offline: boolean;
  generatedAt: string;
}

const DEFAULT_HORIZON_DAYS = 7;
const DEFAULT_TARGET_FOCUS_MINUTES = 180;
const DEFAULT_WORKDAY_START = '09:00';
const DEFAULT_WORKDAY_END = '17:00';
const DEFAULT_BLOCK_MINUTES = 90;

export async function runP1DeepWorkDefender(
  input: DeepWorkDefenderInput
): Promise<{ runId: string; data: DeepWorkDefenderOutput }> {
  if (!input?.userId) {
    throw new Error('userId is required');
  }

  const runId = `deepwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const horizonDays = typeof input.horizonDays === 'number' && input.horizonDays > 0
    ? input.horizonDays
    : DEFAULT_HORIZON_DAYS;
  const targetFocusMinutes = typeof input.targetFocusMinutes === 'number' && input.targetFocusMinutes > 0
    ? input.targetFocusMinutes
    : DEFAULT_TARGET_FOCUS_MINUTES;
  const workdayStart = input.workdayStart || DEFAULT_WORKDAY_START;
  const workdayEnd = input.workdayEnd || DEFAULT_WORKDAY_END;

  const now = new Date();
  const endDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  let offline = input.mode === 'offline' || !calendarService.isInitialized();
  let events: CalendarEvent[] = [];

  if (!offline) {
    try {
      events = await calendarService.listUpcomingEvents({
        calendarId,
        timeMin: now,
        timeMax: endDate,
        maxResults: 200,
      });
    } catch (error) {
      console.warn('[P1 Deep Work Defender] Calendar error, switching to offline mode:', error);
      offline = true;
    }
  }

  if (offline) {
    const output = buildOfflineOutput({
      userId: input.userId,
      horizonDays,
      targetFocusMinutes,
      workdayStart,
      workdayEnd,
    });
    return { runId, data: output };
  }

  const meetingMinutes = sumMeetingMinutes(events);
  const meetingLoad = {
    totalMeetings: events.length,
    meetingMinutes,
  };

  const suggestedFocusBlocks = await buildFocusBlocks({
    calendarId,
    windowStart: now,
    windowEnd: endDate,
    targetFocusMinutes,
    workdayStart,
  });

  const conflicts = buildConflicts({
    events,
    workdayStart,
    workdayEnd,
    targetFocusMinutes,
  });

  const recommendations = buildRecommendations({
    meetingLoad,
    suggestedFocusBlocks,
    horizonDays,
  });

  const output: DeepWorkDefenderOutput = {
    userId: input.userId,
    mode: offline ? 'offline' : 'live',
    horizonDays,
    targetFocusMinutes,
    workdayStart,
    workdayEnd,
    meetingLoad,
    suggestedFocusBlocks,
    conflicts,
    recommendations,
    offline,
    generatedAt: new Date().toISOString(),
  };

  console.log('[P1 Deep Work Defender] Complete', { runId, offline, focusBlocks: suggestedFocusBlocks.length });

  return { runId, data: output };
}

function sumMeetingMinutes(events: CalendarEvent[]): number {
  return events.reduce((total, event) => {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return total + Math.round((end - start) / 60000);
    }
    return total;
  }, 0);
}

async function buildFocusBlocks(input: {
  calendarId: string;
  windowStart: Date;
  windowEnd: Date;
  targetFocusMinutes: number;
  workdayStart: string;
}): Promise<DeepWorkDefenderOutput['suggestedFocusBlocks']> {
  const blockMinutes = DEFAULT_BLOCK_MINUTES;
  const neededBlocks = Math.max(1, Math.ceil(input.targetFocusMinutes / blockMinutes));

  const slots = await calendarService.findAvailableSlots(
    input.calendarId,
    input.windowStart,
    input.windowEnd,
    blockMinutes,
    { bufferMinutes: 0 }
  );

  const selected = slots.slice(0, neededBlocks);
  if (selected.length === 0) {
    return buildFallbackBlocks(input.windowStart, neededBlocks, blockMinutes, input.workdayStart);
  }

  return selected.map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    minutes: blockMinutes,
    reason: 'Available focus window',
  }));
}

function buildConflicts(input: {
  events: CalendarEvent[];
  workdayStart: string;
  workdayEnd: string;
  targetFocusMinutes: number;
}): DeepWorkDefenderOutput['conflicts'] {
  const perDay: Record<string, number> = {};
  input.events.forEach((event) => {
    const dateKey = toDateKey(event.start);
    perDay[dateKey] = (perDay[dateKey] || 0) + minutesBetween(event.start, event.end);
  });

  const workdayMinutes = minutesBetweenTimes(input.workdayStart, input.workdayEnd);
  const maxMeetingMinutes = Math.max(0, workdayMinutes - input.targetFocusMinutes);

  return Object.entries(perDay)
    .filter(([, minutes]) => minutes > maxMeetingMinutes)
    .map(([date, minutes]) => ({
      date,
      reason: `Overbooked with ${minutes} meeting minutes`,
    }));
}

function buildRecommendations(input: {
  meetingLoad: { totalMeetings: number; meetingMinutes: number };
  suggestedFocusBlocks: DeepWorkDefenderOutput['suggestedFocusBlocks'];
  horizonDays: number;
}): string[] {
  const recommendations: string[] = [];
  const avgMeetingMinutes = input.meetingLoad.meetingMinutes / Math.max(1, input.horizonDays);

  if (avgMeetingMinutes > 240) {
    recommendations.push('Decline low-value meetings to reclaim focus time.');
  }
  if (input.suggestedFocusBlocks.length === 0) {
    recommendations.push('Protect at least one focus block per day.');
  } else {
    recommendations.push('Protect the suggested focus blocks on your calendar.');
  }
  if (input.meetingLoad.totalMeetings > input.horizonDays * 4) {
    recommendations.push('Batch meetings into fewer days to reduce fragmentation.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep your calendar balanced and avoid overbooking.');
  }

  return recommendations;
}

function buildFallbackBlocks(
  startDate: Date,
  count: number,
  minutes: number,
  workdayStart: string
): DeepWorkDefenderOutput['suggestedFocusBlocks'] {
  const blocks: DeepWorkDefenderOutput['suggestedFocusBlocks'] = [];
  let dayOffset = 1;

  while (blocks.length < count && dayOffset <= 14) {
    const day = addDays(startDate, dayOffset);
    const start = dateAtTime(day, workdayStart);
    const end = addMinutes(start, minutes);
    blocks.push({
      start: start.toISOString(),
      end: end.toISOString(),
      minutes,
      reason: 'Fallback focus block',
    });
    dayOffset += 1;
  }

  return blocks;
}

function buildOfflineOutput(input: {
  userId: string;
  horizonDays: number;
  targetFocusMinutes: number;
  workdayStart: string;
  workdayEnd: string;
}): DeepWorkDefenderOutput {
  const blocksNeeded = Math.max(1, Math.ceil(input.targetFocusMinutes / DEFAULT_BLOCK_MINUTES));
  const focusBlocks = buildFallbackBlocks(new Date(), blocksNeeded, DEFAULT_BLOCK_MINUTES, input.workdayStart);

  const output: DeepWorkDefenderOutput = {
    userId: input.userId,
    mode: 'offline',
    horizonDays: input.horizonDays,
    targetFocusMinutes: input.targetFocusMinutes,
    workdayStart: input.workdayStart,
    workdayEnd: input.workdayEnd,
    meetingLoad: {
      totalMeetings: 6,
      meetingMinutes: 240,
    },
    suggestedFocusBlocks: focusBlocks,
    conflicts: focusBlocks.length
      ? [{ date: toDateKey(focusBlocks[0].start), reason: 'High meeting density day' }]
      : [],
    recommendations: [
      'Move low-value meetings to free deep work time.',
      'Protect at least one 90-minute focus block daily.',
      'Batch meetings to reduce context switching.',
    ],
    offline: true,
    generatedAt: new Date().toISOString(),
  };

  return output;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function dateAtTime(date: Date, time: string): Date {
  const { hours, minutes } = parseTime(time);
  const next = new Date(date.getTime());
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function parseTime(value: string): { hours: number; minutes: number } {
  const parts = value.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { hours: 9, minutes: 0 };
  }
  return { hours, minutes };
}

function minutesBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0;
  return Math.round((endMs - startMs) / 60000);
}

function minutesBetweenTimes(start: string, end: string): number {
  const startParts = parseTime(start);
  const endParts = parseTime(end);
  return Math.max(0, (endParts.hours * 60 + endParts.minutes) - (startParts.hours * 60 + startParts.minutes));
}

function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return 'unknown';
  return date.toISOString().split('T')[0];
}
