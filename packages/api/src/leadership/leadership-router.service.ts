import { LeadershipFeatureId } from '../types/leadership-session';

const FEATURE_AGENT_MAP: Record<LeadershipFeatureId, string[]> = {
  'mood-sculptor': ['growth.mindset', 'growth.rhythm'],
  'empathy-mirror': ['growth.mindset'],
  'cognitive-reframer': ['growth.mindset'],
  'bubble-burster': ['growth.mindset'],
  'memory-harmonizer': ['growth.journal', 'growth.rhythm'],
  'future-pathfinder': ['growth.purpose', 'growth.niche'],
};

export function mapFeatureToLeadershipAgents(featureId: LeadershipFeatureId): string[] {
  const agents = FEATURE_AGENT_MAP[featureId];
  if (!agents) {
    throw new Error(`Unknown leadership feature "${featureId}"`);
  }
  return agents;
}

export function listLeadershipFeatures(): LeadershipFeatureId[] {
  return Object.keys(FEATURE_AGENT_MAP) as LeadershipFeatureId[];
}
