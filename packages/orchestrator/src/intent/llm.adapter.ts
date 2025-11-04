import { IntentClassification, IntentEntities, VoiceIntent } from './types';

export interface LLMClassificationResult {
  intent: VoiceIntent;
  confidence: number;
  entities: IntentEntities;
  reasoning: string;
}

export class LLMAdapter {
  /**
   * Placeholder LLM adapter. In production this would call the real LLM service.
   */
  static async classify(text: string): Promise<LLMClassificationResult> {
    // TODO: Wire up real model or remote service
    return {
      intent: 'unknown',
      confidence: 0.25,
      entities: {},
      reasoning: `LLM fallback not implemented. Unable to classify: "${text}"`,
    };
  }
}

export function applyLLMFallback(result: LLMClassificationResult): IntentClassification {
  return {
    intent: result.intent,
    confidence: result.confidence,
    entities: result.entities,
    reasoning: [result.reasoning],
    usedFallback: true,
    humanSummary: 'LLM fallback result',
  };
}
