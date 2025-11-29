import { Router, Request, Response } from 'express';
import { emAiAgentsCatalog, getEmAiAgentConfig } from '../config/emAiAgents.catalog';
import { callEmAgent } from '../services/emAi.service';

const emAiAgentsRouter = Router();

/**
 * GET /em-ai/agents
 * Returns the full catalog for gallery views.
 */
emAiAgentsRouter.get('/', (_req: Request, res: Response) => {
  res.json({ agents: emAiAgentsCatalog });
});

/**
 * GET /em-ai/agents/:id
 * Returns a single agent configuration.
 */
emAiAgentsRouter.get('/:id', (req: Request, res: Response) => {
  const agent = getEmAiAgentConfig(req.params.id);

  if (!agent) {
    return res.status(404).json({
      error: 'Agent not found',
      agentId: req.params.id,
    });
  }

  return res.json({ agent });
});

/**
 * POST /em-ai/agents/:id/run
 * Executes the agent through the EM AI orchestrator/service layer.
 */
emAiAgentsRouter.post('/:id/run', async (req: Request, res: Response) => {
  const agent = getEmAiAgentConfig(req.params.id);

  if (!agent) {
    return res.status(404).json({
      error: 'Agent not found',
      agentId: req.params.id,
    });
  }

  const input = (req.body && typeof req.body.input === 'object' ? req.body.input : {}) as Record<string, any>;

  try {
    const result = await callEmAgent({
      agentId: agent.id,
      orchestratorKey: agent.orchestratorKey,
      mode: agent.mode ?? 'single',
      input,
    });

    return res.json({
      agentId: agent.id,
      result,
    });
  } catch (error) {
    console.error(`[EM AI] Failed to run agent ${agent.id}`, error);
    return res.status(500).json({
      error: 'Failed to run agent',
      agentId: agent.id,
      details: (error as Error).message,
    });
  }
});

export default emAiAgentsRouter;
