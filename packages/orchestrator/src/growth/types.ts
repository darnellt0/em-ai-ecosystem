/**
 * Growth Agent Orchestrator - Type Definitions
 * Defines all types for the 5 Growth Agents (Journal, Niche, Mindset, Rhythm, Purpose)
 */

/**
 * Context passed to each Growth Agent during execution
 */
export interface OrchestratorRunContext {
  userId: string;
  email?: string;
  userName?: string;
  timestamp?: string;
  [key: string]: any; // Allow additional context properties
}

/**
 * Result returned by each Growth Agent after execution
 */
export interface GrowthAgentResult {
  success: boolean;
  errors?: string[];
  artifacts?: Record<string, any>; // URLs, IDs, summaries, etc.
  startedAt: string;
  completedAt: string;
  retries: number;
}

/**
 * Phase of the Growth journey (maps to EM methodology)
 */
export type GrowthPhase = 'Rooted' | 'Grounded' | 'Radiant';

/**
 * Keys for the 5 Growth Agents
 */
export type GrowthAgentKey = 'journal' | 'niche' | 'mindset' | 'rhythm' | 'purpose';

/**
 * Configuration for a single Growth Agent
 */
export interface GrowthAgentConfig {
  key: GrowthAgentKey;
  displayName: string;
  phase: GrowthPhase;
  priority: number;
  description: string;
  runAgent: (input: OrchestratorRunContext) => Promise<GrowthAgentResult>;
}

/**
 * Status of an agent's readiness
 */
export type AgentStatus = 'idle' | 'running' | 'ready' | 'error';

/**
 * Health information for a single agent
 */
export interface AgentHealth {
  key: GrowthAgentKey;
  displayName: string;
  phase: GrowthPhase;
  status: AgentStatus;
  ready: boolean;
  lastUpdated?: string;
  lastError?: string;
  runCount?: number;
}

/**
 * Overall orchestrator health status
 */
export interface OrchestratorHealth {
  redisConnected: boolean;
  agents: AgentHealth[];
  timestamp: string;
}

/**
 * Readiness summary for all agents
 */
export interface ReadinessSummary {
  journal: boolean;
  niche: boolean;
  mindset: boolean;
  rhythm: boolean;
  purpose: boolean;
  allReady: boolean;
  timestamp: string;
}

/**
 * Progress event for tracking agent execution
 */
export interface ProgressEvent {
  agentKey: GrowthAgentKey;
  timestamp: string;
  message: string;
  progress?: number; // 0-100
  data?: any;
}

/**
 * Summary of an orchestrator run
 */
export interface OrchestratorRunSummary {
  success: boolean;
  startedAt: string;
  completedAt: string;
  results: Record<GrowthAgentKey, GrowthAgentResult>;
  totalAgents: number;
  successfulAgents: number;
  failedAgents: number;
  errors: string[];
}

/**
 * Storage interface for orchestrator state (Redis or in-memory)
 */
export interface OrchestratorStorage {
  setStatus(key: GrowthAgentKey, status: AgentStatus): Promise<void>;
  getStatus(key: GrowthAgentKey): Promise<AgentStatus | null>;
  setReady(key: GrowthAgentKey, ready: boolean): Promise<void>;
  getReady(key: GrowthAgentKey): Promise<boolean>;
  addProgress(key: GrowthAgentKey, event: ProgressEvent): Promise<void>;
  getProgress(key: GrowthAgentKey, limit?: number): Promise<ProgressEvent[]>;
  setLastError(key: GrowthAgentKey, error: string): Promise<void>;
  getLastError(key: GrowthAgentKey): Promise<string | null>;
  incrementRunCount(key: GrowthAgentKey): Promise<number>;
  getRunCount(key: GrowthAgentKey): Promise<number>;
  isConnected(): Promise<boolean>;
}
