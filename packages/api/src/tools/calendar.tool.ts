/**
 * CalendarTool - P1 Integration
 * Provides schedule/reschedule actions for P1 agents
 *
 * Input/Output Contract:
 * - schedule: { summary, startTime, endTime, description?, attendees?, location? }
 * - reschedule: { eventId, startTime?, endTime?, summary?, description? }
 *
 * Returns: { success, data, error }
 */

import { ToolRequest, ToolResult } from './tool.types';
import { calendarService } from '../services/calendar.service';
import type { CalendarEventInput } from '../types/calendar.types';

const logger = console;

export async function handleCalendarSchedule(req: ToolRequest): Promise<ToolResult> {
  const { summary, startTime, endTime, description, attendees, location, timeZone } = req.input || {};

  // Validate required fields
  if (!summary || !startTime || !endTime) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Missing required fields: summary, startTime, endTime',
        details: req.input,
      },
    };
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const eventInput: CalendarEventInput = {
      summary,
      startTime,
      endTime,
      description,
      attendees,
      location,
      timeZone,
    };

    const result = await calendarService.insertEvent(calendarId, eventInput);

    logger.info('[CalendarTool] Event scheduled', {
      eventId: result.eventId,
      summary: result.event.summary,
      start: result.event.start,
    });

    return {
      ok: true,
      output: {
        success: true,
        data: {
          eventId: result.eventId,
          htmlLink: result.htmlLink,
          event: result.event,
        },
      },
    };
  } catch (err: any) {
    logger.error('[CalendarTool] Schedule failed', { error: err.message });
    return {
      ok: false,
      error: {
        code: 'TOOL_ERROR',
        message: err.message || 'Failed to schedule event',
        details: err,
      },
    };
  }
}

export async function handleCalendarReschedule(req: ToolRequest): Promise<ToolResult> {
  const { eventId, startTime, endTime, summary, description } = req.input || {};

  // Validate required fields
  if (!eventId) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Missing required field: eventId',
        details: req.input,
      },
    };
  }

  // At least one update field required
  if (!startTime && !endTime && !summary && !description) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'At least one update field required: startTime, endTime, summary, description',
        details: req.input,
      },
    };
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const eventInput: Partial<CalendarEventInput> = {};
    if (summary) eventInput.summary = summary;
    if (description) eventInput.description = description;
    if (startTime) eventInput.startTime = startTime;
    if (endTime) eventInput.endTime = endTime;

    const result = await calendarService.updateEvent(calendarId, eventId, eventInput);

    logger.info('[CalendarTool] Event rescheduled', {
      eventId,
      updates: Object.keys(eventInput),
    });

    return {
      ok: true,
      output: {
        success: true,
        data: {
          eventId,
          event: result.event,
        },
      },
    };
  } catch (err: any) {
    logger.error('[CalendarTool] Reschedule failed', { error: err.message, eventId });
    return {
      ok: false,
      error: {
        code: 'TOOL_ERROR',
        message: err.message || 'Failed to reschedule event',
        details: err,
      },
    };
  }
}
