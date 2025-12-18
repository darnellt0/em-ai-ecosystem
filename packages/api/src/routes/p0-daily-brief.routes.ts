import express, { Request, Response } from 'express';
import { runP0DailyBriefExecAdmin } from '../exec-admin/flows/p0-daily-brief';

const router = express.Router();

router.post('/exec-admin/p0/daily-brief', async (req: Request, res: Response) => {
  try {
    const { user, date, runId } = req.body || {};
    if (!user || !['darnell', 'shria'].includes(user)) {
      return res.status(400).json({ success: false, error: 'user must be one of darnell|shria' });
    }
    const brief = await runP0DailyBriefExecAdmin({ user, date, runId });
    return res.json(brief);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'daily brief failed' });
  }
});

export default router;
