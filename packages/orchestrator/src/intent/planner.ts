import { IntentClassifier } from './classifier';
import { resolveReferents } from './context';
import { IntentClassification, PlanningResult, PlanStep, SessionTurn } from './types';

const MULTI_STEP_SPLIT_REGEX = /\b(?:then|after that|and then|and afterwards|next)\b/i;

function splitUtterance(text: string): string[] {
  if (!MULTI_STEP_SPLIT_REGEX.test(text)) {
    return [text];
  }

  return text
    .split(/\b(?:then|after that|and then|and afterwards|next)\b/gi)
    .map((segment) => segment.replace(/^[,\s]+|[,\s]+$/g, ''))
    .filter((segment) => segment.length > 0);
}

export async function createPlan(
  text: string,
  sessionTurns: SessionTurn[] = [],
  classifier: IntentClassifier = new IntentClassifier(),
  seedClassification?: IntentClassification,
): Promise<PlanningResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isMultiStep: false, steps: [], reasoning: ['No text provided'] };
  }

  const segments = splitUtterance(trimmed);

  if (segments.length === 1) {
    const classification =
      seedClassification ?? (await classifier.classify(trimmed, resolveReferents(trimmed, sessionTurns)));
    return {
      isMultiStep: false,
      steps: [
        {
          intent: classification.intent,
          params: classification.entities,
          summary: classification.humanSummary,
        },
      ],
      reasoning: classification.reasoning,
    };
  }

  const steps: PlanStep[] = [];
  const reasoning: string[] = [`Detected multi-step utterance with ${segments.length} segments`];

  for (const segment of segments) {
    const referents = resolveReferents(segment, sessionTurns);
    const classification = await classifier.classify(segment, referents);
    steps.push({ intent: classification.intent, params: classification.entities, summary: classification.humanSummary });
    reasoning.push(...classification.reasoning);
  }

  return {
    isMultiStep: steps.length > 1,
    steps,
    reasoning,
  };
}
