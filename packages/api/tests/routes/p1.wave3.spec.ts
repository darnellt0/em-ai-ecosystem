import { runP0QaGate } from '../../src/services/p0QaGate.service';

describe('P1 Wave 3 - Integrated Strategist & Systems Architect', () => {

  describe('Integrated Strategist QA', () => {

    it('passes valid strategy_sync output', () => {
      const output = {
        runId: 'strategy_sync_12345',
        userId: 'founder@elevatedmovements.com',
        timeHorizon: '90d',
        focusArea: 'growth',
        systemsAnalyzed: ['em', 'quicklist'],
        strategicAlignment: {
          score: 70,
          gaps: ['Cross-system member acquisition funnel not yet established'],
          synergies: ['EM community can drive organic growth for other products'],
        },
        recommendations: [
          {
            priority: 'high',
            system: 'em',
            action: 'Establish weekly member engagement metrics dashboard',
            rationale: 'Track retention and community health proactively',
            timeline: 'Next 30 days',
          },
        ],
        crossSystemOpportunities: ['Bundle EM membership with Meal-Vision nutrition coaching'],
        confidenceScore: 0.6,
        insight: 'Your 2-system ecosystem shows 70% strategic alignment.',
        recommendedNextAction: 'Start with: Establish weekly member engagement metrics dashboard (em)',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24T12:00:00Z',
      };
      const result = runP0QaGate('integratedStrategist', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails strategy_sync missing userId', () => {
      const output = {
        runId: 'test',
        timeHorizon: '90d',
        focusArea: 'growth',
        systemsAnalyzed: ['em'],
        strategicAlignment: { score: 50, gaps: [], synergies: [] },
        recommendations: [],
        crossSystemOpportunities: [],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('integratedStrategist', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'userId')).toBe(true);
    });

    it('fails strategy_sync with empty recommendations', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        timeHorizon: '90d',
        focusArea: 'growth',
        systemsAnalyzed: ['em'],
        strategicAlignment: { score: 50, gaps: [], synergies: [] },
        recommendations: [],  // Empty!
        crossSystemOpportunities: [],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('integratedStrategist', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'recommendations')).toBe(true);
    });

    it('fails strategy_sync with invalid alignment score', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        timeHorizon: '90d',
        focusArea: 'growth',
        systemsAnalyzed: ['em'],
        strategicAlignment: { score: 150, gaps: [], synergies: [] },  // Invalid: > 100
        recommendations: [{ priority: 'high', system: 'em', action: 'test', rationale: 'test', timeline: 'test' }],
        crossSystemOpportunities: [],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('integratedStrategist', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'strategicAlignment.score')).toBe(true);
    });

    it('fails strategy_sync with invalid confidence score', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        timeHorizon: '90d',
        focusArea: 'growth',
        systemsAnalyzed: ['em'],
        strategicAlignment: { score: 50, gaps: [], synergies: [] },
        recommendations: [{ priority: 'high', system: 'em', action: 'test', rationale: 'test', timeline: 'test' }],
        crossSystemOpportunities: [],
        confidenceScore: 1.5,  // Invalid: > 1
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('integratedStrategist', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'confidenceScore')).toBe(true);
    });
  });

  describe('Systems Architect QA', () => {

    it('passes valid systems_design output', () => {
      const output = {
        runId: 'systems_design_12345',
        userId: 'founder@elevatedmovements.com',
        requestType: 'automation_suggestion',
        analysis: {
          currentState: 'Manual repetitive tasks identified',
          proposedState: 'Automated workflows triggered by events or schedules',
          complexity: 'medium',
          estimatedEffort: '1-3 weeks per automation',
        },
        designRecommendations: [
          {
            component: 'Automation Platform',
            recommendation: 'Consolidate automations in single platform (n8n, Zapier, or Make)',
            rationale: 'Centralized monitoring, logging, and maintenance',
            dependencies: ['API access to all systems', 'Webhook endpoints'],
          },
        ],
        automationOpportunities: [
          {
            trigger: 'Daily at 6 AM',
            action: 'Generate and send daily brief with key metrics',
            expectedSavings: '30 minutes per day',
            implementationNotes: 'Cron job + email template + data aggregation query',
          },
        ],
        architectureDiagram: '```mermaid\ngraph LR\nA[User] --> B[System]\n```',
        nextSteps: ['Audit all repetitive manual tasks', 'Prioritize automations by ROI'],
        confidenceScore: 1.0,
        insight: 'automation_suggestion analysis complete. Complexity: medium. 1 design recommendations identified.',
        recommendedNextAction: 'Audit all repetitive manual tasks',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24T12:00:00Z',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails systems_design missing userId', () => {
      const output = {
        runId: 'test',
        requestType: 'workflow_design',
        analysis: { currentState: 'test', proposedState: 'test', complexity: 'medium', estimatedEffort: 'test' },
        designRecommendations: [],
        automationOpportunities: [],
        nextSteps: [],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'userId')).toBe(true);
    });

    it('fails systems_design with empty design recommendations', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        requestType: 'workflow_design',
        analysis: { currentState: 'test', proposedState: 'test', complexity: 'medium', estimatedEffort: 'test' },
        designRecommendations: [],  // Empty!
        automationOpportunities: [],
        nextSteps: ['test'],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'designRecommendations')).toBe(true);
    });

    it('fails systems_design with empty next steps', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        requestType: 'workflow_design',
        analysis: { currentState: 'test', proposedState: 'test', complexity: 'medium', estimatedEffort: 'test' },
        designRecommendations: [{ component: 'test', recommendation: 'test', rationale: 'test', dependencies: [] }],
        automationOpportunities: [],
        nextSteps: [],  // Empty!
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'nextSteps')).toBe(true);
    });

    it('fails systems_design with invalid complexity', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        requestType: 'workflow_design',
        analysis: { currentState: 'test', proposedState: 'test', complexity: 'invalid', estimatedEffort: 'test' },
        designRecommendations: [{ component: 'test', recommendation: 'test', rationale: 'test', dependencies: [] }],
        automationOpportunities: [],
        nextSteps: ['test'],
        confidenceScore: 0.5,
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'analysis.complexity')).toBe(true);
    });

    it('fails systems_design with invalid confidence score', () => {
      const output = {
        runId: 'test',
        userId: 'founder@test.com',
        requestType: 'workflow_design',
        analysis: { currentState: 'test', proposedState: 'test', complexity: 'medium', estimatedEffort: 'test' },
        designRecommendations: [{ component: 'test', recommendation: 'test', rationale: 'test', dependencies: [] }],
        automationOpportunities: [],
        nextSteps: ['test'],
        confidenceScore: -0.5,  // Invalid: < 0
        insight: 'Test',
        recommendedNextAction: 'Test',
        mode: 'offline',
        offline: true,
        generatedAt: '2025-12-24',
      };
      const result = runP0QaGate('systemsArchitect', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'confidenceScore')).toBe(true);
    });
  });
});
