#!/usr/bin/env ts-node

/**
 * Agent Integrity Verification Script
 *
 * Purpose: Verify all agents are production-ready with:
 * - Valid registry entries
 * - Passing healthchecks
 * - No mock implementations
 * - No TODO placeholders
 * - Required environment variables
 * - Working dependencies
 *
 * Usage: npm run check-agent-integrity
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { AGENT_REGISTRY, checkAgentHealth, validateAgentRegistry } from '../packages/api/src/growth-agents/agent-registry';

interface AgentAuditResult {
  agent_id: string;
  status: 'real' | 'mock' | 'broken';
  latency_ms: number;
  dependencies_ok: boolean;
  env_vars_ok: boolean;
  has_todos: boolean;
  has_mocks: boolean;
  healthcheck_passed: boolean;
  errors: string[];
  warnings: string[];
}

interface AuditReport {
  timestamp: string;
  total_agents: number;
  real_count: number;
  mock_count: number;
  broken_count: number;
  overall_status: 'PASS' | 'FAIL';
  agents: AgentAuditResult[];
}

/**
 * Check if source code contains TODO markers
 */
function checkForTodos(agentId: string): { has_todos: boolean; count: number; locations: string[] } {
  const agentFilePath = join(__dirname, '..', 'packages', 'api', 'src', 'growth-agents', `${agentId}-agent.ts`);

  try {
    const sourceCode = readFileSync(agentFilePath, 'utf-8');
    const todoMatches = sourceCode.match(/\/\/\s*TODO|\/\/\s*FIXME|\/\*\s*TODO|\/\*\s*FIXME/gi);

    if (todoMatches) {
      const lines = sourceCode.split('\n');
      const locations: string[] = [];

      lines.forEach((line, index) => {
        if (/\/\/\s*TODO|\/\/\s*FIXME|\/\*\s*TODO|\/\*\s*FIXME/i.test(line)) {
          locations.push(`Line ${index + 1}: ${line.trim()}`);
        }
      });

      return {
        has_todos: true,
        count: todoMatches.length,
        locations,
      };
    }

    return { has_todos: false, count: 0, locations: [] };
  } catch (error) {
    console.warn(`Could not read source file for ${agentId}:`, (error as Error).message);
    return { has_todos: false, count: 0, locations: [] };
  }
}

/**
 * Check if source code contains mock implementations
 */
function checkForMocks(agentId: string): { has_mocks: boolean; count: number; locations: string[] } {
  const agentFilePath = join(__dirname, '..', 'packages', 'api', 'src', 'growth-agents', `${agentId}-agent.ts`);

  try {
    const sourceCode = readFileSync(agentFilePath, 'utf-8');
    const mockPatterns = [
      /mock|fake|stub|dummy|placeholder/gi,
      /return\s+\{\s*\}/gi, // Empty object returns
      /return\s+\[\s*\]/gi, // Empty array returns
      /console\.log\s*\(\s*['"]mock|fake|stub['"]/gi,
    ];

    let mockCount = 0;
    const locations: string[] = [];
    const lines = sourceCode.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of mockPatterns) {
        if (pattern.test(line)) {
          mockCount++;
          locations.push(`Line ${index + 1}: ${line.trim()}`);
          break;
        }
      }
    });

    return {
      has_mocks: mockCount > 0,
      count: mockCount,
      locations,
    };
  } catch (error) {
    console.warn(`Could not read source file for ${agentId}:`, (error as Error).message);
    return { has_mocks: false, count: 0, locations: [] };
  }
}

/**
 * Check environment variables for agent dependencies
 */
function checkEnvVars(agentId: string): { env_vars_ok: boolean; missing: string[] } {
  const entry = AGENT_REGISTRY[agentId];
  if (!entry) {
    return { env_vars_ok: false, missing: ['Agent not found in registry'] };
  }

  const dependencies = entry.metadata.dependencies || [];
  const missing: string[] = [];

  for (const envVar of dependencies) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    env_vars_ok: missing.length === 0,
    missing,
  };
}

/**
 * Run integrity check for a single agent
 */
async function checkAgentIntegrity(agentId: string): Promise<AgentAuditResult> {
  const result: AgentAuditResult = {
    agent_id: agentId,
    status: 'real',
    latency_ms: 0,
    dependencies_ok: false,
    env_vars_ok: false,
    has_todos: false,
    has_mocks: false,
    healthcheck_passed: false,
    errors: [],
    warnings: [],
  };

  try {
    // Check environment variables
    const envCheck = checkEnvVars(agentId);
    result.env_vars_ok = envCheck.env_vars_ok;
    if (!envCheck.env_vars_ok) {
      result.errors.push(`Missing environment variables: ${envCheck.missing.join(', ')}`);
    }

    // Check for TODOs
    const todoCheck = checkForTodos(agentId);
    result.has_todos = todoCheck.has_todos;
    if (todoCheck.has_todos) {
      result.warnings.push(`Found ${todoCheck.count} TODO/FIXME markers`);
    }

    // Check for mocks
    const mockCheck = checkForMocks(agentId);
    result.has_mocks = mockCheck.has_mocks;
    if (mockCheck.has_mocks) {
      result.status = 'mock';
      result.warnings.push(`Found ${mockCheck.count} potential mock implementations`);
    }

    // Run healthcheck
    const startTime = Date.now();
    const healthStatus = await checkAgentHealth(agentId);
    result.latency_ms = Date.now() - startTime;

    if (healthStatus) {
      result.healthcheck_passed = healthStatus.status === 'healthy';
      result.dependencies_ok = healthStatus.checks.redis || false;

      if (!result.healthcheck_passed) {
        result.errors.push(`Healthcheck failed: ${healthStatus.message}`);
        result.status = 'broken';
      }
    } else {
      result.errors.push('Healthcheck returned null');
      result.status = 'broken';
    }

    // Determine final status
    if (result.errors.length > 0) {
      result.status = 'broken';
    } else if (result.has_mocks) {
      result.status = 'mock';
    } else {
      result.status = 'real';
    }
  } catch (error) {
    result.status = 'broken';
    result.errors.push(`Exception during check: ${(error as Error).message}`);
  }

  return result;
}

/**
 * Main audit function
 */
async function runAudit(): Promise<AuditReport> {
  console.log('\n' + '='.repeat(80));
  console.log('AGENT INTEGRITY VERIFICATION');
  console.log('='.repeat(80) + '\n');

  // Validate registry structure
  console.log('1. Validating agent registry structure...');
  const validation = validateAgentRegistry();

  if (!validation.valid) {
    console.error('❌ Agent registry validation FAILED:');
    validation.errors.forEach((error) => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Agent registry structure is valid\n');

  // Get all agent IDs
  const agentIds = Object.keys(AGENT_REGISTRY);
  console.log(`2. Running integrity checks on ${agentIds.length} agents...\n`);

  // Run checks for all agents
  const results: AgentAuditResult[] = [];

  for (const agentId of agentIds) {
    console.log(`   Checking ${agentId}...`);
    const result = await checkAgentIntegrity(agentId);
    results.push(result);

    const statusIcon = result.status === 'real' ? '✅' : result.status === 'mock' ? '⚠️ ' : '❌';
    console.log(`   ${statusIcon} ${agentId}: ${result.status.toUpperCase()}`);

    if (result.errors.length > 0) {
      result.errors.forEach((error) => console.log(`      ERROR: ${error}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`      WARNING: ${warning}`));
    }
  }

  // Generate report
  const realCount = results.filter((r) => r.status === 'real').length;
  const mockCount = results.filter((r) => r.status === 'mock').length;
  const brokenCount = results.filter((r) => r.status === 'broken').length;

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    total_agents: results.length,
    real_count: realCount,
    mock_count: mockCount,
    broken_count: brokenCount,
    overall_status: brokenCount === 0 && mockCount === 0 ? 'PASS' : 'FAIL',
    agents: results,
  };

  return report;
}

/**
 * Print summary report
 */
function printSummary(report: AuditReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Timestamp:     ${report.timestamp}`);
  console.log(`Total Agents:  ${report.total_agents}`);
  console.log(`Real:          ${report.real_count}`);
  console.log(`Mock:          ${report.mock_count}`);
  console.log(`Broken:        ${report.broken_count}`);
  console.log(`Overall:       ${report.overall_status}`);
  console.log('='.repeat(80) + '\n');

  // Detailed table
  console.log('AGENT DETAILS:');
  console.log('-'.repeat(120));
  console.log(
    'Agent ID'.padEnd(20) +
      'Status'.padEnd(10) +
      'Latency'.padEnd(12) +
      'Deps OK'.padEnd(10) +
      'Env OK'.padEnd(10) +
      'Health'.padEnd(10) +
      'TODOs'.padEnd(10) +
      'Mocks'.padEnd(10)
  );
  console.log('-'.repeat(120));

  for (const agent of report.agents) {
    console.log(
      agent.agent_id.padEnd(20) +
        agent.status.padEnd(10) +
        `${agent.latency_ms}ms`.padEnd(12) +
        (agent.dependencies_ok ? '✅' : '❌').padEnd(10) +
        (agent.env_vars_ok ? '✅' : '❌').padEnd(10) +
        (agent.healthcheck_passed ? '✅' : '❌').padEnd(10) +
        (agent.has_todos ? '⚠️ ' : '✅').padEnd(10) +
        (agent.has_mocks ? '⚠️ ' : '✅').padEnd(10)
    );
  }

  console.log('-'.repeat(120) + '\n');

  // Save report to file
  const reportPath = join(__dirname, '..', 'AGENT_INTEGRITY_REPORT.json');
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await runAudit();
    printSummary(report);

    if (report.overall_status === 'FAIL') {
      console.error('❌ Agent integrity check FAILED');
      process.exit(1);
    } else {
      console.log('✅ Agent integrity check PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error during audit:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runAudit, checkAgentIntegrity, AuditReport, AgentAuditResult };
