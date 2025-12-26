/**
 * MCP Integration Types
 */

// Calendar event from Google Workspace MCP
export interface MCPCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; responseStatus: string }>;
  location?: string;
  status: string;
}

// Email from Gmail MCP
export interface MCPEmail {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  labels: string[];
  isUnread: boolean;
}

// Drive file from Google Drive MCP
export interface MCPDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: number;
  webViewLink?: string;
}

// Filesystem file
export interface MCPFile {
  path: string;
  content: string;
  size: number;
  modifiedAt: string;
}

// Database query result
export interface MCPQueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  fields: Array<{ name: string; dataTypeID: number }>;
}

// Tool call response
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
