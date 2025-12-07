/**
 * Calendar Types - Phase 2B Integration
 * Normalized types for Google Calendar operations
 */

/**
 * Input type for creating/updating calendar events
 */
export interface CalendarEventInput {
  /** Event title/summary */
  summary: string;
  /** Optional description */
  description?: string;
  /** Start time as ISO string or Date */
  startTime: Date | string;
  /** End time as ISO string or Date */
  endTime: Date | string;
  /** Timezone (defaults to America/Los_Angeles) */
  timeZone?: string;
  /** Optional attendee emails */
  attendees?: string[];
  /** Event visibility: 'transparent' for free, 'opaque' for busy */
  transparency?: 'transparent' | 'opaque';
  /** Optional location */
  location?: string;
}

/**
 * Normalized output type for calendar events
 * Simplifies Google's complex event schema
 */
export interface CalendarEvent {
  /** Google Calendar event ID */
  id: string;
  /** Event title/summary */
  summary: string;
  /** Event description */
  description: string | null;
  /** Start time as ISO string */
  start: string;
  /** End time as ISO string */
  end: string;
  /** Timezone */
  timeZone: string;
  /** Whether this is an all-day event */
  isAllDay: boolean;
  /** Event status */
  status: 'confirmed' | 'tentative' | 'cancelled';
  /** Link to event in Google Calendar */
  htmlLink: string;
  /** Attendee emails */
  attendees: string[];
  /** Location if specified */
  location: string | null;
  /** When the event was created */
  created: string | null;
  /** When the event was last updated */
  updated: string | null;
}

/**
 * Options for listing upcoming events
 */
export interface ListEventsOptions {
  /** Calendar ID (defaults to env GOOGLE_CALENDAR_ID or 'primary') */
  calendarId?: string;
  /** Maximum number of events to return (default: 10) */
  maxResults?: number;
  /** Start time for the query window (default: now) */
  timeMin?: Date;
  /** End time for the query window (default: 30 days from now) */
  timeMax?: Date;
  /** Filter by text in summary/description */
  query?: string;
}

/**
 * Result from creating an event
 */
export interface CreateEventResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The created event ID */
  eventId: string;
  /** Link to the event in Google Calendar */
  htmlLink: string;
  /** The normalized event object */
  event: CalendarEvent;
}

/**
 * Result from deleting an event
 */
export interface DeleteEventResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The deleted event ID */
  eventId: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Custom error class for calendar operations
 */
export class CalendarError extends Error {
  constructor(
    message: string,
    public readonly code: CalendarErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

/**
 * Error codes for calendar operations
 */
export type CalendarErrorCode =
  | 'NOT_INITIALIZED'
  | 'INVALID_CREDENTIALS'
  | 'CALENDAR_NOT_FOUND'
  | 'EVENT_NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'API_ERROR'
  | 'UNKNOWN';
