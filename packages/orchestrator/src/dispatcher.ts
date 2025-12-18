import { AgentOutput } from '../../shared/contracts';
import { AgentDefinition, getAgent } from './registry/agent-registry';

export interface AgentCallRequest {
  key: string;
  payload?: Record<string, any>;
}

export interface AgentCallResult {
  key: string;
  success: boolean;
  status: 'OK' | 'SKIPPED' | 'FAILED';
  output?: any;
  error?: string;
  warnings?: string[];
  usedStub?: boolean;
}

export async function runAgentsConcurrently(requests: AgentCallRequest[]): Promise<Record<string, AgentCallResult>> {
  const entries = await Promise.all(
    requests.map(async (req) => {
      const agent: AgentDefinition | undefined = getAgent(req.key);
      if (!agent) {
        return [
          req.key,
          {
            key: req.key,
            success: false,
            status: 'SKIPPED',
            warnings: ['Agent not registered'],
            usedStub: true,
          } as AgentCallResult,
        ];
      }

      try {
        const result = (await agent.run(req.payload || {})) as AgentOutput<any>;
        const status: AgentCallResult['status'] =
          result.status === 'FAILED' ? 'FAILED' : result.status === 'SKIPPED' ? 'SKIPPED' : 'OK';
        return [
          req.key,
          {
            key: req.key,
            success: status === 'OK',
            status,
            output: result.output,
            error: result.error,
            warnings: result.warnings,
            usedStub: false,
          } as AgentCallResult,
        ];
      } catch (err: any) {
        return [
          req.key,
          {
            key: req.key,
            success: false,
            status: 'FAILED',
            error: err.message,
            usedStub: false,
          } as AgentCallResult,
        ];
      }
    })
  );
  return Object.fromEntries(entries);
}
