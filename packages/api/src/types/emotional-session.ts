export type EmotionalFeatureId =
  | 'mood-sculptor'
  | 'empathy-mirror'
  | 'cognitive-reframer'
  | 'bubble-burster'
  | 'memory-harmonizer'
  | 'future-pathfinder';

export interface EmotionalMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EmotionalSessionRequest {
  featureId: EmotionalFeatureId;
  message: string;
  history?: EmotionalMessage[];
}

export interface EmotionalSessionResponse {
  reply: string;
  routedAgents: string[];
  featureId: EmotionalFeatureId;
  meta?: Record<string, unknown>;
}
