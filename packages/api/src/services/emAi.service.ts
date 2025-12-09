import { callEmExecutiveAdmin, ExecAdminRequest } from './executiveAdmin.service';
import { createTraceContext } from '../utils/tracing';

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
  * Bridges UI agent calls to the Executive Admin front door.
  */
export async function callEmAgent(request: CallEmAgentRequest): Promise<CallEmAgentResponse> {
  const { agentId, orchestratorKey, mode = 'single', input } = request;

  const trace = createTraceContext('callEmAgent', { agentId, orchestratorKey, mode });
  const start = Date.now();

  try {
    const execAdminRequest: ExecAdminRequest = {
      agentKey: orchestratorKey,
      mode,
      payload: input,
      source: 'ui-agent-run',
      userContext: {},
    };

    const execAdminResponse = await callEmExecutiveAdmin(execAdminRequest);
    const durationMs = Date.now() - start;

    console.info(
      JSON.stringify({
        level: 'info',
        event: 'agent_run_complete',
        traceId: trace.traceId,
        agentId,
        orchestratorKey,
        mode,
        durationMs,
        source: execAdminRequest.source,
        success: true,
      })
    );

    const text =
      execAdminResponse.outputText ??
      execAdminResponse.summary ??
      execAdminResponse.message ??
      JSON.stringify(execAdminResponse, null, 2);

    return {
      outputText: text,
      meta: {
        agentId,
        orchestratorKey,
        mode,
        raw: execAdminResponse,
        traceId: trace.traceId,
        durationMs,
      },
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'agent_run_error',
        traceId: trace.traceId,
        agentId,
        orchestratorKey,
        mode,
        durationMs,
        errorName: err?.name,
        errorMessage: err?.message,
      })
    );
    throw err;
  }
}
