# MCP Integration Guide

## Overview

The EM-AI Ecosystem uses Model Context Protocol (MCP) to standardize integrations with external services. MCP replaces custom API code with community-maintained servers.

## Benefits

- **70% less integration code** - OAuth, retries, pagination handled by MCP servers
- **Standardized interface** - All services accessed via unified tool calls
- **Local execution** - Data stays on your machine, zero cloud costs
- **Automatic fallback** - Falls back to direct API if MCP fails

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EM-AI ECOSYSTEM                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Daily Brief  │ │   Calendar   │ │    Inbox     │   ...       │
│  │    Agent     │ │  Optimizer   │ │  Assistant   │             │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────────────┐      │
│  │              HYBRID SERVICE LAYER                      │      │
│  │  CalendarHybrid  │  InboxHybrid  │  DriveHybrid       │      │
│  └──────┬────────────────────────────────────────────────┘      │
│         │                                                        │
│  ┌──────┴────────────────────────────────────────────────┐      │
│  │              MCP CLIENT MANAGER                        │      │
│  └──────┬────────────────────────────────────────────────┘      │
└─────────┼────────────────────────────────────────────────────────┘
          │ STDIO
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP SERVERS                                 │
│  ┌────────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Google         │  │ Filesystem    │  │ PostgreSQL    │       │
│  │ Workspace      │  │ MCP           │  │ MCP           │       │
│  └────────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Enable MCP

Set in `.env.production`:
```
USE_MCP=true
```

### Required Credentials

For Google Workspace MCP:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI

### Install MCP Servers

**Step 1: Install UV (Python package manager)**
```powershell
winget install astral-sh.uv
```

**Step 2: Install Google Workspace MCP**
```powershell
uv tool install workspace-mcp

# Test installation
uvx workspace-mcp --help
```

## Usage

### Check MCP Status

```typescript
import { mcpManager } from './services/mcp';

// List connected servers
console.log(mcpManager.listServers());

// Check specific server
console.log(mcpManager.isConnected('google-workspace'));

// Get available tools
console.log(mcpManager.getTools('google-workspace'));
```

### Direct MCP Calls

```typescript
import { mcpManager } from './services/mcp';

const result = await mcpManager.callTool('google-workspace', 'calendar_list_events', {
  timeMin: new Date().toISOString(),
  maxResults: 10,
});

const events = JSON.parse(result.content[0].text);
```

### Using Hybrid Services

```typescript
import { HybridCalendarService } from './services/calendar.hybrid.service';

// Automatically uses MCP if available, falls back to direct API
const events = await HybridCalendarService.getTodayEvents(userId);

// Check which mode is active
console.log(HybridCalendarService.getMode()); // 'mcp' | 'direct' | 'hybrid'
```

## Troubleshooting

### MCP Server Not Starting

1. Check UV is installed: `uv --version`
2. Check server is installed: `uvx workspace-mcp --help`
3. Check credentials are set in environment
4. Enable debug logging: `MCP_DEBUG=true`

### Authentication Errors

1. Verify OAuth credentials in Google Cloud Console
2. Check redirect URI matches: `http://localhost:3001/api/auth/google/callback`
3. Complete OAuth flow in browser

### Fallback to Direct API

If MCP fails, the hybrid services automatically fall back. Check logs for:
```
[Calendar] MCP failed, falling back to direct API: <error>
```

## Migration Status

| Agent | MCP Status | Notes |
|-------|------------|-------|
| Daily Brief | Planned | Will use HybridCalendarService |
| Calendar Optimizer | Planned | Will use HybridCalendarService |
| Inbox Assistant | Planned | Will use HybridInboxService |
| Journal Agent | Planned | Will use Filesystem MCP |
| Financial Allocator | Planned | Will use PostgreSQL MCP |

## Rollback

To disable MCP and use direct API only:

```powershell
# In .env.production
USE_MCP=false
```

Restart the server. All hybrid services will use direct API calls.

## Available MCP Servers

### Google Workspace MCP
- **Tools:** calendar_list_events, calendar_create_event, gmail_search, gmail_send, drive_list_files
- **Installation:** `uv tool install workspace-mcp`
- **Credentials:** OAuth 2.0 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

### Filesystem MCP
- **Tools:** read_file, write_file, list_directory, search_files
- **Installation:** Built-in via npx
- **Configuration:** JOURNAL_PATH environment variable

### PostgreSQL MCP
- **Tools:** query, execute, list_tables, describe_table
- **Installation:** `uv tool install postgres-mcp`
- **Configuration:** DATABASE_URL environment variable

## Next Steps

1. **Install UV:** `winget install astral-sh.uv`
2. **Install MCP Servers:** `uv tool install workspace-mcp`
3. **Configure OAuth:** Add Google credentials to `.env.production`
4. **Enable MCP:** Set `USE_MCP=true`
5. **Test:** Restart server and call health check endpoint

## Performance Benefits

- **Reduced Code:** ~70% reduction in custom integration code
- **Connection Pooling:** MCP servers maintain persistent connections
- **Automatic Retries:** Built-in retry logic for transient failures
- **Standardized Error Handling:** Consistent error responses across all integrations
- **Community Support:** Benefit from bug fixes and improvements from MCP community

## Security Considerations

- **Local Execution:** MCP servers run locally, data never leaves your machine
- **OAuth Tokens:** Managed by MCP servers, automatic refresh
- **Credential Isolation:** Each MCP server has isolated environment
- **No Cloud Costs:** All processing happens locally, zero API costs for MCP infrastructure
