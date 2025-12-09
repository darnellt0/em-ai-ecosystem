import { Router, Request, Response } from 'express';
import { emotionalSessionService } from '../emotional/emotional-session.service';
import { EmotionalSessionRequest } from '../types/emotional-session';

const emotionalSessionRouter = Router();

emotionalSessionRouter.post('/em-ai/emotional-session', async (req: Request, res: Response) => {
  const { featureId, message, history } = req.body as EmotionalSessionRequest;

  if (!featureId || !message) {
    return res.status(400).json({
      success: false,
      error: 'featureId and message are required.',
    });
  }

  try {
    const result = await emotionalSessionService.runSession({ featureId, message, history });
    return res.json(result);
  } catch (error) {
    console.error('[Emotional Session] Failed:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default emotionalSessionRouter;
