import { Router, Request, Response } from 'express';
import { leadershipSessionService } from '../leadership/leadership-session.service';
import { LeadershipSessionRequest } from '../types/leadership-session';

const leadershipSessionRouter = Router();

leadershipSessionRouter.post('/em-ai/leadership-session', async (req: Request, res: Response) => {
  const { featureId, message, history } = req.body as LeadershipSessionRequest;

  if (!featureId || !message) {
    return res.status(400).json({
      success: false,
      error: 'featureId and message are required.',
    });
  }

  try {
    const result = await leadershipSessionService.runSession({ featureId, message, history });
    return res.json(result);
  } catch (error) {
    console.error('[Leadership Session] Failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default leadershipSessionRouter;
