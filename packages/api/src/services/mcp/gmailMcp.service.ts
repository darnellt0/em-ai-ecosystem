import { mcpManager } from './mcpClientManager';
import { MCPEmail, MCPResponse } from './types';

const SERVER_NAME = 'google-workspace';

/**
 * Gmail operations via MCP
 * Replaces direct Gmail API calls
 */
export class GmailMCPService {
  /**
   * Check if MCP Gmail is available
   */
  static isAvailable(): boolean {
    return mcpManager.isConnected(SERVER_NAME);
  }

  /**
   * Search emails
   */
  static async search(params: {
    query: string;
    maxResults?: number;
  }): Promise<MCPResponse<MCPEmail[]>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'gmail_search', {
        query: params.query,
        maxResults: params.maxResults || 20,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const emails = JSON.parse(result.content[0].text);
      return { success: true, data: emails };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread emails
   */
  static async getUnread(maxResults: number = 10): Promise<MCPResponse<MCPEmail[]>> {
    return this.search({ query: 'is:unread', maxResults });
  }

  /**
   * Get important unread emails
   */
  static async getImportantUnread(maxResults: number = 10): Promise<MCPResponse<MCPEmail[]>> {
    return this.search({ query: 'is:unread is:important', maxResults });
  }

  /**
   * Read a specific email
   */
  static async read(messageId: string): Promise<MCPResponse<MCPEmail>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'gmail_read', {
        messageId,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const email = JSON.parse(result.content[0].text);
      return { success: true, data: email };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an email
   */
  static async send(params: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<MCPResponse<{ messageId: string }>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'gmail_send', {
        to: params.to.join(','),
        subject: params.subject,
        body: params.body,
        cc: params.cc?.join(','),
        bcc: params.bcc?.join(','),
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const response = JSON.parse(result.content[0].text);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a draft email
   */
  static async createDraft(params: {
    to: string[];
    subject: string;
    body: string;
  }): Promise<MCPResponse<{ draftId: string }>> {
    try {
      const result = await mcpManager.callTool(SERVER_NAME, 'gmail_draft', {
        to: params.to.join(','),
        subject: params.subject,
        body: params.body,
      });

      if (result.isError) {
        return { success: false, error: result.content[0]?.text };
      }

      const response = JSON.parse(result.content[0].text);
      return { success: true, data: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
