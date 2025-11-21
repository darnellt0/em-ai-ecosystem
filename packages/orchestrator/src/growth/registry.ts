/**
 * Growth Agent Registry
 * Registers all 5 Growth Agents with the orchestrator
 */

import { GrowthAgentConfig } from './types';
import { runJournalAgent } from './agents/journal-agent';
import { runNicheAgent } from './agents/niche-agent';
import { runMindsetAgent } from './agents/mindset-agent';
import { runRhythmAgent } from './agents/rhythm-agent';
import { runPurposeAgent } from './agents/purpose-agent';

/**
 * Registry of all 5 Growth Agents
 * Sorted by priority for execution order
 */
export const GROWTH_AGENTS: GrowthAgentConfig[] = [
  // Priority 1: Rooted Phase - Foundation agents
  {
    key: 'journal',
    displayName: 'Journal Agent',
    phase: 'Rooted',
    priority: 1,
    description: 'Daily Alignment Journal - Helps users reflect and align through journaling',
    runAgent: runJournalAgent,
  },
  {
    key: 'rhythm',
    displayName: 'Rhythm Agent',
    phase: 'Rooted',
    priority: 2,
    description: 'Rest & Rhythm Planner - Finds balance between productivity and rest',
    runAgent: runRhythmAgent,
  },

  // Priority 3-4: Grounded Phase - Growth agents
  {
    key: 'niche',
    displayName: 'Niche Agent',
    phase: 'Grounded',
    priority: 3,
    description: 'Niche Navigator - Helps discover and clarify unique niche',
    runAgent: runNicheAgent,
  },
  {
    key: 'mindset',
    displayName: 'Mindset Agent',
    phase: 'Grounded',
    priority: 4,
    description: 'Mindset Shift Mentor - Reframes limiting beliefs and develops empowering mindsets',
    runAgent: runMindsetAgent,
  },

  // Priority 5: Radiant Phase - Purpose agent
  {
    key: 'purpose',
    displayName: 'Purpose Agent',
    phase: 'Radiant',
    priority: 5,
    description: 'Purpose Pathfinder - Discovers and articulates core purpose through Ikigai',
    runAgent: runPurposeAgent,
  },
];

/**
 * Get agent by key
 */
export function getAgentByKey(key: string): GrowthAgentConfig | undefined {
  return GROWTH_AGENTS.find((agent) => agent.key === key);
}

/**
 * Get agents by phase
 */
export function getAgentsByPhase(phase: 'Rooted' | 'Grounded' | 'Radiant'): GrowthAgentConfig[] {
  return GROWTH_AGENTS.filter((agent) => agent.phase === phase);
}
