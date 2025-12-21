import { ToolHandler, ToolRequest, ToolResult } from './tool.types';
import { runMcpTool } from './tool.clients';

const registry = new Map<string, ToolHandler>();
let initialized = false;

function key(tool: string, action: string) {
  return `${tool}.${action}`;
}

export function registerToolHandler(tool: string, action: string, handler: ToolHandler) {
  registry.set(key(tool, action), handler);
}

export function getToolHandler(tool: string, action: string): ToolHandler | undefined {
  return registry.get(key(tool, action));
}

export function listToolHandlers() {
  return Array.from(registry.keys());
}

export async function runTool(req: ToolRequest): Promise<ToolResult> {
  const handler = getToolHandler(req.tool, req.action);
  if (!handler) {
    return { ok: false, error: { code: 'NOT_IMPLEMENTED', message: `Tool ${req.tool}.${req.action} not registered` } };
  }
  try {
    return await handler(req);
  } catch (err: any) {
    return { ok: false, error: { code: 'TOOL_ERROR', message: err?.message || 'Tool handler failed', details: err } };
  }
}

export async function runToolByName(toolName: string, input?: any, meta?: Record<string, any>): Promise<ToolResult> {
  const [tool, action] = toolName.split('.', 2);
  if (!tool || !action) {
    return { ok: false, error: { code: 'INVALID_TOOL', message: `Tool name ${toolName} must include tool.action` } };
  }
  return runTool({ tool, action, input, meta });
}

export async function runToolWithFallback(req: ToolRequest): Promise<ToolResult> {
  // Prefer MCP if enabled; otherwise local registry handler
  if (process.env.ENABLE_MCP === 'true') {
    const mcpResult = await runMcpTool(req);
    if (mcpResult.ok || mcpResult.error?.code !== 'MCP_DISABLED') {
      return mcpResult;
    }
  }
  return runTool(req);
}

export function ensureToolsRegistered(registerFn: () => void) {
  if (initialized) return;
  registerFn();
  initialized = true;
}
