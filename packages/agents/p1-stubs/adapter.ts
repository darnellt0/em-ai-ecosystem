import { AgentOutput } from '../../shared/contracts';

function makeStubOutput(agentKey: string, description: string): AgentOutput {
  return {
    status: 'SKIPPED',
    output: {
      summary: `${description} is not fully implemented yet.`,
      suggestedActions: [],
      blockReason: 'BLOCKED_DEPENDENCY',
    },
    warnings: [`${agentKey} running as stub adapter (blocked)`],
  };
}

export function runP1StubAdapter(agentKey: string, description: string) {
  return async (): Promise<AgentOutput> => makeStubOutput(agentKey, description);
}
