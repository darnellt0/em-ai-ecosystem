import express, { Request, Response } from 'express';
import { executeActionPack } from '../services/actionPackExecutor.service';

const router = express.Router();

router.post('/api/exec-admin/p1/execute-action-pack', async (req: Request, res: Response) => {
  try {
    const { userId, runId, actionPack, actions, force } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const result = await executeActionPack({ userId, runId, actionPack, actions, force });
    if (!result.success) {
      const status = result.statusCode || 400;
      return res.status(status).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      runId: result.runId,
      executionResults: result.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
