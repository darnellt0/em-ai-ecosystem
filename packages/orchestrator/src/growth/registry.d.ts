/**
 * Growth Agent Registry
 * Registers all 5 Growth Agents with the orchestrator
 */
import { GrowthAgentConfig } from './types';
/**
 * Registry of all 5 Growth Agents
 * Sorted by priority for execution order
 */
export declare const GROWTH_AGENTS: GrowthAgentConfig[];
/**
 * Get agent by key
 */
export declare function getAgentByKey(key: string): GrowthAgentConfig | undefined;
/**
 * Get agents by phase
 */
export declare function getAgentsByPhase(phase: 'Rooted' | 'Grounded' | 'Radiant'): GrowthAgentConfig[];
//# sourceMappingURL=registry.d.ts.map