import { Router, Request, Response } from 'express';
import { listP0Runs, getP0Run } from '../services/p0RunHistory.service';

const router = Router();

router.get('/em-ai/exec-admin/p0/runs', async (req: Request, res: Response) => {
  const founderEmail = (req.query.founderEmail as string) || process.env.FOUNDER_SHRIA_EMAIL || process.env.FOUNDER_DARNELL_EMAIL || 'darnell';
  const kind = (req.query.kind as string) || undefined;
  try {
    const runs = await listP0Runs(founderEmail || 'founder@example.com', Number(req.query.limit) || 10, kind);
    return res.json({ success: true, runs, kind, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
  }
});

router.get('/em-ai/exec-admin/p0/runs/:runId', async (req: Request, res: Response) => {
  try {
    const run = await getP0Run(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    return res.json({ success: true, run, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
  }
});

router.get('/exec-admin/p0/daily-brief/runs', async (req: Request, res: Response) => {
  const founderEmail = (req.query.founderEmail as string) || process.env.FOUNDER_SHRIA_EMAIL || process.env.FOUNDER_DARNELL_EMAIL || 'darnell';
  try {
    const runs = await listP0Runs(founderEmail || 'founder@example.com', Number(req.query.limit) || 20, 'p0.daily_brief');
    return res.json({ success: true, runs, kind: 'p0.daily_brief', timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
  }
});

router.get('/exec-admin/p0/daily-brief/runs/:runId', async (req: Request, res: Response) => {
  try {
    const run = await getP0Run(req.params.runId);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found', timestamp: new Date().toISOString() });
    return res.json({ success: true, run, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
  }
});

export default router;
