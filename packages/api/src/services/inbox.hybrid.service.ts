import { GmailMCPService } from './mcp/gmailMcp.service';

const USE_MCP = process.env.USE_MCP === 'true';

/**
 * Hybrid Inbox Service
 * Uses MCP when enabled and available, otherwise falls back to direct API
 */
export class HybridInboxService {
  /**
   * Get unread emails
   */
  static async getUnread(userId: string, maxResults: number = 10): Promise<any[]> {
    if (USE_MCP && GmailMCPService.isAvailable()) {
      console.log('[Inbox] Using MCP');
      const result = await GmailMCPService.getUnread(maxResults);

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Inbox] MCP failed, falling back:', result.error);
    }

    console.log('[Inbox] Using direct API (MCP not available)');
    // Placeholder - will be replaced with InboxService.getUnread(userId, maxResults)
    return [];
  }

  /**
   * Get important unread emails
   */
  static async getImportantUnread(userId: string, maxResults: number = 10): Promise<any[]> {
    if (USE_MCP && GmailMCPService.isAvailable()) {
      const result = await GmailMCPService.getImportantUnread(maxResults);

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Inbox] MCP failed, falling back:', result.error);
    }

    console.log('[Inbox] Using direct API (MCP not available)');
    // Placeholder - will be replaced with InboxService.getImportantUnread(userId, maxResults)
    return [];
  }

  /**
   * Search emails
   */
  static async search(userId: string, query: string, maxResults: number = 20): Promise<any[]> {
    if (USE_MCP && GmailMCPService.isAvailable()) {
      const result = await GmailMCPService.search({ query, maxResults });

      if (result.success && result.data) {
        return result.data;
      }

      console.warn('[Inbox] MCP search failed, falling back:', result.error);
    }

    console.log('[Inbox] Using direct API (MCP not available)');
    // Placeholder - will be replaced with InboxService.search(userId, query, maxResults)
    return [];
  }

  /**
   * Send email
   */
  static async send(userId: string, params: {
    to: string[];
    subject: string;
    body: string;
  }): Promise<any> {
    if (USE_MCP && GmailMCPService.isAvailable()) {
      const result = await GmailMCPService.send(params);

      if (result.success) {
        return result.data;
      }

      console.warn('[Inbox] MCP send failed, falling back:', result.error);
    }

    console.log('[Inbox] Using direct API (MCP not available)');
    // Placeholder - will be replaced with InboxService.send(userId, params)
    return null;
  }

  /**
   * Check which mode is active
   */
  static getMode(): 'mcp' | 'direct' | 'hybrid' {
    if (!USE_MCP) return 'direct';
    if (GmailMCPService.isAvailable()) return 'mcp';
    return 'hybrid';
  }
}
