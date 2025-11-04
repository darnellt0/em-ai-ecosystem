import express, { Request, Response } from 'express';

const router = express.Router();

interface IntentRequestBody {
  text: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

interface IntentMatch {
  intent: string;
  endpoint: string;
  summary: string;
  confidence: number;
}

const classifyIntent = (text: string): IntentMatch | null => {
  const normalized = text.toLowerCase();

  const rules: Array<{ intent: string; keywords: string[]; endpoint: string; summary: string }> = [
    {
      intent: 'focus_block',
      keywords: ['focus', 'block time', 'deep work'],
      endpoint: '/api/voice/scheduler/block',
      summary: 'Block time on the calendar for focused work',
    },
    {
      intent: 'meeting_confirm',
      keywords: ['confirm meeting', 'i will attend', 'count me in'],
      endpoint: '/api/voice/scheduler/confirm',
      summary: 'Confirm attendance for a scheduled meeting',
    },
    {
      intent: 'meeting_reschedule',
      keywords: ['reschedule', 'move meeting', 'change meeting'],
      endpoint: '/api/voice/scheduler/reschedule',
      summary: 'Request to reschedule a meeting',
    },
    {
      intent: 'mindfulness_pause',
      keywords: ['meditation', 'pause coach', 'take a pause'],
      endpoint: '/api/voice/coach/pause',
      summary: 'Start a guided mindfulness or pause session',
    },
    {
      intent: 'task_complete',
      keywords: ['mark done', 'task complete', 'finished the task'],
      endpoint: '/api/voice/support/log-complete',
      summary: 'Log completion of a task or activity',
    },
    {
      intent: 'follow_up',
      keywords: ['follow up', 'remind me', 'set reminder'],
      endpoint: '/api/voice/support/follow-up',
      summary: 'Create a follow-up reminder',
    },
  ];

  for (const rule of rules) {
    const hits = rule.keywords.filter((keyword) => normalized.includes(keyword));
    if (hits.length > 0) {
      const confidence = Math.min(0.2 + hits.length * 0.2, 0.95);
      return {
        intent: rule.intent,
        endpoint: rule.endpoint,
        summary: rule.summary,
        confidence,
      };
    }
  }

  return null;
};

router.post('/intent', (req: Request, res: Response) => {
  const { text, sessionId, metadata } = req.body as IntentRequestBody;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'invalid_payload',
      message: 'Request body must include a non-empty text field.',
    });
  }

  const match = classifyIntent(text);

  if (!match) {
    return res.status(422).json({
      success: false,
      error: 'intent_not_found',
      message: 'Unable to classify the provided utterance.',
      text,
    });
  }

  const response = {
    success: true,
    intent: match.intent,
    endpoint: match.endpoint,
    summary: match.summary,
    confidence: match.confidence,
    sessionId: sessionId ?? null,
    metadata: metadata ?? null,
    receivedAt: new Date().toISOString(),
    text,
  };

  console.log(
    `[INTENT] ${response.intent} (${(response.confidence * 100).toFixed(0)}%) -> ${response.endpoint}`,
  );

  return res.status(200).json(response);
});

export default router;
