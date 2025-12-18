import { AgentOutput } from '../../shared/contracts';
import { insightsService } from '../../api/src/services/insights.service';

interface InsightAdapterPayload {
  userId?: string;
  founderEmail?: string;
  __skip?: boolean;
  __forceFail?: boolean;
}

export async function runInsightAdapter(payload: InsightAdapterPayload): Promise<AgentOutput<any>> {
  if (payload.__skip) {
    return { status: 'SKIPPED', warnings: ['Skipped by debug flag'] };
  }
  if (!payload.userId && !payload.founderEmail) {
    return { status: 'FAILED', error: 'userId or founderEmail is required' };
  }
  if (payload.__forceFail) {
    return { status: 'FAILED', error: 'Forced failure (debug)' };
  }

  const founderEmail = payload.founderEmail || payload.userId || '';

  try {
    const insightBrief = await insightsService.generateDailyBrief(founderEmail);
    const insights = insightBrief.sections?.map((s: any) => ({
      title: s.title || 'Insight',
      detail: s.summary || s.description || '',
      confidence: s.priority === 'high' ? 0.8 : 0.6,
    }));
    const suggestedActions =
      insightBrief.sections?.flatMap((s: any) => s.actionItems || []).map((a: any) => ({
        title: a.title || 'Action',
        detail: a.detail || String(a),
      })) || [];

    return {
      status: 'OK',
      output: {
        summary: insightBrief.summary || 'Insights generated',
        insights: insights || [],
        suggestedActions,
        confidence: 0.7,
      },
    };
  } catch (err: any) {
    return { status: 'FAILED', error: err.message };
  }
}
