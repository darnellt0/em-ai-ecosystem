/**
 * Google Calendar Service - Phase 2B Integration
 * Handles real Google Calendar API calls for calendar operations
 *
 * @module CalendarService
 * @description
 * A service wrapper for Google Calendar API that provides:
 * - listUpcomingEvents: Fetch and normalize upcoming events
 * - insertEvent: Create new calendar events
 * - deleteEvent: Remove calendar events
 * - updateEvent: Modify existing events
 * - checkConflicts: Detect scheduling conflicts
 *
 * @example
 * ```typescript
 * import { calendarService } from './services/calendar.service';
 *
 * // List upcoming events
 * const events = await calendarService.listUpcomingEvents({
 *   maxResults: 5,
 *   calendarId: 'primary'
 * });
 *
 * // Create an event
 * const result = await calendarService.insertEvent('primary', {
 *   summary: 'Team Meeting',
 *   startTime: new Date(),
 *   endTime: new Date(Date.now() + 60 * 60 * 1000),
 * });
 *
 * // Delete an event
 * const deleted = await calendarService.deleteEvent('primary', result.eventId);
 * ```
 */

import { google, calendar_v3 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import {
  CalendarEvent,
  CalendarEventInput,
  CalendarError,
  CalendarErrorCode,
  CreateEventResult,
  DeleteEventResult,
  ListEventsOptions,
} from '../types/calendar.types';

// Re-export types for convenience
export type {
  CalendarEvent,
  CalendarEventInput,
  CreateEventResult,
  DeleteEventResult,
  ListEventsOptions,
};
export { CalendarError };

/**
 * Legacy interface for backwards compatibility
 * @deprecated Use CalendarEventInput instead
 */
interface LegacyCalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  transparency?: string;
}

const DEFAULT_TIMEZONE = 'America/Los_Angeles';
const DEFAULT_MAX_RESULTS = 10;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class CalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private logger = console;
  private credentialsPath: string;

  constructor() {
    this.credentialsPath = path.join(__dirname, '../../config/google-credentials.json');
    try {
      this.initializeCalendarClient();
    } catch (error) {
      this.logger.warn('[Calendar Service] Failed to initialize Google Calendar client:', error);
      this.calendar = null;
    }
  }

  private initializeCalendarClient(): void {
    if (!fs.existsSync(this.credentialsPath)) {
      this.logger.warn(`[Calendar Service] Credentials file not found at ${this.credentialsPath}`);
      this.logger.info('[Calendar Service] Using mock calendar responses');
      return;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: this.credentialsPath,
      scopes: SCOPES,
    });

    this.calendar = google.calendar({ version: 'v3', auth });
    this.logger.info('[Calendar Service] Google Calendar client initialized successfully');
  }

  /**
   * Get the default calendar ID from environment or use 'primary'
   */
  private getDefaultCalendarId(): string {
    return process.env.GOOGLE_CALENDAR_ID || 'primary';
  }

  /**
   * Convert Google Calendar event to normalized CalendarEvent
   */
  private normalizeEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    const isAllDay = !event.start?.dateTime;
    const start = event.start?.dateTime || event.start?.date || '';
    const end = event.end?.dateTime || event.end?.date || '';

    return {
      id: event.id || '',
      summary: event.summary || '(No title)',
      description: event.description || null,
      start,
      end,
      timeZone: event.start?.timeZone || DEFAULT_TIMEZONE,
      isAllDay,
      status: (event.status as CalendarEvent['status']) || 'confirmed',
      htmlLink: event.htmlLink || '',
      attendees: (event.attendees || []).map(a => a.email || '').filter(Boolean),
      location: event.location || null,
      created: event.created || null,
      updated: event.updated || null,
    };
  }

  /**
   * Convert CalendarEventInput to Google Calendar event format
   */
  private toGoogleEvent(input: CalendarEventInput): calendar_v3.Schema$Event {
    const timeZone = input.timeZone || DEFAULT_TIMEZONE;
    const startTime = input.startTime instanceof Date ? input.startTime.toISOString() : input.startTime;
    const endTime = input.endTime instanceof Date ? input.endTime.toISOString() : input.endTime;

    return {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startTime, timeZone },
      end: { dateTime: endTime, timeZone },
      attendees: input.attendees?.map(email => ({ email })),
      transparency: input.transparency || 'opaque',
      location: input.location,
    };
  }

  /**
   * Map Google API errors to CalendarError
   */
  private handleApiError(error: any, context: string): never {
    const message = error.message || 'Unknown error';
    let code: CalendarErrorCode = 'API_ERROR';

    if (error.code === 404) {
      code = 'EVENT_NOT_FOUND';
    } else if (error.code === 403) {
      code = 'ACCESS_DENIED';
    } else if (error.code === 429) {
      code = 'RATE_LIMITED';
    } else if (error.code === 401) {
      code = 'INVALID_CREDENTIALS';
    }

    this.logger.error(`[Calendar Service] ${context}:`, error);
    throw new CalendarError(`${context}: ${message}`, code, error);
  }

  // ============================================================================
  // PRIMARY API METHODS (Phase 2B Issue 2)
  // ============================================================================

  /**
   * List upcoming calendar events with normalized output
   *
   * @param options - Query options
   * @returns Array of normalized CalendarEvent objects
   *
   * @example
   * ```typescript
   * // Get next 5 events
   * const events = await calendarService.listUpcomingEvents({ maxResults: 5 });
   *
   * // Get events for a specific calendar
   * const events = await calendarService.listUpcomingEvents({
   *   calendarId: 'team@company.com',
   *   maxResults: 10,
   *   timeMax: new Date('2025-12-31'),
   * });
   * ```
   */
  async listUpcomingEvents(options: ListEventsOptions = {}): Promise<CalendarEvent[]> {
    const calendarId = options.calendarId || this.getDefaultCalendarId();
    const maxResults = options.maxResults || DEFAULT_MAX_RESULTS;
    const timeMin = options.timeMin || new Date();
    const timeMax = options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return [];
    }

    try {
      this.logger.info(
        `[Calendar Service] Listing upcoming events for ${calendarId} (max: ${maxResults})`
      );

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
        q: options.query,
      });

      const events = (response.data.items || []).map(event => this.normalizeEvent(event));
      this.logger.info(`[Calendar Service] Retrieved ${events.length} events`);

      return events;
    } catch (error) {
      this.handleApiError(error, 'List upcoming events failed');
    }
  }

  /**
   * Insert a new calendar event
   *
   * @param calendarId - Calendar ID to insert into
   * @param eventInput - Event data
   * @returns Result with event ID and normalized event
   *
   * @example
   * ```typescript
   * const result = await calendarService.insertEvent('primary', {
   *   summary: 'Project Review',
   *   description: 'Weekly project status review',
   *   startTime: new Date('2025-12-10T14:00:00'),
   *   endTime: new Date('2025-12-10T15:00:00'),
   *   attendees: ['team@company.com'],
   * });
   *
   * console.log(`Created event: ${result.eventId}`);
   * console.log(`Link: ${result.htmlLink}`);
   * ```
   */
  async insertEvent(
    calendarId: string,
    eventInput: CalendarEventInput
  ): Promise<CreateEventResult> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      const mockId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        success: true,
        eventId: mockId,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${mockId}`,
        event: {
          id: mockId,
          summary: eventInput.summary,
          description: eventInput.description || null,
          start: eventInput.startTime instanceof Date ? eventInput.startTime.toISOString() : eventInput.startTime,
          end: eventInput.endTime instanceof Date ? eventInput.endTime.toISOString() : eventInput.endTime,
          timeZone: eventInput.timeZone || DEFAULT_TIMEZONE,
          isAllDay: false,
          status: 'confirmed',
          htmlLink: `https://calendar.google.com/calendar/r/eventedit/${mockId}`,
          attendees: eventInput.attendees || [],
          location: eventInput.location || null,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
      };
    }

    try {
      this.logger.info(`[Calendar Service] Creating event: ${eventInput.summary} for ${calendarId}`);

      const googleEvent = this.toGoogleEvent(eventInput);
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });

      if (!response.data.id) {
        throw new CalendarError('Invalid response from Google Calendar API', 'API_ERROR');
      }

      const normalizedEvent = this.normalizeEvent(response.data);
      this.logger.info(`[Calendar Service] Event created with ID: ${response.data.id}`);

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink || '',
        event: normalizedEvent,
      };
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      this.handleApiError(error, 'Insert event failed');
    }
  }

  /**
   * Delete a calendar event
   *
   * @param calendarId - Calendar ID containing the event
   * @param eventId - Event ID to delete
   * @returns Result indicating success or failure
   *
   * @example
   * ```typescript
   * const result = await calendarService.deleteEvent('primary', 'abc123xyz');
   * if (result.success) {
   *   console.log('Event deleted successfully');
   * }
   * ```
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<DeleteEventResult> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return { success: true, eventId };
    }

    try {
      this.logger.info(`[Calendar Service] Deleting event ${eventId} from ${calendarId}`);

      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      this.logger.info(`[Calendar Service] Event deleted: ${eventId}`);
      return { success: true, eventId };
    } catch (error: any) {
      // If event not found, consider it deleted
      if (error.code === 404 || error.code === 410) {
        this.logger.warn(`[Calendar Service] Event ${eventId} not found (already deleted?)`);
        return { success: true, eventId };
      }
      this.logger.error('[Calendar Service] Delete event error:', error);
      return {
        success: false,
        eventId,
        error: error.message || 'Failed to delete event',
      };
    }
  }

  // ============================================================================
  // ADDITIONAL UTILITY METHODS
  // ============================================================================

  /**
   * Get a single event by ID
   */
  async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    if (!this.calendar) {
      throw new CalendarError('Calendar service not initialized', 'NOT_INITIALIZED');
    }

    try {
      this.logger.info(`[Calendar Service] Fetching event ${eventId}`);

      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      return this.normalizeEvent(response.data);
    } catch (error) {
      this.handleApiError(error, 'Get event failed');
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    eventInput: Partial<CalendarEventInput>
  ): Promise<CreateEventResult> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return {
        success: true,
        eventId,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${eventId}`,
        event: {
          id: eventId,
          summary: eventInput.summary || '',
          description: eventInput.description || null,
          start: '',
          end: '',
          timeZone: eventInput.timeZone || DEFAULT_TIMEZONE,
          isAllDay: false,
          status: 'confirmed',
          htmlLink: `https://calendar.google.com/calendar/r/eventedit/${eventId}`,
          attendees: eventInput.attendees || [],
          location: eventInput.location || null,
          created: null,
          updated: new Date().toISOString(),
        },
      };
    }

    try {
      this.logger.info(`[Calendar Service] Updating event ${eventId}`);

      // Build partial update
      const updateData: calendar_v3.Schema$Event = {};
      if (eventInput.summary) updateData.summary = eventInput.summary;
      if (eventInput.description) updateData.description = eventInput.description;
      if (eventInput.location) updateData.location = eventInput.location;
      if (eventInput.startTime) {
        const startTime = eventInput.startTime instanceof Date ? eventInput.startTime.toISOString() : eventInput.startTime;
        updateData.start = { dateTime: startTime, timeZone: eventInput.timeZone || DEFAULT_TIMEZONE };
      }
      if (eventInput.endTime) {
        const endTime = eventInput.endTime instanceof Date ? eventInput.endTime.toISOString() : eventInput.endTime;
        updateData.end = { dateTime: endTime, timeZone: eventInput.timeZone || DEFAULT_TIMEZONE };
      }
      if (eventInput.attendees) {
        updateData.attendees = eventInput.attendees.map(email => ({ email }));
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        requestBody: updateData,
      });

      if (!response.data.id) {
        throw new CalendarError('Invalid response from Google Calendar API', 'API_ERROR');
      }

      const normalizedEvent = this.normalizeEvent(response.data);
      this.logger.info(`[Calendar Service] Event updated: ${response.data.id}`);

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink || '',
        event: normalizedEvent,
      };
    } catch (error) {
      if (error instanceof CalendarError) throw error;
      this.handleApiError(error, 'Update event failed');
    }
  }

  /**
   * List events in a time range (legacy method, kept for backwards compatibility)
   */
  async listEvents(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<calendar_v3.Schema$Event[]> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return [];
    }

    try {
      this.logger.info(
        `[Calendar Service] Listing events from ${startTime.toISOString()} to ${endTime.toISOString()}`
      );

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error('[Calendar Service] List events error:', error);
      throw error;
    }
  }

  /**
   * Check for conflicts in a time range
   */
  async checkConflicts(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<string[]> {
    try {
      const events = await this.listEvents(calendarId, startTime, endTime);
      const conflicts = events
        .filter(event => event.summary)
        .map(event => event.summary as string);

      if (conflicts.length > 0) {
        this.logger.info(`[Calendar Service] Found ${conflicts.length} conflicts: ${conflicts.join(', ')}`);
      }

      return conflicts;
    } catch (error) {
      this.logger.error('[Calendar Service] Check conflicts error:', error);
      return [];
    }
  }

  /**
   * Get free/busy information for a time range
   */
  async getFreeBusy(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ busy: boolean; reason?: string }> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return { busy: false };
    }

    try {
      this.logger.info(`[Calendar Service] Checking free/busy status`);

      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const busyPeriods = response.data.calendars?.[calendarId]?.busy || [];

      if (busyPeriods.length > 0) {
        return {
          busy: true,
          reason: `Calendar is busy during requested time`,
        };
      }

      return { busy: false };
    } catch (error) {
      this.logger.error('[Calendar Service] Free/busy check error:', error);
      return { busy: false };
    }
  }

  /**
   * Create a calendar event (legacy method, kept for backwards compatibility)
   * @deprecated Use insertEvent instead
   */
  async createEvent(
    calendarId: string,
    event: LegacyCalendarEvent
  ): Promise<{ id: string; htmlLink: string }> {
    if (!this.calendar) {
      this.logger.warn('[Calendar Service] Using mock response - Calendar not initialized');
      return {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${Date.now()}`,
      };
    }

    try {
      this.logger.info(`[Calendar Service] Creating event: ${event.summary} for ${calendarId}`);

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          ...event,
          transparency: event.transparency || 'opaque',
        },
      });

      if (!response.data.id || !response.data.htmlLink) {
        throw new Error('Invalid response from Google Calendar API');
      }

      this.logger.info(`[Calendar Service] Event created with ID: ${response.data.id}`);

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      this.logger.error('[Calendar Service] Create event error:', error);
      throw error;
    }
  }

  /**
   * Is the calendar service initialized with real credentials?
   */
  isInitialized(): boolean {
    return this.calendar !== null;
  }

  /**
   * Get calendar status
   */
  getStatus(): {
    initialized: boolean;
    credentialsPath: string;
    defaultCalendarId: string;
    warning?: string;
  } {
    return {
      initialized: this.isInitialized(),
      credentialsPath: this.credentialsPath,
      defaultCalendarId: this.getDefaultCalendarId(),
      warning: !this.isInitialized()
        ? 'Calendar service using mock responses. Place Google credentials.json in config/ directory for real integration.'
        : undefined,
    };
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
