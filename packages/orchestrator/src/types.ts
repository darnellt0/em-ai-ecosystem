export interface OrchestratorRequest<T = any> {
  flow: string;
  payload: T;
  userId?: string;
  [key: string]: any;
}

export interface OrchestratorResponse<T = any> {
  success: boolean;
  output?: T;
  error?: string;
}

export interface AgentCall {
  key: string;
  payload?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  output?: any;
  status?: string;
  error?: string;
  warnings?: string[];
}
