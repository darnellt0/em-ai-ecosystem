import express from 'express';
import { listAgents } from '../../orchestrator/src/registry/agent-registry';

const router = express.Router();

router.get('/api/system/health', async (_req, res) => {
  try {
    const agents = listAgents();
    const flags = {
      ENABLE_ACTION_EXECUTION: process.env.ENABLE_ACTION_EXECUTION === 'true',
      ENABLE_CALENDAR_WRITES: process.env.ENABLE_CALENDAR_WRITES === 'true',
      ENABLE_GMAIL_DRAFTS: process.env.ENABLE_GMAIL_DRAFTS === 'true',
      ENABLE_GMAIL_SEND: process.env.ENABLE_GMAIL_SEND === 'true',
      ENABLE_SHEETS_WRITES: process.env.ENABLE_SHEETS_WRITES === 'true',
    };
    res.json({
      success: true,
      environment: process.env.NODE_ENV || 'development',
      agentCount: agents.length,
      qaLastStatus: 'unknown',
      featureFlags: flags,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api/agents/registry', async (_req, res) => {
  const agents = listAgents().map((a) => ({
    key: a.key,
    description: a.description || '',
  }));
  res.json({ success: true, agents, count: agents.length });
});

export default router;
