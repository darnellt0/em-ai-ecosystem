import express from 'express';
import { getAgent } from '../../orchestrator/src/registry/agent-registry';
import { runAgentsConcurrently } from '../../orchestrator/src/dispatcher';
import { savePlannedAction } from '../actions/action.store';
import { ensureP1AgentsRegistered } from '../orchestrator/registerP1Agents';

const router = express.Router();

router.post('/api/exec-admin/p1/run', async (req, res) => {
  try {
    ensureP1AgentsRegistered();
    const { userId, agentKey, input } = req.body || {};
    if (!agentKey || !getAgent(agentKey)) {
      return res.status(400).json({ success: false, error: 'agentKey is required and must be registered' });
    }
    const payload = { userId, ...(input || {}) };
    const results = await runAgentsConcurrently([{ key: agentKey, payload }]);
    const result = results[agentKey];

    const plannedIds: string[] = [];
    if (result?.output?.suggestedActions) {
      result.output.suggestedActions.forEach((a: any) => {
        const planned = savePlannedAction({
          type: a.type || 'task.create',
          requiresApproval: true,
          payload: { detail: a.detail, title: a.title, agentKey },
          risk: 'medium',
          priority: 'medium',
        });
        plannedIds.push(planned.id);
      });
    }

    return res.json({ success: true, output: result?.output, plannedActionIds: plannedIds });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
