import express from 'express';
import { getAllAgentIds } from '../growth-agents/agent-registry';

const router = express.Router();

router.get('/api/system/health', async (_req, res) => {
  try {
    const agents = getAllAgentIds();
    const flags = {
      ENABLE_ACTION_EXECUTION: process.env.ENABLE_ACTION_EXECUTION === 'true',
      ENABLE_CALENDAR_WRITES: process.env.ENABLE_CALENDAR_WRITES === 'true',
      ENABLE_GMAIL_DRAFTS: process.env.ENABLE_GMAIL_DRAFTS === 'true',
      ENABLE_GMAIL_SEND: process.env.ENABLE_GMAIL_SEND === 'true',
      ENABLE_SHEETS_WRITES: process.env.ENABLE_SHEETS_WRITES === 'true',
    };
    res.json({
      ok: true,
      service: 'api',
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
  const agentIds = getAllAgentIds();
  const agents = agentIds.map((id) => ({
    key: id,
    description: '',
  }));
  res.json({ success: true, agents, count: agents.length });
});

export default router;
