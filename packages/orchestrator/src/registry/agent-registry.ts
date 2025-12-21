import { AgentOutput } from '../../../shared/contracts';

export type AgentRunFn = (payload: any) => Promise<AgentOutput<any>>;
export type AgentHealthFn = () => Promise<{ status: string; details?: any }>;

export interface AgentDefinition {
  key: string;
  description?: string;
  status?: 'active' | 'frozen';
  inputContract?: string;
  outputContract?: string;
  run: AgentRunFn;
  health?: AgentHealthFn;
}

const REGISTRY: Record<string, AgentDefinition> = {};

export function registerAgent(def: AgentDefinition) {
  REGISTRY[def.key] = def;
}

export function getAgent(key: string): AgentDefinition | undefined {
  return REGISTRY[key];
}

export function listAgents(): AgentDefinition[] {
  return Object.values(REGISTRY);
}
