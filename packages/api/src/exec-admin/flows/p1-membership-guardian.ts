export type MembershipTimeframe = '30d' | '60d' | '90d';
export type MembershipStatus = 'healthy' | 'watch' | 'at_risk';
export type InterventionType = 'check_in' | 'content_nudge' | 'pause' | 'escalate';

export interface MembershipSignals {
  attendance?: number;
  engagement?: number;
  missedTouchpoints?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface MembershipGuardianInput {
  memberId?: string;
  timeframe?: MembershipTimeframe;
  signals?: MembershipSignals;
  mode?: 'offline' | 'live';
}

export interface MembershipGuardianOutput {
  runId: string;
  memberId: string;
  timeframe: MembershipTimeframe;
  status: MembershipStatus;
  signalsDetected: string[];
  recommendedIntervention: {
    type: InterventionType;
    messageDraft: string;
    notes?: string;
  };
  confidenceScore: number;
  insight?: string;
  recommendedNextAction?: string;
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

const VALID_TIMEFRAMES: MembershipTimeframe[] = ['30d', '60d', '90d'];

export async function runP1MembershipGuardian(
  input: MembershipGuardianInput
): Promise<{ runId: string; data: MembershipGuardianOutput }> {
  const runId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const memberId = normalizeString(input?.memberId, 'unknown-member');
  const timeframe = normalizeTimeframe(input?.timeframe);
  const signals = normalizeSignals(input?.signals);

  const hasSignals = signals.engagement !== null
    || signals.missedTouchpoints !== null
    || signals.sentiment !== null
    || signals.attendance !== null;

  let confidenceScore = 0.8;
  let status: MembershipStatus = 'watch';
  let signalsDetected: string[] = [];
  let recommendedIntervention: MembershipGuardianOutput['recommendedIntervention'];
  let insight = '';
  let recommendedNextAction: string | undefined;

  if (!hasSignals) {
    confidenceScore = 0.5;
    status = 'watch';
    signalsDetected = ['missing_signals'];
    recommendedIntervention = {
      type: 'check_in',
      messageDraft: 'Quick check-in: can you share recent engagement and touchpoints so we can support you well?',
      notes: 'Awaiting core signals.',
    };
    insight = 'No member signals provided; defaulting to a light check-in.';
    recommendedNextAction = 'Provide engagement, missed touchpoints, and sentiment for a clearer assessment.';
  } else {
    const evaluation = evaluateStatus(signals);
    status = evaluation.status;
    signalsDetected = evaluation.signalsDetected;
    confidenceScore = evaluation.confidenceScore;

    recommendedIntervention = buildIntervention(status);
    insight = evaluation.insight;

    if (evaluation.missingSignals.length > 0) {
      recommendedNextAction = `Provide missing signals: ${evaluation.missingSignals.join(', ')}.`;
      confidenceScore = Math.min(confidenceScore, 0.6);
    }
  }

  if (memberId === 'unknown-member') {
    confidenceScore = Math.min(confidenceScore, 0.4);
    recommendedNextAction = 'Share the memberId to log this assessment.';
  }

  const output: MembershipGuardianOutput = {
    runId,
    memberId,
    timeframe,
    status,
    signalsDetected,
    recommendedIntervention,
    confidenceScore,
    insight,
    recommendedNextAction,
    mode: 'offline',
    offline: true,
    generatedAt: new Date().toISOString(),
  };

  console.log('[P1 Membership Guardian] Complete', { runId, status, offline: true });

  return { runId, data: output };
}

function normalizeTimeframe(value?: string): MembershipTimeframe {
  return VALID_TIMEFRAMES.includes(value as MembershipTimeframe) ? (value as MembershipTimeframe) : '30d';
}

function normalizeString(value?: string, fallback?: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback || '';
}

function normalizeSignals(signals?: MembershipSignals): {
  attendance: number | null;
  engagement: number | null;
  missedTouchpoints: number | null;
  sentiment: MembershipSignals['sentiment'] | null;
} {
  return {
    attendance: normalizeNumber(signals?.attendance),
    engagement: normalizeNumber(signals?.engagement),
    missedTouchpoints: normalizeNumber(signals?.missedTouchpoints),
    sentiment: normalizeSentiment(signals?.sentiment),
  };
}

function normalizeNumber(value?: number): number | null {
  return typeof value === 'number' && !isNaN(value) ? value : null;
}

function normalizeSentiment(value?: MembershipSignals['sentiment']): MembershipSignals['sentiment'] | null {
  if (value === 'positive' || value === 'neutral' || value === 'negative') {
    return value;
  }
  return null;
}

function evaluateStatus(signals: {
  attendance: number | null;
  engagement: number | null;
  missedTouchpoints: number | null;
  sentiment: MembershipSignals['sentiment'] | null;
}): {
  status: MembershipStatus;
  signalsDetected: string[];
  confidenceScore: number;
  insight: string;
  missingSignals: string[];
} {
  const signalsDetected: string[] = [];
  const missingSignals: string[] = [];

  if (signals.engagement === null) missingSignals.push('engagement');
  if (signals.missedTouchpoints === null) missingSignals.push('missedTouchpoints');
  if (signals.sentiment === null) missingSignals.push('sentiment');

  if (signals.sentiment === 'negative') {
    signalsDetected.push('negative_sentiment');
  }
  if (signals.engagement !== null && signals.engagement <= 3) {
    signalsDetected.push('low_engagement');
  }
  if (signals.engagement !== null && signals.engagement >= 4 && signals.engagement <= 6) {
    signalsDetected.push('moderate_engagement');
  }
  if (signals.missedTouchpoints !== null && signals.missedTouchpoints >= 4) {
    signalsDetected.push('missed_touchpoints');
  }
  if (signals.missedTouchpoints !== null && signals.missedTouchpoints >= 2 && signals.missedTouchpoints <= 3) {
    signalsDetected.push('elevated_missed_touchpoints');
  }
  if (signals.attendance !== null && signals.attendance <= 1) {
    signalsDetected.push('low_attendance');
  }

  let status: MembershipStatus = 'watch';
  if (
    signals.sentiment === 'negative'
    || (signals.engagement !== null && signals.engagement <= 3)
    || (signals.missedTouchpoints !== null && signals.missedTouchpoints >= 4)
  ) {
    status = 'at_risk';
  } else if (
    (signals.engagement !== null && signals.engagement >= 4 && signals.engagement <= 6)
    || (signals.missedTouchpoints !== null && signals.missedTouchpoints >= 2 && signals.missedTouchpoints <= 3)
  ) {
    status = 'watch';
  } else if (
    (signals.engagement !== null && signals.engagement >= 7)
    && (signals.missedTouchpoints !== null && signals.missedTouchpoints <= 1)
  ) {
    status = 'healthy';
  }

  if (status !== 'healthy' && signalsDetected.length === 0) {
    signalsDetected.push('limited_signals');
  }

  let confidenceScore = 0.8;
  if (missingSignals.length > 0) {
    confidenceScore = 0.6;
  }

  const insight = status === 'healthy'
    ? 'Engagement signals look stable.'
    : status === 'watch'
      ? 'Early warning signals suggest proactive outreach.'
      : 'Risk signals suggest immediate support is needed.';

  return {
    status,
    signalsDetected,
    confidenceScore,
    insight,
    missingSignals,
  };
}

function buildIntervention(status: MembershipStatus): MembershipGuardianOutput['recommendedIntervention'] {
  if (status === 'healthy') {
    return {
      type: 'content_nudge',
      messageDraft: 'Love the momentum. Here is a quick resource to keep your progress steady.',
      notes: 'Light nudge to reinforce engagement.',
    };
  }

  if (status === 'watch') {
    return {
      type: 'check_in',
      messageDraft: 'Quick check-in: how can we best support you this week?',
      notes: 'Gentle outreach to prevent drift.',
    };
  }

  return {
    type: 'escalate',
    messageDraft: 'We noticed some missed touchpoints and want to support you. Open to a short check-in?',
    notes: 'Care-first outreach for at-risk member.',
  };
}
