export interface ToolRequest {
  tool: string;
  action: string;
  input?: any;
  meta?: Record<string, any>;
}

export interface ToolError {
  code: string;
  message: string;
  details?: any;
}

export interface ToolResult {
  ok: boolean;
  output?: any;
  error?: ToolError;
}

export type ToolHandler = (req: ToolRequest) => Promise<ToolResult> | ToolResult;
