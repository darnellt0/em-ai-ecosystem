# Growth Agent Orchestrator Documentation

## Overview

The Growth Agent Orchestrator is a backend system that coordinates 5 Growth Agents designed to help users progress through the Elevated Movements methodology. These agents run concurrently, self-verify, and provide real-time progress tracking and readiness monitoring.

## Architecture

### Components

1. **Orchestrator Module** (`packages/orchestrator/src/growth/`)
   - Core orchestration engine
   - Progress tracking and readiness monitoring
   - In-memory storage with Redis extensibility

2. **5 Growth Agents**:
   - **Journal Agent** (Rooted Phase) - Daily alignment journal
   - **Rhythm Agent** (Rooted Phase) - Rest & rhythm planner
   - **Niche Agent** (Grounded Phase) - Niche navigator
   - **Mindset Agent** (Grounded Phase) - Mindset shift mentor
   - **Purpose Agent** (Radiant Phase) - Purpose pathfinder

3. **API Endpoints** (`packages/api/src/routes/orchestrator.router.ts`)
   - RESTful API for orchestrator operations
   - Integrated into main API server

4. **Monitoring UI** (`dashboard-html/agents.html`)
   - Real-time agent status dashboard
   - Launch controls and auto-refresh

### Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 20+
- **Storage**: In-memory (with Redis extensibility)
- **Testing**: Jest with 30 passing tests
- **Package Manager**: npm with workspaces

## The 5 Growth Agents

### 1. Journal Agent (Priority 1, Rooted)

**Purpose**: Helps users reflect and align through daily journaling.

**Features**:
- Accepts journal reflections and creates structured entries
- Analyzes sentiment (0-1 scale)
- Extracts 3 key topics per entry
- Generates summaries
- Integrates with Google Sheets (when configured)

**Configuration**:
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
EM_JOURNAL_SPREADSHEET_ID=your-spreadsheet-id
OPENAI_API_KEY=your-openai-key
```

**Artifacts**:
- `entriesCreated`: Number of entries created
- `entries`: Array of journal entries with sentiment and topics
- `sheetsWritten`: Boolean indicating if Google Sheets write succeeded

### 2. Rhythm Agent (Priority 2, Rooted)

**Purpose**: Finds balance between productivity and rest by analyzing calendar density.

**Features**:
- Analyzes next 14 days of calendar events
- Detects "dense days" (>6h meetings or <30m gaps)
- Suggests "Pause Blocks" (15-30 minute breaks)
- Can create calendar events (when configured)

**Configuration**:
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
FOUNDER_DARNELL_CALENDAR_ID=calendar@gmail.com
FOUNDER_SHRIA_CALENDAR_ID=calendar@gmail.com
```

**Artifacts**:
- `daysAnalyzed`: Number of days analyzed
- `denseDays`: Number of dense days detected
- `pauseBlocksSuggested`: Number of pause blocks recommended
- `pauseBlocks`: Array of pause block suggestions with times and reasons

### 3. Niche Agent (Priority 3, Grounded)

**Purpose**: Helps users discover and clarify their unique niche through Q&A analysis.

**Features**:
- Collects Q&A data: skills, passions, values, audience, impact
- Discovers 2-3 niche themes with confidence scores
- Generates a "Niche Clarity Report" (HTML)
- Provides 4 actionable recommendations

**Artifacts**:
- `themesDiscovered`: Number of themes identified
- `topTheme`: Name of highest confidence theme
- `topThemeConfidence`: Confidence score (0-1)
- `themes`: Array of all themes with names and confidence
- `reportLength`: Length of HTML report

### 4. Mindset Agent (Priority 4, Grounded)

**Purpose**: Reframes limiting beliefs and develops empowering mindsets.

**Features**:
- Accepts limiting belief statements
- Generates compassionate reframes
- Creates personalized affirmations
- Suggests micro-practices for embodiment
- Produces weekly mindset snapshots

**Artifacts**:
- `entriesCreated`: Number of beliefs processed
- `entries`: Array of beliefs with reframes and affirmations
- `snapshot`: Weekly summary with top themes and progress

### 5. Purpose Agent (Priority 5, Radiant)

**Purpose**: Discovers and articulates core purpose through Ikigai framework.

**Features**:
- Runs Ikigai-style Q&A (what you love, world needs, can be paid for, good at)
- Generates a one-sentence Purpose Declaration
- Creates a branded "Purpose Card" (HTML with EM colors)
- Generates 7 daily affirmations
- Queues affirmations for delivery (when configured)

**Configuration**:
```env
TWILIO_ACCOUNT_SID=your-twilio-sid
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**EM Brand Colors**:
- Plum: `#36013f`
- Teal: `#176161`
- Gold: `#e0cd67`
- Rose: `#c3b4b3`
- Slate: `#37475e`

**Artifacts**:
- `purposeDeclaration`: The generated purpose statement
- `declarationConfidence`: Confidence score (0-1)
- `purposeCardGenerated`: Boolean
- `cardHtmlLength`: Length of purpose card HTML
- `affirmationsGenerated`: Number of affirmations created (always 7)
- `affirmationsQueued`: Boolean indicating if queued for delivery

## API Endpoints

### Base URL
```
http://localhost:3000/api/orchestrator
```

### 1. Launch All Growth Agents

**Endpoint**: `POST /api/orchestrator/launch`

**Request Body**:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Launched 5 Growth Agents",
  "summary": {
    "success": true,
    "startedAt": "2025-11-21T12:00:00.000Z",
    "completedAt": "2025-11-21T12:00:05.000Z",
    "totalAgents": 5,
    "successfulAgents": 5,
    "failedAgents": 0,
    "errors": []
  },
  "results": [
    {
      "agentKey": "journal",
      "success": true,
      "errors": null,
      "artifacts": { ... }
    },
    // ... other agents
  ]
}
```

### 2. Get Health Status

**Endpoint**: `GET /api/orchestrator/health`

**Response**:
```json
{
  "status": "success",
  "health": {
    "redisConnected": true,
    "timestamp": "2025-11-21T12:00:00.000Z",
    "agents": [
      {
        "key": "journal",
        "displayName": "Journal Agent",
        "phase": "Rooted",
        "status": "ready",
        "ready": true,
        "lastUpdated": "2025-11-21T12:00:05.000Z",
        "lastError": null,
        "runCount": 1
      },
      // ... other agents
    ]
  }
}
```

### 3. Get Readiness Summary

**Endpoint**: `GET /api/orchestrator/readiness`

**Response**:
```json
{
  "status": "success",
  "readiness": {
    "journal": true,
    "niche": true,
    "mindset": true,
    "rhythm": true,
    "purpose": true,
    "allReady": true,
    "timestamp": "2025-11-21T12:00:00.000Z"
  }
}
```

### 4. Get Progress Snapshot

**Endpoint**: `GET /api/orchestrator/progress?limit=100`

**Response**:
```json
{
  "status": "success",
  "progress": {
    "journal": [
      {
        "agentKey": "journal",
        "timestamp": "2025-11-21T12:00:00.000Z",
        "message": "Starting Journal Agent",
        "progress": 0
      },
      {
        "agentKey": "journal",
        "timestamp": "2025-11-21T12:00:05.000Z",
        "message": "Completed Journal Agent",
        "progress": 100,
        "data": { ... }
      }
    ],
    // ... other agents
  }
}
```

### 5. List All Agents

**Endpoint**: `GET /api/orchestrator/agents`

**Response**:
```json
{
  "status": "success",
  "agents": [
    {
      "key": "journal",
      "displayName": "Journal Agent",
      "phase": "Rooted",
      "priority": 1,
      "description": "Daily Alignment Journal - Helps users reflect and align through journaling"
    },
    // ... other agents
  ],
  "count": 5
}
```

## Running Locally

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (optional)
- Redis (optional)

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Packages**:
   ```bash
   npm run build --workspace=@em/orchestrator
   npm run build --workspace=@em/api
   ```

3. **Set Environment Variables** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start API Server**:
   ```bash
   npm run dev --workspace=@em/api
   ```

5. **Open Dashboard**:
   Open `http://localhost:3000/agents.html` in your browser to view the Growth Agents Monitor.

### Testing

Run all orchestrator tests:
```bash
npm test --workspace=@em/orchestrator
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       30 passed, 30 total
```

Run all API tests:
```bash
npm test --workspace=@em/api
```

## Monitoring UI

The Growth Agents Monitor UI provides:

- **Real-time Status**: Live updates every 5 seconds
- **Agent Cards**: Status, phase, readiness, and run count for each agent
- **Readiness Summary**: Quick view of all agent readiness states
- **Launch Control**: Button to launch all agents with a single click
- **Error Display**: Last error message for debugging

Access the UI at: `http://localhost:3000/agents.html`

## Extension Points

### Adding a New Agent

1. Create agent file in `packages/orchestrator/src/growth/agents/`:
   ```typescript
   export async function runMyNewAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
     // Implementation
   }
   ```

2. Register in `packages/orchestrator/src/growth/registry.ts`:
   ```typescript
   {
     key: 'mynew',
     displayName: 'My New Agent',
     phase: 'Grounded',
     priority: 6,
     description: 'Description',
     runAgent: runMyNewAgent,
   }
   ```

3. Update TypeScript types in `packages/orchestrator/src/growth/types.ts`:
   ```typescript
   export type GrowthAgentKey = 'journal' | 'niche' | 'mindset' | 'rhythm' | 'purpose' | 'mynew';
   ```

### Switching to Redis Storage

1. Install ioredis:
   ```bash
   npm install ioredis --workspace=@em/orchestrator
   ```

2. Implement `RedisStorage` class in `packages/orchestrator/src/growth/storage.ts`

3. Update `createStorage()` function to use Redis when `REDIS_URL` is set

## Troubleshooting

### Issue: Tests Failing

**Solution**: Rebuild orchestrator package:
```bash
npm run build --workspace=@em/orchestrator
npm test --workspace=@em/orchestrator
```

### Issue: API Can't Import Orchestrator

**Solution**: Ensure orchestrator is built and dist folder exists:
```bash
npm run build --workspace=@em/orchestrator
ls packages/orchestrator/dist/growth/
```

### Issue: Agents Not Launching

**Solution**: Check API logs for errors:
```bash
# Check server output for registration messages
[Orchestrator Router] Registered 5 Growth Agents
```

### Issue: Dashboard Not Loading

**Solution**: Verify API server is running and accessible:
```bash
curl http://localhost:3000/api/orchestrator/health
```

## Performance Considerations

- **Concurrent Execution**: All 5 agents run concurrently using `Promise.all`
- **Progress Tracking**: Limited to last 200 events per agent
- **Auto-refresh**: Dashboard polls every 5 seconds (configurable)
- **Memory Usage**: In-memory storage uses ~1MB per agent for typical workloads

## Security Considerations

- **API Authentication**: Currently no authentication (add bearer tokens for production)
- **CORS**: Configure `ALLOWED_ORIGINS` environment variable
- **Secrets**: Store API keys in environment variables, never commit to git
- **Input Validation**: All user inputs are validated before processing

## Future Enhancements

- [ ] Add retry logic with exponential backoff
- [ ] Implement webhook notifications for agent completion
- [ ] Add agent scheduling (cron-based)
- [ ] Build agent result dashboard with charts
- [ ] Add agent dependency management
- [ ] Implement Redis storage for multi-instance deployments
- [ ] Add streaming progress updates via WebSocket

## Support

For issues or questions:
- GitHub Issues: [em-ai-ecosystem/issues](https://github.com/darnellt0/em-ai-ecosystem/issues)
- Documentation: `/docs/em-orchestrator-growth-agents.md`

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Maintainer**: Elevated Movements AI Team
