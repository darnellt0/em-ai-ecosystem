import { Router, Request, Response } from 'express';
import { launchGrowthPack, getGrowthStatus } from '../services/emAi.service';

const emAiExecAdminRouter = Router();

emAiExecAdminRouter.post('/em-ai/exec-admin/growth/run', async (req: Request, res: Response) => {
  const { founderEmail, mode } = req.body || {};

  if (!founderEmail) {
    return res.status(400).json({
      success: false,
      error: 'founderEmail is required.',
    });
  }

  try {
    const result = await launchGrowthPack({ founderEmail, mode });
    return res.json(result);
  } catch (error) {
    console.error('[Exec Admin] Growth run failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

emAiExecAdminRouter.get('/em-ai/exec-admin/growth/status', async (_req: Request, res: Response) => {
  try {
    const status = await getGrowthStatus();
    return res.json(status);
  } catch (error) {
    console.error('[Exec Admin] Growth status failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default emAiExecAdminRouter;
