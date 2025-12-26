#!/usr/bin/env node

/**
 * Elevated Movements AI Ecosystem - Express API Server
 * Phase Voice-0 Integration
 * Integrated Voice API endpoints + existing dashboard/agent endpoints
 */

import path from 'path';
import dotenv from 'dotenv';

// Load env vars from packages/api/.env (Option B)
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import voiceRouter from './voice/voice.router';
import voiceAudioRouter from './voice/voice.audio.router';
import intentRouter from './voice/intent.router';
import transcribeRouter from './voice/transcribe.router';
import voiceTurnRouter from './voice/voiceTurn.router';
import voiceDuplexRouter from './voice/voiceDuplex.router';
import { initVoiceRealtimeWSS } from './voice-realtime/ws.server';
import orchestratorRouter from './growth-agents/orchestrator.router';
import actionsRouter from './routes/actions.routes';
import contentRouter from './routes/content.routes';
import emAiAgentsRouter from './routes/emAiAgents.router';
import emotionalSessionRouter from './routes/emotional-session.router';
import execAdminRouter from './routes/execAdmin.router';
import leadershipSessionRouter from './routes/leadership-session.router';
import emAiExecAdminRouter from './routes/emAiExecAdmin.router';
import p0RunsRouter from './routes/p0-runs.routes';
import p1Router from './routes/p1.routes';
import { validateAgentRegistry } from './growth-agents/agent-registry';
import { initSentry, captureException, flushSentry } from './services/sentry';
import { runDailyBriefAgent } from './services/dailyBrief.service';
import { scheduleDailyBriefCron } from './schedules/daily-brief.schedule';
import p0DailyBriefRouter from './routes/p0-daily-brief.routes';
import p0DailyFocusRouter from './routes/p0-daily-focus.routes';
import p1ActionPackRouter from './routes/p1-action-pack.routes';
import { performHealthCheck } from './services/health.service';
import systemRouter from './routes/system.routes';

// Initialize Sentry after env is loaded
initSentry();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const enableVoice = process.env.EM_ENABLE_VOICE === 'true';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS
const allowList = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowList.length === 0 || allowList.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
};
app.use(cors(corsOptions));

// JSON body parsing
app.use(express.json());

// EM AI agent catalog + execution
app.use('/em-ai/agents', emAiAgentsRouter);
app.use('/', emotionalSessionRouter);
app.use('/', leadershipSessionRouter);
app.use('/', execAdminRouter);
app.use('/', systemRouter);
app.use('/', actionsRouter);
app.use('/api', contentRouter);
app.use('/', p1Router);

// Request logging middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${_req.method} ${_req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// SIMULATED AGENT DATA (for dashboard endpoints)
// ============================================================================

const agents = {
  'inbox-assistant': { status: 'running', last_run: new Date() },
  'calendar-optimizer': { status: 'running', last_run: new Date() },
  'email-responder': { status: 'running', last_run: new Date() },
  'meeting-analyst': { status: 'running', last_run: new Date() },
  'task-orchestrator': { status: 'running', last_run: new Date() },
  'cost-tracker': { status: 'running', last_run: new Date() },
  'deep-work-monitor': { status: 'running', last_run: new Date() },
  'decision-architect': { status: 'running', last_run: new Date() },
  'voice-dna-learner': { status: 'running', last_run: new Date() },
  'approval-workflow': { status: 'running', last_run: new Date() },
  'network-intelligence': { status: 'running', last_run: new Date() },
  'knowledge-curator': { status: 'running', last_run: new Date() },
};

// ============================================================================
// ROUTES - HEALTH & STATUS
// ============================================================================

/**
 * Health check endpoint with connectivity checks
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthCheck = await performHealthCheck();

    // Return 503 if unhealthy, 200 if healthy or degraded
    const statusCode = healthCheck.status === 'unhealthy' ? 503 : 200;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

// ============================================================================
// ROUTES - AGENTS
// ============================================================================

/**
 * List all agents
 */
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json({
    agents: Object.keys(agents),
    count: Object.keys(agents).length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Agent status details
 */
app.get('/api/agents/status', (_req: Request, res: Response) => {
  res.json({
    agents: agents,
    overall_status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ROUTES - CONFIGURATION
// ============================================================================

/**
 * System configuration status
 */
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    app_name: 'Elevated Movements AI Ecosystem',
    version: '1.0.0',
    environment: NODE_ENV,
    port: PORT,
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    redis: process.env.REDIS_URL ? 'configured' : 'not configured',
    openai_key: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
    claude_key: process.env.CLAUDE_API_KEY ? 'configured' : 'not configured',
    elevenlabs_key: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not configured',
    voice_api_token: process.env.VOICE_API_TOKEN ? 'configured' : 'not configured',
    smtp_configured: process.env.SMTP_HOST ? true : false,
    founders: [
      {
        name: 'Darnell',
        email: process.env.FOUNDER_DARNELL_EMAIL || 'not configured',
      },
      {
        name: 'Shria',
        email: process.env.FOUNDER_SHRIA_EMAIL || 'not configured',
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ROUTES - EXECUTIONS
// ============================================================================

/**
 * Recent executions
 */
app.get('/api/executions', (_req: Request, res: Response) => {
  res.json({
    executions: [
      {
        id: 1,
        agent: 'inbox-assistant',
        status: 'completed',
        duration: 1234,
        timestamp: new Date().toISOString(),
      },
    ],
    total: 1,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ROUTES - DASHBOARD
// ============================================================================

/**
 * Dashboard data aggregation
 */
app.get('/api/dashboard', (_req: Request, res: Response) => {
  res.json({
    dashboard: 'Elevated Movements AI Ecosystem',
    agents_running: Object.values(agents).filter((a) => a.status === 'running').length,
    total_agents: Object.keys(agents).length,
    operational: true,
    last_update: new Date().toISOString(),
    key_metrics: {
      emails_processed: 127,
      meetings_analyzed: 42,
      tasks_created: 89,
      cost_this_month: 487.65,
      api_calls: 3421,
    },
    founders: [
      {
        name: 'Darnell',
        email_status: 'connected',
        calendar_status: 'connected',
      },
      {
        name: 'Shria',
        email_status: 'connected',
        calendar_status: 'connected',
      },
    ],
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ROUTES - DAILY BRIEF
// ============================================================================

app.post('/api/agents/daily-brief/run', async (req: Request, res: Response) => {
  try {
    const { user, userId, date, runId } = req.body || {};
    const targetUser = user || userId;
    if (!targetUser) {
      return res.status(400).json({ success: false, error: 'user is required' });
    }
    const result = await runDailyBriefAgent({ user: targetUser, date, runId });
    return res.json({ success: true, result });
  } catch (error) {
    console.error('[DailyBrief] Failed to run', error);
    captureException(error as Error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================================================
// ROUTES - VOICE API (PHASE VOICE-0)
// ============================================================================

/**
 * Natural language intent endpoint with planner support
 */
if (enableVoice) {
  app.use('/api/voice', intentRouter);

/**
 * Mount voice router with voice-first endpoints
 */
  app.use('/api/voice', voiceRouter);

/**
 * Audio generation endpoints for ElevenLabs TTS integration
 */
  app.use('/api/voice', voiceAudioRouter);

/**
 * Speech-to-text transcription endpoints
 */
  app.use('/api/voice', transcribeRouter);

/**
 * Voice turn endpoint - unified audio/text → command → response
 */
  app.use('/api/voice', voiceTurnRouter);
} else {
  console.log('?? Voice API routes disabled (set EM_ENABLE_VOICE=true to enable)');
}

// ============================================================================
// ROUTES - GROWTH AGENTS ORCHESTRATOR (PHASE 6)
// ============================================================================

/**
 * Growth agents orchestrator endpoints (protected by feature flag)
 */
app.use('/api/orchestrator', orchestratorRouter);

/**
 * Full duplex voice API - Audio in -> Dispatcher -> Audio out
 */
app.use(voiceDuplexRouter);

/**
 * Executive Admin growth pack endpoints (Phase 6)
 */
app.use('/', emAiExecAdminRouter);
app.use('/', p0DailyBriefRouter);
// P0 Golden Path — do not modify without rerunning p0-golden-path.eval.ts
app.use(p0DailyFocusRouter);
console.log('[Routes] mounted p0DailyFocusRouter -> POST /api/exec-admin/p0/daily-focus');
app.use('/', p0RunsRouter);
app.use(p1ActionPackRouter);
console.log('[Routes] mounted emAiExecAdminRouter -> includes POST /api/exec-admin/dispatch');

/**
 * Serve growth agents monitoring UI (only if dashboard is enabled)
 */
if (process.env.ENABLE_GROWTH_DASHBOARD === 'true') {
  app.use('/agents', express.static('src/public'));
  console.log('🔓 Growth Agents Dashboard: Enabled at /agents');
} else {
  console.log('🔒 Growth Agents Dashboard: Disabled (set ENABLE_GROWTH_DASHBOARD=true to enable)');
}

// ============================================================================
// ROUTES - DASHBOARD HTML
// ============================================================================

/**
 * Serve dashboard HTML for root and non-API routes
 */
app.get('/', (_req: Request, res: Response) => {
  const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <title>Elevated Movements AI Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0f0a1b, #1a0f2e); color: #fff; min-height: 100vh; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #36013f, #5a1a6f); padding: 30px; border-radius: 10px; margin-bottom: 30px; }
    h1 { font-size: 28px; color: #e0cd67; margin-bottom: 10px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .metric-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(224,205,103,0.2); padding: 20px; border-radius: 10px; }
    .metric-label { font-size: 12px; text-transform: uppercase; color: #a0a0a0; margin-bottom: 10px; }
    .metric-value { font-size: 32px; font-weight: 700; color: #e0cd67; }
    .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
    .agent-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(224,205,103,0.2); padding: 15px; border-radius: 8px; }
    .agent-name { color: #e0cd67; font-weight: 600; margin-bottom: 10px; }
    .status-badge { display: inline-block; background: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    .voice-api-badge { background: #3b82f6; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    footer { margin-top: 40px; text-align: center; color: #a0a0a0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 Elevated Movements AI Ecosystem</h1>
      <div style="margin-top: 15px;">
        <span class="status-badge">● System Healthy</span>
        <span style="margin-left: 15px; font-size: 14px; color: #a0a0a0;">v1.0.0 + Voice API</span>
      </div>
    </header>

    <div class="voice-api-badge">
      ✨ Phase Voice-0 Integration Live - 6 Voice Endpoints Ready
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">📧 Emails Processed</div>
        <div class="metric-value">127</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">📅 Meetings Analyzed</div>
        <div class="metric-value">42</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">✅ Tasks Created</div>
        <div class="metric-value">89</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">💰 Total Cost</div>
        <div class="metric-value">$487.65</div>
      </div>
    </div>

    <h2 style="margin: 30px 0 15px; color: #e0cd67;">🤖 AI Agents (12)</h2>
    <div class="agents-grid">
      <div class="agent-card"><div class="agent-name">Inbox Assistant</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Calendar Optimizer</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Email Responder</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Meeting Analyst</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Task Orchestrator</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Cost Tracker</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Deep Work Monitor</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Decision Architect</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Voice DNA Learner</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Approval Workflow</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Network Intelligence</div><span class="status-badge">✓ Active</span></div>
      <div class="agent-card"><div class="agent-name">Knowledge Curator</div><span class="status-badge">✓ Active</span></div>
    </div>

    <h2 style="margin: 30px 0 15px; color: #e0cd67;">🎤 Voice API Endpoints</h2>
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin-bottom: 10px; color: #93c5fd;"><strong>Phase Voice-0 Integrated</strong></p>
      <ul style="color: #a0a0a0; line-height: 1.8;">
        <li>✓ POST /api/voice/scheduler/block - Block focus time</li>
        <li>✓ POST /api/voice/scheduler/confirm - Confirm meeting</li>
        <li>✓ POST /api/voice/scheduler/reschedule - Reschedule event</li>
        <li>✓ POST /api/voice/coach/pause - Start meditation</li>
        <li>✓ POST /api/voice/support/log-complete - Mark task done</li>
        <li>✓ POST /api/voice/support/follow-up - Create reminder</li>
      </ul>
      <p style="margin-top: 15px; font-size: 12px; color: #64748b;">
        <strong>Documentation:</strong> See /documentation/VOICE_TESTS.md for cURL examples and API reference
      </p>
    </div>

    <h2 style="margin: 30px 0 15px; color: #e0cd67;">🎙️ Available Voices</h2>
    <div class="agents-grid">
      <div class="agent-card">
        <div class="agent-name">Shria</div>
        <div style="font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Cloned Voice</div>
        <span class="status-badge" style="background: #8b5cf6;">● Default</span>
      </div>
      <div class="agent-card">
        <div class="agent-name">Josh</div>
        <div style="font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Young & Energetic</div>
        <span class="status-badge" style="background: #06b6d4;">● Active</span>
      </div>
      <div class="agent-card">
        <div class="agent-name">Sara</div>
        <div style="font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Helpful & Clear</div>
        <span class="status-badge" style="background: #f59e0b;">● Active</span>
      </div>
      <div class="agent-card">
        <div class="agent-name">Rachel</div>
        <div style="font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">Calm & Professional</div>
        <span class="status-badge" style="background: #ec4899;">● Active</span>
      </div>
    </div>

    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 20px; border-radius: 8px; margin-top: 30px; margin-bottom: 30px;">
      <p style="margin-bottom: 10px; color: #86efac;"><strong>Audio Generation Endpoints</strong></p>
      <ul style="color: #a0a0a0; line-height: 1.8;">
        <li>✓ POST /api/voice/audio/generate - Generate single audio from text</li>
        <li>✓ POST /api/voice/audio/batch - Generate multiple audios</li>
        <li>✓ GET /api/voice/audio/voices - List available voices</li>
      </ul>
    </div>
  </div>

  <footer>
    <p>Elevated Movements AI Executive Assistant • v1.0.0 + Phase Voice-0 • Production Ready</p>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(dashboardHTML);
});

// ============================================================================
// ROUTES - 404 & ERROR HANDLING
// ============================================================================

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    message: 'The requested endpoint does not exist',
    available_endpoints: [
      '/health',
      '/api/auth/signup',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/agents',
      '/api/agents/status',
      '/api/config',
      '/api/executions',
      '/api/dashboard',
      '/api/exec-admin/dispatch',
      '/api/exec-admin/p0/daily-focus',
      '/api/exec-admin/p0/journal/run',
      '/api/exec-admin/p0/journal/runs',
      '/api/exec-admin/p0/journal/runs/:runId',
      '/api/exec-admin/p1/execute-action-pack',
      '/api/voice/scheduler/block',
      '/api/voice/scheduler/confirm',
      '/api/voice/scheduler/reschedule',
      '/api/voice/coach/pause',
      '/api/voice/support/log-complete',
      '/api/voice/support/follow-up',
      '/api/voice/analytics/daily-brief',
      '/api/voice/analytics/insights',
      '/api/voice/business/grants',
      '/api/voice/business/relationships',
      '/api/voice/business/budget',
      '/api/voice/business/content',
      '/api/voice/business/brand-story',
      '/api/voice/hybrid',
    ],
  });
});

/**
 * Global error handler with Sentry integration
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  // Capture error with Sentry
  captureException(err, {
    path: _req.path,
    method: _req.method,
    query: _req.query,
    body: _req.body,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ============================================================================
// SERVER START
// ============================================================================

// Validate agent registry on startup
const registryValidation = validateAgentRegistry();
if (!registryValidation.valid) {
  console.error('❌ Agent registry validation failed:');
  registryValidation.errors.forEach((error) => console.error(`   - ${error}`));
  console.error('\nPlease fix agent registry errors before starting the server.\n');
  process.exit(1);
} else {
  console.log('✅ Agent registry validation passed');
}

let server: ReturnType<typeof app.listen> | null = null;

if (NODE_ENV !== 'test') {
  server = app.listen(parseInt(String(PORT), 10), '0.0.0.0', () => {
    console.log('\n✅ Elevated Movements AI Ecosystem API Server');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Status: Running\n`);
    console.log(`📊 DASHBOARD ENDPOINTS:`);
    console.log(`   GET /health                        - Health check`);
    console.log(`   GET /api/agents                    - List all agents`);
    console.log(`   GET /api/agents/status             - Agent status`);
    console.log(`   GET /api/config                    - Configuration`);
    console.log(`   GET /api/executions                - Recent executions`);
    console.log(`   GET /api/dashboard                 - Dashboard data\n`);
    console.log(`🎤 VOICE API ENDPOINTS (Phase Voice-0):`);
    console.log(`   POST /api/voice/scheduler/block         - Block focus time`);
    console.log(`   POST /api/voice/scheduler/confirm       - Confirm meeting`);
    console.log(`   POST /api/voice/scheduler/reschedule    - Reschedule event`);
    console.log(`   POST /api/voice/coach/pause             - Start meditation`);
    console.log(`   POST /api/voice/support/log-complete    - Mark task done`);
    console.log(`   POST /api/voice/support/follow-up       - Create reminder`);
  });

  if (enableVoice && !(global as any).__VOICE_WSS_INITIALIZED__) {
    initVoiceRealtimeWSS(server);
    (global as any).__VOICE_WSS_INITIALIZED__ = true;
  }

  // Start Daily Brief cron schedules (PT)
  scheduleDailyBriefCron();

  // Graceful shutdown with Sentry flush
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server?.close(async () => {
      await flushSentry();
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    server?.close(async () => {
      await flushSentry();
      console.log('Server closed');
      process.exit(0);
    });
  });
}

export default app;
