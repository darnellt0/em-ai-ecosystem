import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private toolCache: Map<string, any[]> = new Map();
  private initialized: boolean = false;

  /**
   * Connect to an MCP server
   */
  async connect(config: MCPServerConfig): Promise<Client> {
    // Return existing client if already connected
    if (this.clients.has(config.name)) {
      return this.clients.get(config.name)!;
    }

    console.log(`[MCP] Connecting to ${config.name}...`);

    // Spawn the server process
    const serverProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.processes.set(config.name, serverProcess);

    // Handle process errors
    serverProcess.on('error', (err) => {
      console.error(`[MCP] Server ${config.name} error:`, err);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[MCP] ${config.name} stderr:`, data.toString());
    });

    // Create transport
    const transport = new StdioClientTransport({
      reader: serverProcess.stdout!,
      writer: serverProcess.stdin!,
    });

    this.transports.set(config.name, transport);

    // Create client
    const client = new Client(
      { name: 'em-ecosystem', version: '1.0.0' },
      { capabilities: {} }
    );

    // Connect client to transport
    await client.connect(transport);
    this.clients.set(config.name, client);

    // Cache available tools
    const tools = await client.listTools();
    this.toolCache.set(config.name, tools.tools);

    console.log(`[MCP] Connected to ${config.name} with ${tools.tools.length} tools`);

    return client;
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`MCP server '${serverName}' not connected`);
    }

    console.log(`[MCP] Calling ${serverName}.${toolName}`, args);

    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      return result as MCPToolResult;
    } catch (error: any) {
      console.error(`[MCP] Tool call failed: ${serverName}.${toolName}`, error);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  /**
   * Get available tools for a server
   */
  getTools(serverName: string): any[] {
    return this.toolCache.get(serverName) || [];
  }

  /**
   * List all connected servers
   */
  listServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a server is connected
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  /**
   * Disconnect from a specific server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);
    const process = this.processes.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }

    if (process) {
      process.kill();
      this.processes.delete(serverName);
    }

    this.toolCache.delete(serverName);
    console.log(`[MCP] Disconnected from ${serverName}`);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const servers = this.listServers();
    await Promise.all(servers.map((s) => this.disconnect(s)));
    this.initialized = false;
    console.log('[MCP] All servers disconnected');
  }

  /**
   * Initialize with default server configurations
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Only initialize if MCP is enabled
    if (process.env.USE_MCP !== 'true') {
      console.log('[MCP] MCP disabled via USE_MCP flag');
      return;
    }

    const configs = this.getDefaultConfigs();

    for (const config of configs) {
      try {
        await this.connect(config);
      } catch (error) {
        console.error(`[MCP] Failed to connect to ${config.name}:`, error);
        // Continue with other servers
      }
    }

    this.initialized = true;
  }

  /**
   * Default server configurations
   */
  private getDefaultConfigs(): MCPServerConfig[] {
    const configs: MCPServerConfig[] = [];

    // Google Workspace (if credentials available)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      configs.push({
        name: 'google-workspace',
        command: 'uvx',
        args: ['workspace-mcp', '--tool-tier', 'core'],
        env: {
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
          GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
        },
      });
    }

    // Filesystem (for journals)
    const journalPath = process.env.JOURNAL_PATH || 'C:/dev/elevated-movements/em-ai-ecosystem/data/journals';
    configs.push({
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', journalPath],
    });

    // PostgreSQL (if DATABASE_URL available)
    if (process.env.DATABASE_URL) {
      configs.push({
        name: 'postgres',
        command: 'uvx',
        args: ['postgres-mcp', process.env.DATABASE_URL!],
      });
    }

    return configs;
  }
}

// Singleton instance
export const mcpManager = new MCPClientManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mcpManager.disconnectAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mcpManager.disconnectAll();
  process.exit(0);
});
