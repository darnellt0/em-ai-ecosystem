import { dispatchExecAdminAgent, ExecAdminAgentAdapterContext } from './execAdminAgentAdapter.service';

export interface ExecAdminRequest {
  agentKey: string;
  mode: 'single' | 'orchestrated';
  payload: Record<string, any>;
  source?: string;
  userContext?: Record<string, any>;
}

export interface ExecAdminResponse {
  outputText?: string;
  summary?: string;
  message?: string;
  raw?: any;
}

export async function callEmExecutiveAdmin(request: ExecAdminRequest): Promise<ExecAdminResponse> {
  const { agentKey, mode, payload, userContext } = request;

  const ctx: ExecAdminAgentAdapterContext = {
    mode,
    payload,
    userContext,
  };

  const adapterResult = await dispatchExecAdminAgent(agentKey, ctx);

  if (typeof adapterResult === 'string') {
    return { outputText: adapterResult, raw: adapterResult };
  }

  if (adapterResult && typeof adapterResult === 'object') {
    return {
      outputText:
        (adapterResult as any).outputText ?? (adapterResult as any).summary ?? (adapterResult as any).message,
      summary: (adapterResult as any).summary,
      message: (adapterResult as any).message,
      raw: adapterResult,
    };
  }

  return {
    outputText: String(adapterResult),
    raw: adapterResult,
  };
}
