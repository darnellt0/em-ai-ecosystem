/**
 * P0 Insight Analyst Flow
 *
 * Per MAB v1.0 Section 7.2:
 * "Reads across systems to surface trends and insights."
 *
 * Features:
 * - Energy scoring (0-100)
 * - Burnout risk detection
 * - Pattern identification
 * - Trend analysis
 */

import { InsightsService } from '../../services/insights.service';

const insightsService = new InsightsService();

export interface InsightAnalystInput {
  userId: string;
  timeframe?: 'daily' | 'weekly' | 'monthly';
  includeEnergy?: boolean;
  includeBurnoutRisk?: boolean;
}

export interface InsightAnalystOutput {
  userId: string;
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    trend: 'up' | 'down' | 'stable';
    score?: number;
    recommendation: string;
  }>;
  energyScore?: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    factors: string[];
  };
  burnoutRisk?: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
    recommendations: string[];
  };
  summary: string;
  generatedAt: string;
}

export async function runP0InsightAnalyst(
  input: InsightAnalystInput
): Promise<{ runId: string; data: InsightAnalystOutput }> {
  const runId = `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timeframe = input.timeframe || 'daily';

  console.log(`[P0 Insight Analyst] Starting run ${runId} for ${input.userId}`);
  console.log(`[P0 Insight Analyst] Timeframe: ${timeframe}`);

  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  // Get insights from existing service
  let activityInsights: any[] = [];
  try {
    activityInsights = await insightsService.getInsights(input.userId, timeframe);
  } catch (error) {
    console.warn('[P0 Insight Analyst] Could not fetch activity insights:', error);
  }

  // Transform to P0 format
  const insights = activityInsights.map(insight => ({
    type: insight.type,
    title: getInsightTitle(insight.type),
    description: `${insight.totalMinutes} minutes tracked`,
    trend: insight.trend,
    score: insight.type === 'focus' ? Math.min(100, Math.round(insight.totalMinutes / 2.4)) : undefined,
    recommendation: insight.recommendation,
  }));

  // Add default insights if none found
  if (insights.length === 0) {
    insights.push({
      type: 'activity',
      title: 'Activity Overview',
      description: 'No activity data available for this period',
      trend: 'stable' as const,
      score: undefined,
      recommendation: 'Start tracking your focus sessions to get personalized insights',
    });
  }

  // Calculate energy score
  let energyScore: InsightAnalystOutput['energyScore'] | undefined;
  if (input.includeEnergy !== false) {
    const focusInsight = insights.find(i => i.type === 'focus');
    const pauseInsight = insights.find(i => i.type === 'pause');

    const focusScore = focusInsight?.score || 50;
    const hasPauses = pauseInsight && pauseInsight.trend !== 'down';

    energyScore = {
      current: Math.round(focusScore * (hasPauses ? 1.1 : 0.9)),
      trend: focusInsight?.trend || 'stable',
      factors: [
        focusScore > 60 ? 'Good focus time logged' : 'Focus time could improve',
        hasPauses ? 'Taking adequate breaks' : 'Consider more breaks',
      ],
    };
  }

  // Assess burnout risk
  let burnoutRisk: InsightAnalystOutput['burnoutRisk'] | undefined;
  if (input.includeBurnoutRisk !== false) {
    const focusInsight = insights.find(i => i.type === 'focus');
    const pauseInsight = insights.find(i => i.type === 'pause');

    const highFocus = focusInsight && focusInsight.trend === 'up';
    const lowPauses = !pauseInsight || pauseInsight.trend === 'down';

    let level: 'low' | 'medium' | 'high' = 'low';
    const indicators: string[] = [];
    const recommendations: string[] = [];

    if (highFocus && lowPauses) {
      level = 'medium';
      indicators.push('High focus with few breaks');
      recommendations.push('Schedule recovery time');
    }

    if (timeframe === 'weekly' && highFocus) {
      level = level === 'medium' ? 'high' : 'medium';
      indicators.push('Sustained high intensity');
      recommendations.push('Plan a rest day this week');
    }

    if (level === 'low') {
      indicators.push('Balanced work-rest ratio');
      recommendations.push('Maintain current rhythm');
    }

    burnoutRisk = { level, indicators, recommendations };
  }

  // Generate summary
  const summaryParts: string[] = [];
  if (energyScore) {
    summaryParts.push(`Energy score: ${energyScore.current}/100`);
  }
  if (burnoutRisk) {
    summaryParts.push(`Burnout risk: ${burnoutRisk.level}`);
  }
  summaryParts.push(`${insights.length} insights generated for ${timeframe} period`);

  const output: InsightAnalystOutput = {
    userId: input.userId,
    timeframe,
    period: {
      start: startDate.toISOString(),
      end: now.toISOString(),
    },
    insights,
    energyScore,
    burnoutRisk,
    summary: summaryParts.join('. ') + '.',
    generatedAt: now.toISOString(),
  };

  console.log(`[P0 Insight Analyst] Complete: ${runId}`, {
    insights: insights.length,
    energyScore: energyScore?.current,
    burnoutRisk: burnoutRisk?.level,
  });

  return { runId, data: output };
}

function getInsightTitle(type: string): string {
  const titles: Record<string, string> = {
    focus: 'Focus & Deep Work',
    pause: 'Rest & Recovery',
    meeting: 'Meeting Load',
    task: 'Task Completion',
    activity: 'Activity Overview',
  };
  return titles[type] || 'General Insight';
}
