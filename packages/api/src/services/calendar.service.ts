/**
 * Google Calendar Service - Phase 2B Integration
 * Handles real Google Calendar API calls for calendar operations
 */

import { google, calendar_v3 } from "googleapis";
import * as path from "path";
import * as fs from "fs";

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  transparency?: string; // 'transparent' for free time, 'opaque' for busy
}

export class CalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private logger = console;

  constructor() {
    try {
      this.initializeCalendarClient();
    } catch (error) {
      this.logger.warn(
        "[Calendar Service] Failed to initialize Google Calendar client:",
        error,
      );
      this.calendar = null;
    }
  }

  private initializeCalendarClient(): void {
    // Check if credentials file exists
    const credentialsPath = path.join(
      __dirname,
      "../../config/google-credentials.json",
    );

    if (!fs.existsSync(credentialsPath)) {
      this.logger.warn(
        `[Calendar Service] Credentials file not found at ${credentialsPath}`,
      );
      this.logger.info("[Calendar Service] Using mock calendar responses");
      return;
    }

    const SCOPES = ["https://www.googleapis.com/auth/calendar"];
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });

    this.calendar = google.calendar({ version: "v3", auth });
    this.logger.info(
      "[Calendar Service] Google Calendar client initialized successfully",
    );
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    calendarId: string,
    event: CalendarEvent,
  ): Promise<{ id: string; htmlLink: string }> {
    if (!this.calendar) {
      // Return mock response if calendar not initialized
      this.logger.warn(
        "[Calendar Service] Using mock response - Calendar not initialized",
      );
      return {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${Date.now()}`,
      };
    }

    try {
      this.logger.info(
        `[Calendar Service] Creating event: ${event.summary} for ${calendarId}`,
      );

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          ...event,
          transparency: event.transparency || "opaque",
        },
      });

      if (!response.data.id || !response.data.htmlLink) {
        throw new Error("Invalid response from Google Calendar API");
      }

      this.logger.info(
        `[Calendar Service] Event created with ID: ${response.data.id}`,
      );

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      this.logger.error("[Calendar Service] Create event error:", error);
      throw error;
    }
  }

  /**
   * Get a calendar event
   */
  async getEvent(
    calendarId: string,
    eventId: string,
  ): Promise<calendar_v3.Schema$Event> {
    if (!this.calendar) {
      throw new Error("Calendar service not initialized");
    }

    try {
      this.logger.info(`[Calendar Service] Fetching event ${eventId}`);

      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      return response.data;
    } catch (error) {
      this.logger.error("[Calendar Service] Get event error:", error);
      throw error;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>,
  ): Promise<{ id: string; htmlLink: string }> {
    if (!this.calendar) {
      this.logger.warn(
        "[Calendar Service] Using mock response - Calendar not initialized",
      );
      return {
        id: eventId,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${eventId}`,
      };
    }

    try {
      this.logger.info(`[Calendar Service] Updating event ${eventId}`);

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event as any,
      });

      if (!response.data.id || !response.data.htmlLink) {
        throw new Error("Invalid response from Google Calendar API");
      }

      this.logger.info(`[Calendar Service] Event updated: ${response.data.id}`);

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      this.logger.error("[Calendar Service] Update event error:", error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    if (!this.calendar) {
      this.logger.warn(
        "[Calendar Service] Using mock response - Calendar not initialized",
      );
      return true;
    }

    try {
      this.logger.info(`[Calendar Service] Deleting event ${eventId}`);

      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      this.logger.info(`[Calendar Service] Event deleted: ${eventId}`);

      return true;
    } catch (error) {
      this.logger.error("[Calendar Service] Delete event error:", error);
      throw error;
    }
  }

  /**
   * List events in a time range to check for conflicts
   */
  async listEvents(
    calendarId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<calendar_v3.Schema$Event[]> {
    if (!this.calendar) {
      this.logger.warn(
        "[Calendar Service] Using mock response - Calendar not initialized",
      );
      return [];
    }

    try {
      this.logger.info(
        `[Calendar Service] Listing events from ${startTime.toISOString()} to ${endTime.toISOString()}`,
      );

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        showDeleted: false,
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error("[Calendar Service] List events error:", error);
      throw error;
    }
  }

  /**
   * Check for conflicts in a time range
   */
  async checkConflicts(
    calendarId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<string[]> {
    try {
      const events = await this.listEvents(calendarId, startTime, endTime);

      const conflicts: string[] = [];
      for (const event of events) {
        if (event.summary) {
          conflicts.push(event.summary);
        }
      }

      if (conflicts.length > 0) {
        this.logger.info(
          `[Calendar Service] Found ${conflicts.length} conflicts: ${conflicts.join(", ")}`,
        );
      }

      return conflicts;
    } catch (error) {
      this.logger.error("[Calendar Service] Check conflicts error:", error);
      return [];
    }
  }

  /**
   * Get free/busy information for a time range
   */
  async getFreeBusy(
    calendarId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<{ busy: boolean; reason?: string }> {
    if (!this.calendar) {
      this.logger.warn(
        "[Calendar Service] Using mock response - Calendar not initialized",
      );
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
      this.logger.error("[Calendar Service] Free/busy check error:", error);
      return { busy: false };
    }
  }

  /**
   * Format attendees list
   */
  private formatAttendees(attendeeEmails?: string[]): { email: string }[] {
    if (!attendeeEmails || attendeeEmails.length === 0) {
      return [];
    }

    return attendeeEmails.map((email) => ({
      email,
    }));
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
    warning?: string;
  } {
    const credentialsPath = path.join(
      __dirname,
      "../../config/google-credentials.json",
    );

    return {
      initialized: this.isInitialized(),
      credentialsPath,
      warning: !this.isInitialized()
        ? "Calendar service using mock responses. Place Google credentials.json in config/ directory for real integration."
        : undefined,
    };
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
