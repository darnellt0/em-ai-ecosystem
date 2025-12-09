/**
 * Phase 6 Integration QA Agent
 *
 * Automatically tests all Phase 6 growth agents to ensure:
 * - Proper execution without exceptions
 * - Response shape validation
 * - Latency within acceptable thresholds
 * - All agents complete successfully
 */

import { AGENT_REGISTRY, getAllAgentIds } from './agent-registry';
import { BaseAgent, AgentResult } from './base-agent';

export interface AgentQAResult {
  agent_id: string;
  test_passed: boolean;
  latency_ms: number;
  response_shape_valid: boolean;
  no_exceptions: boolean;
  errors: string[];
  warnings: string[];
  result?: AgentResult;
}

export interface Phase6QAReport {
  timestamp: string;
  total_agents: number;
  passed: number;
  failed: number;
  average_latency_ms: number;
  max_latency_ms: number;
  overall_status: 'PASS' | 'FAIL';
  agents: AgentQAResult[];
}

const MAX_LATENCY_THRESHOLD_MS = 30000; // 30 seconds

/**
 * Validate agent result shape
 */
function validateResultShape(result: any): boolean {
  if (!result || typeof result !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof result.success !== 'boolean') {
    return false;
  }

  if (!result.outputs || typeof result.outputs !== 'object') {
    return false;
  }

  if (!Array.isArray(result.artifacts)) {
    return false;
  }

  return true;
}

/**
 * Run QA test for a single agent
 */
async function testAgent(agentId: string): Promise<AgentQAResult> {
  const qaResult: AgentQAResult = {
    agent_id: agentId,
    test_passed: false,
    latency_ms: 0,
    response_shape_valid: false,
    no_exceptions: false,
    errors: [],
    warnings: [],
  };

  try {
    const entry = AGENT_REGISTRY[agentId];

    if (!entry) {
      qaResult.errors.push('Agent not found in registry');
      return qaResult;
    }

    const config = {
      name: agentId,
      phase: entry.metadata.phase,
      priority: entry.metadata.priority,
    };

    // Execute agent with dry-run options
    const startTime = Date.now();
    let agent: BaseAgent;

    try {
      agent = entry.execute(config);
    } catch (error) {
      qaResult.errors.push(`Failed to instantiate agent: ${(error as Error).message}`);
      qaResult.latency_ms = Date.now() - startTime;
      return qaResult;
    }

    qaResult.no_exceptions = true;

    // Run the agent
    let result: AgentResult;
    try {
      result = await agent.execute();
      qaResult.latency_ms = Date.now() - startTime;
    } catch (error) {
      qaResult.errors.push(`Agent execution threw exception: ${(error as Error).message}`);
      qaResult.latency_ms = Date.now() - startTime;
      qaResult.no_exceptions = false;
      return qaResult;
    }

    // Validate response shape
    qaResult.response_shape_valid = validateResultShape(result);
    if (!qaResult.response_shape_valid) {
      qaResult.errors.push('Invalid result shape: missing required fields (success, outputs, artifacts)');
    }

    qaResult.result = result;

    // Check latency threshold
    if (qaResult.latency_ms > MAX_LATENCY_THRESHOLD_MS) {
      qaResult.warnings.push(
        `Latency ${qaResult.latency_ms}ms exceeds threshold of ${MAX_LATENCY_THRESHOLD_MS}ms`
      );
    }

    // Check if agent reported success
    if (!result.success) {
      qaResult.errors.push(`Agent reported failure: ${result.errors?.join(', ') || 'Unknown error'}`);
    }

    // Determine overall pass/fail
    qaResult.test_passed =
      qaResult.no_exceptions &&
      qaResult.response_shape_valid &&
      result.success &&
      qaResult.errors.length === 0;
  } catch (error) {
    qaResult.errors.push(`Unexpected error during QA: ${(error as Error).message}`);
    qaResult.no_exceptions = false;
  }

  return qaResult;
}

/**
 * Run Phase 6 integration QA for all agents
 */
export async function runPhase6QA(): Promise<Phase6QAReport> {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 6 INTEGRATION QA');
  console.log('='.repeat(80) + '\n');

  const agentIds = getAllAgentIds();
  console.log(`Testing ${agentIds.length} agents...\n`);

  const results: AgentQAResult[] = [];

  for (const agentId of agentIds) {
    console.log(`Testing ${agentId}...`);
    const result = await testAgent(agentId);
    results.push(result);

    const statusIcon = result.test_passed ? '✅' : '❌';
    console.log(
      `${statusIcon} ${agentId}: ${result.test_passed ? 'PASS' : 'FAIL'} (${result.latency_ms}ms)`
    );

    if (result.errors.length > 0) {
      result.errors.forEach((error) => console.log(`   ERROR: ${error}`));
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`   WARNING: ${warning}`));
    }
  }

  // Calculate statistics
  const passed = results.filter((r) => r.test_passed).length;
  const failed = results.filter((r) => !r.test_passed).length;
  const latencies = results.map((r) => r.latency_ms);
  const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);

  const report: Phase6QAReport = {
    timestamp: new Date().toISOString(),
    total_agents: results.length,
    passed,
    failed,
    average_latency_ms: Math.round(avgLatency),
    max_latency_ms: maxLatency,
    overall_status: failed === 0 ? 'PASS' : 'FAIL',
    agents: results,
  };

  console.log('\n' + '='.repeat(80));
  console.log('QA SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Agents:      ${report.total_agents}`);
  console.log(`Passed:            ${report.passed}`);
  console.log(`Failed:            ${report.failed}`);
  console.log(`Average Latency:   ${report.average_latency_ms}ms`);
  console.log(`Max Latency:       ${report.max_latency_ms}ms`);
  console.log(`Overall Status:    ${report.overall_status}`);
  console.log('='.repeat(80) + '\n');

  return report;
}
