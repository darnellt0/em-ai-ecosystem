import { Router, Request, Response } from 'express';
import { runP0DailyFocusExecAdmin } from '../exec-admin/flows/p0-daily-focus';

const execAdminRouter = Router();

execAdminRouter.post('/em-ai/exec-admin', async (req: Request, res: Response) => {
  try {
    const { intent, payload } = req.body || {};
    if (!intent) {
      return res.status(400).json({ success: false, error: 'intent is required' });
    }
    if (intent === 'p0.daily_focus') {
      const { userId, mode, tone } = payload || {};
      if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
      const result = await runP0DailyFocusExecAdmin({ userId, mode, tone });
      return res.json({ success: true, intent, data: result.data, qaStatus: result.data?.qaStatus });
    }
    return res.status(400).json({ success: false, error: 'Unsupported intent', intent });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default execAdminRouter;
