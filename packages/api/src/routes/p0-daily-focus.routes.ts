import express, { Request, Response } from 'express';
import { runP0DailyFocusExecAdmin } from '../exec-admin/flows/p0-daily-focus';

const router = express.Router();

router.post('/api/exec-admin/p0/daily-focus', async (req: Request, res: Response) => {
  try {
    const { userId, mode, tone, force } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const result = await runP0DailyFocusExecAdmin({ userId, mode, tone, force });
    return res.json({
      success: true,
      qaStatus: result.data?.qaStatus,
      confidenceScore: result.data?.confidenceScore,
      runId: result.runId,
      data: result.data,
      intent: result.intent,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
