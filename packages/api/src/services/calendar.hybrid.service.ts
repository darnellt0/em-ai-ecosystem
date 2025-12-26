import { CalendarMCPService } from './mcp/calendarMcp.service';
import { MCPCalendarEvent } from './mcp/types';

const USE_MCP = process.env.USE_MCP === 'true';

/**
 * Hybrid Calendar Service
 * Uses MCP when enabled and available, otherwise falls back to direct API
 */
export class HybridCalendarService {
  /**
   * Get today's calendar events
   */
  static async getTodayEvents(userId: string): Promise<any[]> {
    // Try MCP first if enabled
    if (USE_MCP && CalendarMCPService.isAvailable()) {
      console.log('[Calendar] Using MCP');
      const result = await CalendarMCPService.getTodayEvents();

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Calendar] MCP failed, falling back to direct API:', result.error);
    }

    // Fallback to existing service
    console.log('[Calendar] Using direct API (MCP not available)');
    // For now, return empty array as placeholder
    // This will be replaced with actual CalendarService.getTodayEvents(userId) when integrated
    return [];
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(userId: string, days: number = 7): Promise<any[]> {
    if (USE_MCP && CalendarMCPService.isAvailable()) {
      const result = await CalendarMCPService.getUpcomingEvents(days);

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Calendar] MCP failed, falling back:', result.error);
    }

    console.log('[Calendar] Using direct API (MCP not available)');
    // Placeholder - will be replaced with CalendarService.getUpcomingEvents(userId, days)
    return [];
  }

  /**
   * Create a calendar event
   */
  static async createEvent(userId: string, event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  }): Promise<any> {
    if (USE_MCP && CalendarMCPService.isAvailable()) {
      const result = await CalendarMCPService.createEvent(event);

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Calendar] MCP create failed, falling back:', result.error);
    }

    console.log('[Calendar] Using direct API (MCP not available)');
    // Placeholder - will be replaced with CalendarService.createEvent(userId, event)
    return null;
  }

  /**
   * Check which mode is active
   */
  static getMode(): 'mcp' | 'direct' | 'hybrid' {
    if (!USE_MCP) return 'direct';
    if (CalendarMCPService.isAvailable()) return 'mcp';
    return 'hybrid';
  }
}
