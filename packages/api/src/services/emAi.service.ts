import { callEmExecutiveAdmin, ExecAdminRequest } from './executiveAdmin.service';
import { createTraceContext } from '../utils/tracing';
import { orchestrator, AGENT_CONFIG } from '../growth-agents/orchestrator';
import { savePlannedAction } from '../actions/action.store';
import { recordGrowthRunStart, listGrowthRuns, getGrowthRun } from './growthRunHistory.service';

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

export interface GrowthPackRequest {
  founderEmail: string;
  mode?: 'full';
}

export interface GrowthPackResult {
  success: boolean;
  mode: string;
  launchedAgents: string[];
  jobIds: string[];
  timestamp: string;
  runId: string;
  plannedActionIds?: string[];
}

export interface GrowthPackStatus {
  success: boolean;
  environment: string;
  agentRegistryCount: number;
  agents: string[];
  recentProgress: any[];
  recentEvents: any[];
  timestamp: string;
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

export async function launchGrowthPack(req: GrowthPackRequest): Promise<GrowthPackResult> {
  const mode = req.mode || 'full';
  const registry = Object.keys(AGENT_CONFIG);

  const { jobIds, count } = await orchestrator.launchAllAgents();
  const run = await recordGrowthRunStart({
    founderEmail: req.founderEmail,
    mode,
    launchedAgents: registry,
    jobIds,
  });
  const plannedAction = savePlannedAction({
    type: 'growth.followup',
    requiresApproval: false,
    payload: { founderEmail: req.founderEmail, mode },
    risk: 'low',
    priority: 'medium',
  });

  return {
    success: true,
    mode,
    launchedAgents: registry,
    jobIds,
    timestamp: new Date().toISOString(),
    runId: run.runId,
    plannedActionIds: [plannedAction.id],
  };
}

export async function listGrowthRunRecords(founderEmail: string, limit = 10) {
  return listGrowthRuns(founderEmail, limit);
}

export async function getGrowthRunRecord(runId: string) {
  return getGrowthRun(runId);
}

export async function getGrowthStatus(): Promise<GrowthPackStatus> {
  const health = await orchestrator.getHealth();
  const monitor = await orchestrator.getMonitorData(20);
  const agents = health.agentRegistry || Object.keys(AGENT_CONFIG);

  return {
    success: true,
    environment: process.env.NODE_ENV || 'development',
    agentRegistryCount: agents.length,
    agents,
    recentProgress: monitor.progress || [],
    recentEvents: monitor.events || [],
    timestamp: new Date().toISOString(),
  };
}
