import { mcpManager, MCPToolResult } from './mcpClientManager';
import { MCPCalendarEvent, MCPResponse } from './types';

const SERVER_NAME = 'google-workspace';

/**
 * Calendar operations via MCP
 * Replaces direct Google Calendar API calls
 */
export class CalendarMCPService {
  /**
   * Check if MCP calendar is available
   */
  static isAvailable(): boolean {
    return mcpManager.isConnected(SERVER_NAME);
  }

  /**
   * List calendar events
   */
  static async listEvents(params: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<MCPResponse<MCPCalendarEvent[]>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'calendar_list_events', {
        calendarId: params.calendarId || 'primary',
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 50,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const events = JSON.parse(result.content[0].text);
      return { success: true, data: events };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get today's events
   */
  static async getTodayEvents(): Promise<MCPResponse<MCPCalendarEvent[]>> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    return this.listEvents({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
    });
  }

  /**
   * Get events for the next N days
   */
  static async getUpcomingEvents(days: number = 7): Promise<MCPResponse<MCPCalendarEvent[]>> {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.listEvents({
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
    });
  }

  /**
   * Create a calendar event
   */
  static async createEvent(params: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string[];
  }): Promise<MCPResponse<MCPCalendarEvent>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'calendar_create_event', {
        calendarId: 'primary',
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start },
        end: { dateTime: params.end },
        location: params.location,
        attendees: params.attendees?.map((email) => ({ email })),
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const event = JSON.parse(result.content[0].text);
      return { success: true, data: event };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a calendar event
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<{
      summary: string;
      description: string;
      start: string;
      end: string;
      location: string;
    }>
  ): Promise<MCPResponse<MCPCalendarEvent>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'calendar_update_event', {
        calendarId: 'primary',
        eventId,
        ...updates,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const event = JSON.parse(result.content[0].text);
      return { success: true, data: event };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(eventId: string): Promise<MCPResponse<void>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'calendar_delete_event', {
        calendarId: 'primary',
        eventId,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
