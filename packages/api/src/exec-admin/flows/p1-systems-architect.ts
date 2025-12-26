/**
 * P1 Systems Architect Flow
 *
 * Purpose: Helps design internal workflows, suggests automations, maintains architecture docs
 *
 * Features:
 * - Workflow design recommendations
 * - Automation opportunity identification
 * - Architecture review and guidance
 * - Integration planning
 * - Offline mode support
 */

export interface SystemsArchitectInput {
  userId: string;
  requestType: 'workflow_design' | 'automation_suggestion' | 'architecture_review' | 'integration_plan';
  context?: string;  // Description of what they're trying to accomplish
  currentSystems?: string[];  // Systems involved
  constraints?: string[];  // Budget, time, technical constraints
  mode?: 'offline' | 'live';
}

export interface SystemsArchitectOutput {
  runId: string;
  userId: string;
  requestType: string;
  analysis: {
    currentState: string;
    proposedState: string;
    complexity: 'low' | 'medium' | 'high';
    estimatedEffort: string;
  };
  designRecommendations: Array<{
    component: string;
    recommendation: string;
    rationale: string;
    dependencies: string[];
  }>;
  automationOpportunities: Array<{
    trigger: string;
    action: string;
    expectedSavings: string;
    implementationNotes: string;
  }>;
  architectureDiagram?: string;  // Mermaid syntax or description
  nextSteps: string[];
  confidenceScore: number;  // 0-1
  insight: string;
  recommendedNextAction: string;
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

export async function runP1SystemsArchitect(
  input: SystemsArchitectInput
): Promise<{ runId: string; data: SystemsArchitectOutput }> {
  const runId = `systems_design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[P1 Systems Architect] Starting run ${runId} for ${input.userId}`);
  console.log(`[P1 Systems Architect] Request type: ${input.requestType}`);
  console.log(`[P1 Systems Architect] Context: ${input.context || 'none'}`);

  let output: SystemsArchitectOutput;
  let confidenceScore = 1.0;

  // Handle missing requestType (default to workflow_design)
  const requestType = input.requestType || 'workflow_design';
  if (!input.requestType) {
    confidenceScore = 0.5;
    console.warn('[P1 Systems Architect] No requestType specified, defaulting to workflow_design with confidence 0.5');
  }

  // Lower confidence if context is missing
  if (!input.context) {
    confidenceScore = Math.min(confidenceScore, 0.4);
    console.warn('[P1 Systems Architect] No context provided, lowering confidence to 0.4');
  }

  const mode = input.mode || 'offline';
  const offline = mode === 'offline';
  const systems = input.currentSystems || [];
  const constraints = input.constraints || [];

  try {
    // In offline mode or when confidence is low, return deterministic output
    if (offline || confidenceScore < 0.5) {
      console.log('[P1 Systems Architect] Using offline/deterministic mode');

      // Build deterministic recommendations based on request type
      const designRecommendations: SystemsArchitectOutput['designRecommendations'] = [];
      const automationOpportunities: SystemsArchitectOutput['automationOpportunities'] = [];
      const nextSteps: string[] = [];
      let currentState = 'Current workflow state not specified';
      let proposedState = 'Proposed improvements pending context';
      let complexity: 'low' | 'medium' | 'high' = 'medium';
      let estimatedEffort = '2-4 weeks';
      let architectureDiagram: string | undefined;

      switch (requestType) {
        case 'workflow_design': {
          currentState = input.context || 'Manual workflow without automation';
          proposedState = 'Streamlined workflow with key automation touchpoints';
          complexity = systems.length > 3 ? 'high' : systems.length > 1 ? 'medium' : 'low';
          estimatedEffort = complexity === 'high' ? '4-6 weeks' : complexity === 'medium' ? '2-4 weeks' : '1-2 weeks';

          designRecommendations.push({
            component: 'Workflow Orchestration',
            recommendation: 'Implement event-driven workflow engine (n8n or similar)',
            rationale: 'Enable flexible automation without custom code for each workflow',
            dependencies: ['Webhook infrastructure', 'Event bus'],
          });

          designRecommendations.push({
            component: 'Data Flow',
            recommendation: 'Establish clear data models and API contracts between systems',
            rationale: 'Prevent data inconsistencies and enable reliable integrations',
            dependencies: ['Shared schema definitions', 'Validation layer'],
          });

          automationOpportunities.push({
            trigger: 'New data entry in primary system',
            action: 'Auto-sync to dependent systems with validation',
            expectedSavings: '2-4 hours per week',
            implementationNotes: 'Use webhook + queue for reliability',
          });

          nextSteps.push('Map current workflow end-to-end with pain points');
          nextSteps.push('Identify highest-value automation opportunities');
          nextSteps.push('Prototype core workflow in automation tool');

          architectureDiagram = `
\`\`\`mermaid
graph LR
  A[User Input] --> B[Validation Layer]
  B --> C[Event Bus]
  C --> D[Workflow Engine]
  D --> E[System 1]
  D --> F[System 2]
  E --> G[Result Store]
  F --> G
\`\`\`
`;
          break;
        }

        case 'automation_suggestion': {
          currentState = input.context || 'Manual repetitive tasks identified';
          proposedState = 'Automated workflows triggered by events or schedules';
          complexity = 'medium';
          estimatedEffort = '1-3 weeks per automation';

          automationOpportunities.push({
            trigger: 'Daily at 6 AM',
            action: 'Generate and send daily brief with key metrics',
            expectedSavings: '30 minutes per day',
            implementationNotes: 'Cron job + email template + data aggregation query',
          });

          automationOpportunities.push({
            trigger: 'New member signup',
            action: 'Send welcome sequence and add to onboarding workflow',
            expectedSavings: '15 minutes per signup',
            implementationNotes: 'Webhook listener + email service + CRM update',
          });

          automationOpportunities.push({
            trigger: 'Task completion in System A',
            action: 'Notify System B and update shared dashboard',
            expectedSavings: '10 minutes per task',
            implementationNotes: 'Event-driven architecture + notification service',
          });

          designRecommendations.push({
            component: 'Automation Platform',
            recommendation: 'Consolidate automations in single platform (n8n, Zapier, or Make)',
            rationale: 'Centralized monitoring, logging, and maintenance',
            dependencies: ['API access to all systems', 'Webhook endpoints'],
          });

          nextSteps.push('Audit all repetitive manual tasks (frequency, time cost)');
          nextSteps.push('Prioritize automations by ROI (time saved vs implementation cost)');
          nextSteps.push('Build 1-2 high-value automations as proof of concept');

          break;
        }

        case 'architecture_review': {
          currentState = input.context || 'Existing system architecture under review';
          proposedState = 'Optimized architecture with identified improvements implemented';
          complexity = 'high';
          estimatedEffort = '3-6 weeks';

          designRecommendations.push({
            component: 'Service Boundaries',
            recommendation: 'Define clear service boundaries with single responsibility',
            rationale: 'Improve maintainability and enable independent scaling',
            dependencies: ['Domain modeling', 'API design patterns'],
          });

          designRecommendations.push({
            component: 'Data Layer',
            recommendation: 'Implement repository pattern with clear data access layer',
            rationale: 'Decouple business logic from data storage concerns',
            dependencies: ['ORM or query builder', 'Migration system'],
          });

          designRecommendations.push({
            component: 'Error Handling',
            recommendation: 'Establish consistent error handling and logging strategy',
            rationale: 'Enable debugging and monitoring across all services',
            dependencies: ['Logging framework', 'Error tracking service'],
          });

          designRecommendations.push({
            component: 'Testing Strategy',
            recommendation: 'Implement layered testing (unit, integration, e2e)',
            rationale: 'Ensure reliability and enable confident refactoring',
            dependencies: ['Test frameworks', 'CI/CD pipeline'],
          });

          nextSteps.push('Document current architecture (services, data flow, dependencies)');
          nextSteps.push('Identify bottlenecks, technical debt, and security concerns');
          nextSteps.push('Prioritize improvements by impact and effort');
          nextSteps.push('Create migration plan with rollback strategy');

          architectureDiagram = `
\`\`\`mermaid
graph TD
  A[API Gateway] --> B[Auth Service]
  A --> C[Business Logic Layer]
  C --> D[Data Access Layer]
  D --> E[Database]
  C --> F[External Services]
  B --> G[User Store]
\`\`\`
`;
          break;
        }

        case 'integration_plan': {
          currentState = input.context || 'Systems operating independently';
          proposedState = 'Integrated systems with bidirectional data flow';
          complexity = systems.length > 2 ? 'high' : 'medium';
          estimatedEffort = complexity === 'high' ? '4-8 weeks' : '2-4 weeks';

          designRecommendations.push({
            component: 'Integration Layer',
            recommendation: 'Build dedicated integration service or use iPaaS',
            rationale: 'Centralize integration logic and enable reusability',
            dependencies: ['API documentation', 'Authentication setup'],
          });

          designRecommendations.push({
            component: 'Data Sync Strategy',
            recommendation: 'Choose sync pattern: real-time (webhooks) or batch (scheduled)',
            rationale: 'Match sync frequency to business requirements and system capabilities',
            dependencies: ['Webhook support or polling mechanism', 'Idempotency handling'],
          });

          designRecommendations.push({
            component: 'Error Recovery',
            recommendation: 'Implement retry logic with exponential backoff and dead letter queue',
            rationale: 'Handle transient failures gracefully without data loss',
            dependencies: ['Queue infrastructure', 'Monitoring alerts'],
          });

          automationOpportunities.push({
            trigger: 'Data change in System A',
            action: 'Sync to System B with conflict resolution',
            expectedSavings: '1-3 hours per day',
            implementationNotes: 'Webhook + transformation layer + upsert logic',
          });

          nextSteps.push('Map data models across systems to identify transformation needs');
          nextSteps.push('Define integration requirements (real-time vs batch, unidirectional vs bidirectional)');
          nextSteps.push('Build integration for highest-priority data flow');
          nextSteps.push('Test with production-like data volume and monitor performance');

          architectureDiagram = `
\`\`\`mermaid
graph LR
  A[System A] -->|Webhook| B[Integration Service]
  B -->|Transform| C[System B]
  C -->|Callback| B
  B -->|Update| A
  B --> D[Error Queue]
\`\`\`
`;
          break;
        }
      }

      // Generate insight based on confidence
      let insight: string;
      if (confidenceScore < 0.5) {
        insight = 'Limited context provided. These are general best practices - provide specific context for tailored recommendations.';
      } else {
        insight = `${requestType.replace('_', ' ')} analysis complete. Complexity: ${complexity}. ${designRecommendations.length} design recommendations identified.`;
      }

      const recommendedNextAction = nextSteps.length > 0
        ? nextSteps[0]
        : 'Provide detailed context about your systems and goals';

      output = {
        runId,
        userId: input.userId,
        requestType,
        analysis: {
          currentState,
          proposedState,
          complexity,
          estimatedEffort,
        },
        designRecommendations,
        automationOpportunities,
        architectureDiagram,
        nextSteps,
        confidenceScore,
        insight,
        recommendedNextAction,
        mode,
        offline,
        generatedAt: new Date().toISOString(),
      };
    } else {
      // Live mode would call actual architecture analysis service
      console.log('[P1 Systems Architect] Live mode not yet implemented, using offline fallback');

      // For now, fall back to offline mode even if live was requested
      return runP1SystemsArchitect({ ...input, mode: 'offline' });
    }
  } catch (error) {
    console.warn('[P1 Systems Architect] Error, using safe fallback:', error);

    // Safe fallback output
    output = {
      runId,
      userId: input.userId,
      requestType,
      analysis: {
        currentState: 'Unable to analyze due to system error',
        proposedState: 'Pending successful analysis',
        complexity: 'medium',
        estimatedEffort: 'Unknown',
      },
      designRecommendations: [
        {
          component: 'System Health',
          recommendation: 'Verify system connectivity and data availability',
          rationale: 'Establish baseline before architectural planning',
          dependencies: ['Health check endpoints', 'Monitoring setup'],
        },
      ],
      automationOpportunities: [],
      nextSteps: ['Resolve system errors', 'Retry analysis with valid context'],
      confidenceScore: 0.2,
      insight: 'System error occurred. Health check recommended before proceeding.',
      recommendedNextAction: 'Check system logs and verify all services are operational',
      mode,
      offline: true,
      generatedAt: new Date().toISOString(),
    };
  }

  console.log(`[P1 Systems Architect] Complete: ${runId}`, {
    requestType: output.requestType,
    complexity: output.analysis.complexity,
    recommendations: output.designRecommendations.length,
    automations: output.automationOpportunities.length,
    confidence: output.confidenceScore,
    offline: output.offline,
  });

  return { runId, data: output };
}
