/**
 * P0 Calendar Optimizer Flow
 *
 * Per MAB v1.0 Section 4.3:
 * "Aligns schedule with energy & goals; auto-proposes blocks."
 *
 * This flow uses the existing CalendarService to:
 * 1. List upcoming events
 * 2. Find available focus blocks
 * 3. Check for conflicts
 * 4. Suggest optimal schedule adjustments
 */

import { calendarService } from '../../services/calendar.service';

export interface CalendarOptimizerInput {
  userId: string;
  calendarId?: string;  // Defaults to 'primary'
  lookAheadDays?: number;  // Defaults to 7
  preferredFocusHours?: number[];  // e.g., [9, 10, 14, 15] for 9-11am, 2-4pm
  focusBlockDuration?: number;  // Minutes, defaults to 90
}

export interface CalendarOptimizerOutput {
  userId: string;
  calendarId: string;
  analyzedPeriod: {
    start: string;
    end: string;
  };
  currentLoad: {
    totalEvents: number;
    meetingHours: number;
    focusBlocksFound: number;
  };
  suggestedBlocks: Array<{
    start: string;
    end: string;
    type: 'deep_focus' | 'admin' | 'buffer';
    reason: string;
  }>;
  conflicts: Array<{
    existingEvent: string;
    conflictType: string;
  }>;
  recommendations: string[];
  optimizationScore: number;  // 0-100
}

export async function runP0CalendarOptimizer(
  input: CalendarOptimizerInput
): Promise<{ runId: string; data: CalendarOptimizerOutput }> {
  const runId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const calendarId = input.calendarId || 'primary';
  const lookAheadDays = input.lookAheadDays || 7;
  const focusBlockDuration = input.focusBlockDuration || 90;

  console.log(`[P0 Calendar Optimizer] Starting run ${runId} for ${input.userId}`);

  // Check if calendar service is initialized
  const status = calendarService.getStatus();
  if (!status.initialized) {
    console.warn('[P0 Calendar Optimizer] Calendar service not initialized - using analysis mode');
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + lookAheadDays * 24 * 60 * 60 * 1000);

  // Get upcoming events
  let events: any[] = [];
  try {
    events = await calendarService.listUpcomingEvents({
      calendarId,
      maxResults: 50,
      timeMin: now,
      timeMax: endDate,
    });
  } catch (error) {
    console.warn('[P0 Calendar Optimizer] Could not fetch events:', error);
  }

  // Calculate current load
  const meetingHours = events.reduce((total, event) => {
    if (event.start && event.end) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return total;
  }, 0);

  // Find available slots for focus blocks
  let availableSlots: any[] = [];
  try {
    availableSlots = await calendarService.findAvailableSlots(
      calendarId,
      now, endDate,
      focusBlockDuration,
      { bufferMinutes: 0 }
    );
  } catch (error) {
    console.warn('[P0 Calendar Optimizer] Could not find available slots:', error);
  }

  // Generate suggested blocks from available slots
  const suggestedBlocks = availableSlots.slice(0, 5).map((slot, index) => ({
    start: slot.start,
    end: slot.end,
    type: index < 2 ? 'deep_focus' : 'admin' as 'deep_focus' | 'admin' | 'buffer',
    reason: index < 2
      ? 'Prime focus time - schedule deep work here'
      : 'Available for admin tasks or meetings',
  }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (meetingHours > 20) {
    recommendations.push('High meeting load detected. Consider declining non-essential meetings.');
  }

  if (suggestedBlocks.length < 3) {
    recommendations.push('Limited focus time available. Protect existing open blocks.');
  }

  if (events.length > 30) {
    recommendations.push('Busy week ahead. Prioritize ruthlessly.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Calendar looks balanced. Maintain current rhythm.');
  }

  // Calculate optimization score
  const focusBlockRatio = suggestedBlocks.filter(b => b.type === 'deep_focus').length / Math.max(lookAheadDays, 1);
  const meetingLoadScore = Math.max(0, 100 - (meetingHours / lookAheadDays) * 10);
  const optimizationScore = Math.round((focusBlockRatio * 50 + meetingLoadScore) / 1.5);

  const output: CalendarOptimizerOutput = {
    userId: input.userId,
    calendarId,
    analyzedPeriod: {
      start: now.toISOString(),
      end: endDate.toISOString(),
    },
    currentLoad: {
      totalEvents: events.length,
      meetingHours: Math.round(meetingHours * 10) / 10,
      focusBlocksFound: suggestedBlocks.filter(b => b.type === 'deep_focus').length,
    },
    suggestedBlocks,
    conflicts: [],  // Would be populated if proposing new events
    recommendations,
    optimizationScore,
  };

  console.log(`[P0 Calendar Optimizer] Complete: ${runId}`, {
    events: events.length,
    suggestedBlocks: suggestedBlocks.length,
    score: optimizationScore,
  });

  return { runId, data: output };
}
