import { EmotionalFeatureId } from '../types/emotional-session';

// Map Emotional Hub features to existing growth agent keys (growth.*)
const FEATURE_AGENT_MAP: Record<EmotionalFeatureId, string[]> = {
  'mood-sculptor': ['growth.journal', 'growth.mindset'],
  'empathy-mirror': ['growth.mindset'],
  'cognitive-reframer': ['growth.mindset'],
  'bubble-burster': ['growth.mindset'],
  'memory-harmonizer': ['growth.journal', 'growth.rhythm'],
  'future-pathfinder': ['growth.purpose', 'growth.niche'],
};

export function mapFeatureToAgents(featureId: EmotionalFeatureId): string[] {
  const agents = FEATURE_AGENT_MAP[featureId];
  if (!agents) {
    throw new Error(`Unknown emotional feature "${featureId}"`);
  }
  return agents;
}

export function listSupportedFeatures(): EmotionalFeatureId[] {
  return Object.keys(FEATURE_AGENT_MAP) as EmotionalFeatureId[];
}
