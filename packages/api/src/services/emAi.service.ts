export interface CallEmAgentRequest {
  agentId: string;
  orchestratorKey: string;
  mode?: 'single' | 'orchestrated';
  input: Record<string, any>;
}

export interface CallEmAgentResponse {
  outputText: string;
  meta?: Record<string, any>;
}

/**
 * Bridges API requests to the EM AI orchestrator / agent layer.
 * TODO: Wire this up to the real GrowthOrchestrator or Executive Admin service once available.
 */
export async function callEmAgent(request: CallEmAgentRequest): Promise<CallEmAgentResponse> {
  const { agentId, orchestratorKey, mode = 'single', input } = request;

  // Placeholder implementation so the UI can function end-to-end.
  // Replace with real orchestrator integration (e.g., GrowthOrchestrator, Executive Admin, etc.).
  return {
    outputText: `[Stubbed response from ${agentId}] Input:\n\n${JSON.stringify(input, null, 2)}`,
    meta: {
      agentId,
      orchestratorKey,
      mode,
    },
  };
}
