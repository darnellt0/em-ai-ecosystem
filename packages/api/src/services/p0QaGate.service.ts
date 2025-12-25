export type QaSeverity = 'info' | 'warn' | 'block';

export type QaIssue = {
  field: string;
  message: string;
  severity: QaSeverity;
};

export type QaGateResult = {
  qa_pass: boolean;
  issues: QaIssue[];
  severity: QaSeverity;
};

const severityRank: Record<QaSeverity, number> = {
  info: 0,
  warn: 1,
  block: 2,
};

function summarizeSeverity(issues: QaIssue[]): QaSeverity {
  if (!issues.length) return 'info';
  return issues.reduce<QaSeverity>((max, issue) => {
    return severityRank[issue.severity] > severityRank[max] ? issue.severity : max;
  }, 'info');
}

function buildResult(issues: QaIssue[]): QaGateResult {
  const severity = summarizeSeverity(issues);
  const qa_pass = !issues.some((issue) => issue.severity === 'block');
  return { qa_pass, issues, severity };
}

function expectString(value: unknown, field: string, issues: QaIssue[], severity: QaSeverity = 'block') {
  if (typeof value !== 'string' || !value.trim()) {
    issues.push({ field, message: 'Expected non-empty string', severity });
  }
}

function expectArray(value: unknown, field: string, issues: QaIssue[], severity: QaSeverity = 'block') {
  if (!Array.isArray(value)) {
    issues.push({ field, message: 'Expected array', severity });
  }
}


function expectNumber(value: unknown, field: string, issues: QaIssue[], severity: QaSeverity = 'block') {
  if (typeof value !== 'number' || isNaN(value)) {
    issues.push({ field, message: 'Expected number', severity });
  }
}

function expectObject(value: unknown, field: string, issues: QaIssue[], severity: QaSeverity = 'block') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    issues.push({ field, message: 'Expected object', severity });
  }
}
export function evaluateDailyFocusOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.focusTheme, 'focusTheme', issues);
  expectArray(output.priorities, 'priorities', issues);
  if (Array.isArray(output.priorities)) {
    output.priorities.forEach((priority: any, idx: number) => {
      expectString(priority?.title, `priorities[${idx}].title`, issues);
      expectString(priority?.detail, `priorities[${idx}].detail`, issues);
    });
  }

  if (!output.emailDraft || typeof output.emailDraft !== 'object') {
    issues.push({ field: 'emailDraft', message: 'Expected emailDraft object', severity: 'block' });
  } else {
    expectString(output.emailDraft.subject, 'emailDraft.subject', issues);
    expectString(output.emailDraft.body, 'emailDraft.body', issues);
    if (output.emailDraft.status !== 'draft') {
      issues.push({ field: 'emailDraft.status', message: 'Email draft must be draft-only', severity: 'block' });
    }
  }

  if (!output.metadata || typeof output.metadata !== 'object') {
    issues.push({ field: 'metadata', message: 'Expected metadata object', severity: 'block' });
  } else {
    expectString(output.metadata.userId, 'metadata.userId', issues);
    expectString(output.metadata.generatedAt, 'metadata.generatedAt', issues);
  }

  return buildResult(issues);
}

export function evaluateActionPackOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectArray(output.actions, 'actions', issues);
  if (Array.isArray(output.actions)) {
    output.actions.forEach((action: any, idx: number) => {
      expectString(action?.title, `actions[${idx}].title`, issues);
      expectString(action?.detail, `actions[${idx}].detail`, issues);
      if (action?.status !== 'draft') {
        issues.push({ field: `actions[${idx}].status`, message: 'Actions must be draft-only', severity: 'block' });
      }
    });
  }

  expectArray(output.followUps, 'followUps', issues);
  if (Array.isArray(output.followUps)) {
    output.followUps.forEach((followUp: any, idx: number) => {
      expectString(followUp?.channel, `followUps[${idx}].channel`, issues);
      if (followUp?.status !== 'draft') {
        issues.push({ field: `followUps[${idx}].status`, message: 'Follow-ups must be draft-only', severity: 'block' });
      }
    });
  }

  expectArray(output.calendarIntentsDraft, 'calendarIntentsDraft', issues);
  if (Array.isArray(output.calendarIntentsDraft)) {
    output.calendarIntentsDraft.forEach((intent: any, idx: number) => {
      expectString(intent?.title, `calendarIntentsDraft[${idx}].title`, issues);
      if (intent?.status !== 'draft') {
        issues.push({ field: `calendarIntentsDraft[${idx}].status`, message: 'Calendar intents must be draft-only', severity: 'block' });
      }
    });
  }

  return buildResult(issues);
}

export function evaluateCalendarOptimizerOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectString(output.calendarId, 'calendarId', issues);
  expectObject(output.analyzedPeriod, 'analyzedPeriod', issues);
  expectObject(output.currentLoad, 'currentLoad', issues);
  expectArray(output.suggestedBlocks, 'suggestedBlocks', issues);
  expectArray(output.recommendations, 'recommendations', issues);
  expectNumber(output.optimizationScore, 'optimizationScore', issues);

  if (Array.isArray(output.recommendations) && output.recommendations.length === 0) {
    issues.push({ field: 'recommendations', message: 'Expected at least 1 recommendation', severity: 'block' });
  }

  if (typeof output.optimizationScore === 'number') {
    if (output.optimizationScore < 0 || output.optimizationScore > 100) {
      issues.push({ field: 'optimizationScore', message: 'Score must be between 0 and 100', severity: 'block' });
    }
  }

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE 2: Financial Allocator Evaluation
// -------------------------------------------------------------------------
export function evaluateFinancialAllocatorOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectNumber(output.inputAmount, 'inputAmount', issues);
  expectString(output.currency, 'currency', issues);
  expectObject(output.allocations, 'allocations', issues);
  expectNumber(output.totalAllocated, 'totalAllocated', issues);
  expectObject(output.ratiosUsed, 'ratiosUsed', issues);
  expectArray(output.recommendations, 'recommendations', issues);
  expectString(output.allocationDate, 'allocationDate', issues);

  if (typeof output.inputAmount === 'number' && output.inputAmount <= 0) {
    issues.push({ field: 'inputAmount', message: 'Amount must be positive', severity: 'block' });
  }

  if (output.allocations && typeof output.allocations === 'object') {
    const requiredCategories = ['ownerPay', 'taxes', 'expenses', 'rndGrowth', 'savings', 'btc'];
    requiredCategories.forEach(cat => {
      if (!output.allocations[cat]) {
        issues.push({ field: `allocations.${cat}`, message: 'Missing allocation category', severity: 'block' });
      }
    });
  }

  return buildResult(issues);
}


// -------------------------------------------------------------------------
// WAVE 3: Insight Analyst Evaluation
// -------------------------------------------------------------------------
export function evaluateInsightAnalystOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectString(output.timeframe, 'timeframe', issues);
  expectObject(output.period, 'period', issues);
  expectArray(output.insights, 'insights', issues);
  expectString(output.summary, 'summary', issues);
  expectString(output.generatedAt, 'generatedAt', issues);

  if (Array.isArray(output.insights) && output.insights.length === 0) {
    issues.push({ field: 'insights', message: 'Expected at least 1 insight', severity: 'block' });
  }

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE 3: Niche Discovery Evaluation
// -------------------------------------------------------------------------
export function evaluateNicheDiscoverOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectString(output.stage, 'stage', issues);
  expectNumber(output.progress, 'progress', issues);
  expectString(output.prompt, 'prompt', issues);
  expectObject(output.previousResponses, 'previousResponses', issues);

  if (typeof output.isComplete !== 'boolean') {
    issues.push({ field: 'isComplete', message: 'Expected boolean', severity: 'block' });
  }

  if (typeof output.progress === 'number') {
    if (output.progress < 0 || output.progress > 100) {
      issues.push({ field: 'progress', message: 'Progress must be between 0 and 100', severity: 'block' });
    }
  }

  return buildResult(issues);
}


// -------------------------------------------------------------------------
// WAVE P1.1: MINDSET AGENT EVALUATION
// -------------------------------------------------------------------------
export function evaluateMindsetOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectArray(output.beliefs, 'beliefs', issues);

  if (Array.isArray(output.beliefs)) {
    if (output.beliefs.length === 0) {
      issues.push({ field: 'beliefs', message: 'Expected at least 1 belief', severity: 'block' });
    }
    output.beliefs.forEach((belief: any, idx: number) => {
      expectString(belief?.limiting, `beliefs[${idx}].limiting`, issues);
      expectString(belief?.reframe, `beliefs[${idx}].reframe`, issues);
      expectString(belief?.evidence, `beliefs[${idx}].evidence`, issues);
      expectString(belief?.actionStep, `beliefs[${idx}].actionStep`, issues);
    });
  }

  if (typeof output.offline !== 'boolean') {
    issues.push({ field: 'offline', message: 'Expected boolean', severity: 'block' });
  }

  expectString(output.generatedAt, 'generatedAt', issues);

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE P1.1: RHYTHM AGENT EVALUATION
// -------------------------------------------------------------------------
export function evaluateRhythmOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectObject(output.energyMap, 'energyMap', issues);

  if (output.energyMap && typeof output.energyMap === 'object') {
    expectArray(output.energyMap.peak, 'energyMap.peak', issues);
    expectArray(output.energyMap.low, 'energyMap.low', issues);
    expectArray(output.energyMap.moderate, 'energyMap.moderate', issues);
  }

  expectArray(output.recommendations, 'recommendations', issues);

  if (Array.isArray(output.recommendations)) {
    if (output.recommendations.length === 0) {
      issues.push({ field: 'recommendations', message: 'Expected at least 1 recommendation', severity: 'block' });
    }
    output.recommendations.forEach((rec: any, idx: number) => {
      expectString(rec?.timeBlock, `recommendations[${idx}].timeBlock`, issues);
      expectString(rec?.activity, `recommendations[${idx}].activity`, issues);
      expectString(rec?.reason, `recommendations[${idx}].reason`, issues);
    });
  }

  if (typeof output.offline !== 'boolean') {
    issues.push({ field: 'offline', message: 'Expected boolean', severity: 'block' });
  }

  expectString(output.generatedAt, 'generatedAt', issues);

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE P1.1: PURPOSE AGENT EVALUATION
// -------------------------------------------------------------------------
export function evaluatePurposeOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectObject(output.ikigai, 'ikigai', issues);

  if (output.ikigai && typeof output.ikigai === 'object') {
    expectArray(output.ikigai.skills, 'ikigai.skills', issues);
    expectArray(output.ikigai.passions, 'ikigai.passions', issues);
    expectArray(output.ikigai.values, 'ikigai.values', issues);
    expectString(output.ikigai.audience, 'ikigai.audience', issues);
    expectString(output.ikigai.impact, 'ikigai.impact', issues);
  }

  expectString(output.purposeStatement, 'purposeStatement', issues);
  expectObject(output.alignment, 'alignment', issues);

  if (output.alignment && typeof output.alignment === 'object') {
    expectNumber(output.alignment.skillsMatch, 'alignment.skillsMatch', issues);
    expectNumber(output.alignment.passionMatch, 'alignment.passionMatch', issues);
    expectNumber(output.alignment.valuesMatch, 'alignment.valuesMatch', issues);
    expectNumber(output.alignment.overall, 'alignment.overall', issues);

    // Validate score ranges
    ['skillsMatch', 'passionMatch', 'valuesMatch', 'overall'].forEach(field => {
      const score = output.alignment[field];
      if (typeof score === 'number' && (score < 0 || score > 100)) {
        issues.push({ field: `alignment.${field}`, message: 'Score must be between 0 and 100', severity: 'block' });
      }
    });
  }

  expectArray(output.recommendations, 'recommendations', issues);

  if (Array.isArray(output.recommendations) && output.recommendations.length === 0) {
    issues.push({ field: 'recommendations', message: 'Expected at least 1 recommendation', severity: 'block' });
  }

  if (typeof output.offline !== 'boolean') {
    issues.push({ field: 'offline', message: 'Expected boolean', severity: 'block' });
  }

  expectString(output.generatedAt, 'generatedAt', issues);

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE P1.3: INTEGRATED STRATEGIST EVALUATION
// -------------------------------------------------------------------------
export function evaluateIntegratedStrategistOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectString(output.timeHorizon, 'timeHorizon', issues);
  expectString(output.focusArea, 'focusArea', issues);
  expectArray(output.systemsAnalyzed, 'systemsAnalyzed', issues);
  expectObject(output.strategicAlignment, 'strategicAlignment', issues);

  if (output.strategicAlignment && typeof output.strategicAlignment === 'object') {
    expectNumber(output.strategicAlignment.score, 'strategicAlignment.score', issues);
    expectArray(output.strategicAlignment.gaps, 'strategicAlignment.gaps', issues);
    expectArray(output.strategicAlignment.synergies, 'strategicAlignment.synergies', issues);

    if (typeof output.strategicAlignment.score === 'number') {
      if (output.strategicAlignment.score < 0 || output.strategicAlignment.score > 100) {
        issues.push({ field: 'strategicAlignment.score', message: 'Score must be between 0 and 100', severity: 'block' });
      }
    }
  }

  expectArray(output.recommendations, 'recommendations', issues);

  if (Array.isArray(output.recommendations)) {
    if (output.recommendations.length === 0) {
      issues.push({ field: 'recommendations', message: 'Expected at least 1 recommendation', severity: 'block' });
    }
    output.recommendations.forEach((rec: any, idx: number) => {
      expectString(rec?.priority, `recommendations[${idx}].priority`, issues);
      expectString(rec?.system, `recommendations[${idx}].system`, issues);
      expectString(rec?.action, `recommendations[${idx}].action`, issues);
      expectString(rec?.rationale, `recommendations[${idx}].rationale`, issues);
      expectString(rec?.timeline, `recommendations[${idx}].timeline`, issues);
    });
  }

  expectArray(output.crossSystemOpportunities, 'crossSystemOpportunities', issues);
  expectNumber(output.confidenceScore, 'confidenceScore', issues);

  if (typeof output.confidenceScore === 'number') {
    if (output.confidenceScore < 0 || output.confidenceScore > 1) {
      issues.push({ field: 'confidenceScore', message: 'Confidence must be between 0 and 1', severity: 'block' });
    }
  }

  expectString(output.insight, 'insight', issues);
  expectString(output.recommendedNextAction, 'recommendedNextAction', issues);
  expectString(output.mode, 'mode', issues);

  if (typeof output.offline !== 'boolean') {
    issues.push({ field: 'offline', message: 'Expected boolean', severity: 'block' });
  }

  expectString(output.generatedAt, 'generatedAt', issues);

  return buildResult(issues);
}

// -------------------------------------------------------------------------
// WAVE P1.3: SYSTEMS ARCHITECT EVALUATION
// -------------------------------------------------------------------------
export function evaluateSystemsArchitectOutput(output: any): QaGateResult {
  const issues: QaIssue[] = [];

  if (!output || typeof output !== 'object') {
    return buildResult([{ field: 'output', message: 'Output must be an object', severity: 'block' }]);
  }

  expectString(output.userId, 'userId', issues);
  expectString(output.requestType, 'requestType', issues);
  expectObject(output.analysis, 'analysis', issues);

  if (output.analysis && typeof output.analysis === 'object') {
    expectString(output.analysis.currentState, 'analysis.currentState', issues);
    expectString(output.analysis.proposedState, 'analysis.proposedState', issues);
    expectString(output.analysis.complexity, 'analysis.complexity', issues);
    expectString(output.analysis.estimatedEffort, 'analysis.estimatedEffort', issues);

    if (output.analysis.complexity && !['low', 'medium', 'high'].includes(output.analysis.complexity)) {
      issues.push({ field: 'analysis.complexity', message: 'Complexity must be low, medium, or high', severity: 'block' });
    }
  }

  expectArray(output.designRecommendations, 'designRecommendations', issues);

  if (Array.isArray(output.designRecommendations)) {
    if (output.designRecommendations.length === 0) {
      issues.push({ field: 'designRecommendations', message: 'Expected at least 1 design recommendation', severity: 'block' });
    }
    output.designRecommendations.forEach((rec: any, idx: number) => {
      expectString(rec?.component, `designRecommendations[${idx}].component`, issues);
      expectString(rec?.recommendation, `designRecommendations[${idx}].recommendation`, issues);
      expectString(rec?.rationale, `designRecommendations[${idx}].rationale`, issues);
      expectArray(rec?.dependencies, `designRecommendations[${idx}].dependencies`, issues);
    });
  }

  expectArray(output.automationOpportunities, 'automationOpportunities', issues);

  if (Array.isArray(output.automationOpportunities)) {
    output.automationOpportunities.forEach((opp: any, idx: number) => {
      expectString(opp?.trigger, `automationOpportunities[${idx}].trigger`, issues);
      expectString(opp?.action, `automationOpportunities[${idx}].action`, issues);
      expectString(opp?.expectedSavings, `automationOpportunities[${idx}].expectedSavings`, issues);
      expectString(opp?.implementationNotes, `automationOpportunities[${idx}].implementationNotes`, issues);
    });
  }

  expectArray(output.nextSteps, 'nextSteps', issues);

  if (Array.isArray(output.nextSteps) && output.nextSteps.length === 0) {
    issues.push({ field: 'nextSteps', message: 'Expected at least 1 next step', severity: 'block' });
  }

  expectNumber(output.confidenceScore, 'confidenceScore', issues);

  if (typeof output.confidenceScore === 'number') {
    if (output.confidenceScore < 0 || output.confidenceScore > 1) {
      issues.push({ field: 'confidenceScore', message: 'Confidence must be between 0 and 1', severity: 'block' });
    }
  }

  expectString(output.insight, 'insight', issues);
  expectString(output.recommendedNextAction, 'recommendedNextAction', issues);
  expectString(output.mode, 'mode', issues);

  if (typeof output.offline !== 'boolean') {
    issues.push({ field: 'offline', message: 'Expected boolean', severity: 'block' });
  }

  expectString(output.generatedAt, 'generatedAt', issues);

  return buildResult(issues);
}

export type P0AgentKind = 'dailyFocus' | 'actionPack' | 'calendarOptimize' | 'financialAllocate' | 'insights' | 'nicheDiscover';

export type P1AgentKind = 'mindset' | 'rhythm' | 'purpose' | 'integratedStrategist' | 'systemsArchitect';

export type AgentKind = P0AgentKind | P1AgentKind;

export function runP0QaGate(kind: AgentKind, output: unknown): QaGateResult {
  if (kind === 'dailyFocus') {
    return evaluateDailyFocusOutput(output);
  }
  if (kind === 'actionPack') {
    return evaluateActionPackOutput(output);
  }
  if (kind === 'calendarOptimize') {
    return evaluateCalendarOptimizerOutput(output);
  }
  if (kind === 'financialAllocate') {
    return evaluateFinancialAllocatorOutput(output);
  }
  if (kind === 'insights') {
    return evaluateInsightAnalystOutput(output);
  }
  if (kind === 'nicheDiscover') {
    return evaluateNicheDiscoverOutput(output);
  }
  if (kind === 'mindset') {
    return evaluateMindsetOutput(output);
  }
  if (kind === 'rhythm') {
    return evaluateRhythmOutput(output);
  }
  if (kind === 'purpose') {
    return evaluatePurposeOutput(output);
  }
  if (kind === 'integratedStrategist') {
    return evaluateIntegratedStrategistOutput(output);
  }
  if (kind === 'systemsArchitect') {
    return evaluateSystemsArchitectOutput(output);
  }
    throw new Error(`Unknown agent kind: ${kind}`);
}
