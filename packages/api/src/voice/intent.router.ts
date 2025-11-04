import { Router, Request, Response } from 'express';
import { IntentClassifier, createPlan, resolveReferents } from '@em/orchestrator';
import type { PlanningResult, SessionTurn } from '@em/orchestrator';

const router = Router();
const classifier = new IntentClassifier();

interface IntentRequestBody {
  founder?: string;
  text?: string;
  sessionTurns?: SessionTurn[];
}

function buildClarificationAction(text: string) {
  return {
    suggestion: `Could you clarify what you would like me to do with "${text}"?`,
  };
}

function planToNextBestAction(plan: PlanningResult) {
  if (!plan.isMultiStep) {
    return undefined;
  }

  return plan.steps.map((step) => ({ intent: step.intent, params: step.params, summary: step.summary }));
}

router.post('/intent', async (req: Request<unknown, unknown, IntentRequestBody>, res: Response) => {
  try {
    const { founder, text, sessionTurns = [] } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'text is required',
      });
    }

    const referents = resolveReferents(text, sessionTurns);
    const classification = await classifier.classify(text, { founder, ...referents });
    const plan = await createPlan(text, sessionTurns, classifier);

    if (plan.isMultiStep) {
      return res.status(200).json({
        status: 'multi_step',
        intent: 'plan',
        entities: classification.entities,
        humanSummary: 'Generated multi-step plan',
        nextBestAction: planToNextBestAction(plan),
      });
    }

    if (classification.intent === 'unknown') {
      return res.status(200).json({
        status: 'needs_clarification',
        intent: 'unknown',
        entities: classification.entities,
        humanSummary: 'I need a bit more detail to help with that.',
        nextBestAction: buildClarificationAction(text),
      });
    }

    return res.status(200).json({
      status: 'ok',
      intent: classification.intent,
      entities: classification.entities,
      humanSummary: classification.humanSummary,
    });
  } catch (error) {
    console.error('[voice.intent] Failed to classify intent', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to classify voice intent',
    });
  }
});

export default router;
