export type LeadershipFeatureId =
  | 'mood-sculptor'
  | 'empathy-mirror'
  | 'cognitive-reframer'
  | 'bubble-burster'
  | 'memory-harmonizer'
  | 'future-pathfinder';

export interface LeadershipMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LeadershipSessionRequest {
  featureId: LeadershipFeatureId;
  message: string;
  history?: LeadershipMessage[];
}

export interface LeadershipSessionResponse {
  reply: string;
  routedAgents: string[];
  featureId: LeadershipFeatureId;
  meta?: Record<string, unknown>;
}
