declare module "@em/orchestrator" {
  import type {
    IntentClassification,
    IntentEntities,
    PlanningResult,
    PlanStep,
    SessionTurn,
    VoiceIntent,
  } from "../../../orchestrator/src/intent/types";

  export type {
    IntentClassification,
    IntentEntities,
    PlanningResult,
    PlanStep,
    SessionTurn,
    VoiceIntent,
  };

  export class IntentClassifier {
    classify(
      text: string,
      baseEntities?: IntentEntities,
    ): Promise<IntentClassification>;
  }

  export function resolveReferents(
    text: string,
    sessionTurns?: SessionTurn[],
  ): IntentEntities;

  export function createPlan(
    text: string,
    sessionTurns?: SessionTurn[],
    classifier?: IntentClassifier,
    seedClassification?: IntentClassification,
  ): Promise<PlanningResult>;
}
