export type VoiceIntent =
  | 'scheduler.block'
  | 'scheduler.confirm'
  | 'scheduler.reschedule'
  | 'coach.pause'
  | 'support.logComplete'
  | 'support.followUp'
  | 'unknown';

export interface IntentEntities {
  founder?: string;
  minutes?: number;
  time?: string;
  date?: string;
  title?: string;
  eventId?: string;
  taskId?: string;
  followUpDate?: string;
  [key: string]: unknown;
}

export interface IntentClassification {
  intent: VoiceIntent;
  confidence: number;
  entities: IntentEntities;
  reasoning: string[];
  usedFallback: boolean;
  humanSummary: string;
}

export interface SessionTurn {
  text: string;
  intent?: VoiceIntent;
  entities?: IntentEntities;
}

export interface PlanStep {
  intent: VoiceIntent;
  params: IntentEntities;
  summary: string;
}

export interface PlanningResult {
  isMultiStep: boolean;
  steps: PlanStep[];
  reasoning: string[];
}
