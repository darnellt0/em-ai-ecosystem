/**
 * Insights Service - Analytics and Pattern Detection
 * Powers Daily Brief, Insight Analyst, and other intelligence-based agents
 */

import { databaseService } from './database.service';

export interface ActivityInsight {
  type: 'focus' | 'pause' | 'meeting' | 'task';
  count: number;
  totalMinutes: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

export interface DailyMetrics {
  totalFocusMinutes: number;
  totalPauseMinutes: number;
  tasksCompleted: number;
  meetingsAttended: number;
  energyLevel: 'low' | 'medium' | 'high';
  productivityScore: number;
  focusQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BriefSection {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  actionItems?: string[];
}

export class InsightsService {
  private logger = console;

  /**
   * Generate daily brief for founder
   */
  async generateDailyBrief(founderEmail: string): Promise<{
    title: string;
    sections: BriefSection[];
    summary: string;
  }> {
    try {
      this.logger.info(`[Insights] Generating daily brief for ${founderEmail}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's metrics
      const metrics = await this.getDailyMetrics(founderEmail, today, tomorrow);

      // Get yesterday's metrics for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(today);
      const yesterdayMetrics = await this.getDailyMetrics(founderEmail, yesterday, yesterdayEnd);

      // Build sections
      const sections: BriefSection[] = [];

      // 1. Focus Summary
      sections.push({
        title: '🎯 Focus Performance',
        content: `You've logged ${metrics.totalFocusMinutes} minutes of focused work today. ${this.generateFocusInsight(metrics.totalFocusMinutes, yesterdayMetrics.totalFocusMinutes)}`,
        priority: 'high',
      });

      // 2. Task Progress
      sections.push({
        title: '✅ Task Progress',
        content: `You've completed ${metrics.tasksCompleted} tasks today. Keep the momentum going!`,
        priority: 'high',
        actionItems: ['Review pending tasks', 'Plan tomorrow\'s priorities'],
      });

      // 3. Energy Management
      sections.push({
        title: '⚡ Energy Level',
        content: `Your energy level is ${metrics.energyLevel}. ${this.generateEnergyRecommendation(metrics.energyLevel, metrics.totalPauseMinutes)}`,
        priority: 'medium',
        actionItems: metrics.energyLevel === 'low' ? ['Take a break', 'Go for a walk', 'Hydrate'] : [],
      });

      // 4. Meetings
      if (metrics.meetingsAttended > 0) {
        sections.push({
          title: '📅 Meeting Summary',
          content: `You attended ${metrics.meetingsAttended} meeting${metrics.meetingsAttended > 1 ? 's' : ''} today.`,
          priority: 'low',
        });
      }

      // 5. Productivity Score
      sections.push({
        title: '📊 Productivity Score',
        content: `Today's productivity score: ${metrics.productivityScore}/100. Focus quality: ${metrics.focusQuality}.`,
        priority: 'medium',
        actionItems: [this.getProductivityRecommendation(metrics.productivityScore)],
      });

      return {
        title: `Daily Brief for ${new Date().toLocaleDateString()}`,
        sections,
        summary: `You're ${metrics.energyLevel === 'high' ? 'having a great day' : metrics.energyLevel === 'medium' ? 'on track' : 'feeling tired'}. Keep going!`,
      };
    } catch (error) {
      this.logger.error('[Insights] Daily brief error:', error);
      throw error;
    }
  }

  /**
   * Get insights for a time period
   */
  async getInsights(founderEmail: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<ActivityInsight[]> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'daily':
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      this.logger.info(`[Insights] Generating ${timeframe} insights for ${founderEmail}`);

      const stats = await databaseService.getActivityStats(founderEmail, startDate, now);

      const insights: ActivityInsight[] = [];

      // Focus insight
      if (stats.byType['deep-work'] !== undefined || stats.byType['focus'] !== undefined) {
        const focusMinutes = stats.byType['deep-work'] || stats.byType['focus'] || 0;
        insights.push({
          type: 'focus',
          count: Math.floor(focusMinutes / 60), // Convert to hours
          totalMinutes: focusMinutes,
          trend: focusMinutes > 120 ? 'up' : 'stable',
          recommendation: focusMinutes > 120 ? 'Excellent focus sessions! Keep up the momentum.' : 'Try to increase daily focus time.',
        });
      }

      // Pause insight
      if (stats.byType['pause'] !== undefined || stats.byType['meditation'] !== undefined) {
        const pauseMinutes = stats.byType['pause'] || stats.byType['meditation'] || 0;
        insights.push({
          type: 'pause',
          count: pauseMinutes > 0 ? Math.ceil(pauseMinutes / 10) : 0, // Count sessions
          totalMinutes: pauseMinutes,
          trend: pauseMinutes > 20 ? 'up' : 'down',
          recommendation: pauseMinutes > 20 ? 'Great self-care routine!' : 'Consider adding more breaks to prevent burnout.',
        });
      }

      // Task insight
      if (stats.byType['task-completion'] !== undefined) {
        const taskMinutes = stats.byType['task-completion'] || 0;
        insights.push({
          type: 'task',
          count: Math.floor(taskMinutes / 30), // Estimate task count
          totalMinutes: taskMinutes,
          trend: taskMinutes > 180 ? 'up' : 'stable',
          recommendation: 'Keep completing tasks at this pace!',
        });
      }

      return insights;
    } catch (error) {
      this.logger.error('[Insights] Get insights error:', error);
      return [];
    }
  }

  /**
   * Calculate daily metrics
   */
  private async getDailyMetrics(
    founderEmail: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyMetrics> {
    const stats = await databaseService.getActivityStats(founderEmail, startDate, endDate);

    const focusMinutes = (stats.byType['focus'] || stats.byType['deep-work'] || 0);
    const pauseMinutes = (stats.byType['pause'] || stats.byType['meditation'] || 0);
    const tasksCompleted = Math.max(1, Math.floor((stats.byType['task-completion'] || 0) / 30));
    const meetingsAttended = Math.max(0, Math.floor((stats.byType['meeting'] || 0) / 30));

    // Calculate energy level based on ratio of focus to pause
    let energyLevel: 'low' | 'medium' | 'high' = 'medium';
    if (focusMinutes > 240) {
      energyLevel = pauseMinutes > 30 ? 'high' : 'medium';
    } else if (focusMinutes < 60) {
      energyLevel = 'low';
    }

    // Calculate productivity score (0-100)
    const focusScore = Math.min(50, focusMinutes / 2.4); // Max 50 points for 2+ hours focus
    const taskScore = Math.min(30, tasksCompleted * 7.5); // Max 30 points for 4+ tasks
    const pauseScore = Math.min(20, pauseMinutes / 5); // Max 20 points for good breaks
    const productivityScore = Math.round(focusScore + taskScore + pauseScore);

    // Determine focus quality
    let focusQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (focusMinutes > 240) {
      focusQuality = pauseMinutes > 30 ? 'excellent' : 'good';
    } else if (focusMinutes > 120) {
      focusQuality = 'good';
    } else if (focusMinutes < 60) {
      focusQuality = 'poor';
    }

    return {
      totalFocusMinutes: focusMinutes,
      totalPauseMinutes: pauseMinutes,
      tasksCompleted: tasksCompleted,
      meetingsAttended: meetingsAttended,
      energyLevel,
      productivityScore,
      focusQuality,
    };
  }

  /**
   * Generate focus insight based on comparison
   */
  private generateFocusInsight(today: number, yesterday: number): string {
    if (today > yesterday * 1.2) {
      return `That's ${Math.round((today - yesterday) / yesterday * 100)}% more than yesterday!`;
    } else if (today < yesterday * 0.8) {
      return `That's ${Math.round((yesterday - today) / yesterday * 100)}% less than yesterday. Try to refocus!`;
    } else {
      return 'About the same as yesterday.';
    }
  }

  /**
   * Generate energy recommendation
   */
  private generateEnergyRecommendation(level: string, pauseMinutes: number): string {
    if (level === 'low') {
      if (pauseMinutes < 10) {
        return 'You need more breaks! Try taking a 5-minute pause.';
      }
      return 'Consider wrapping up and getting some rest.';
    } else if (level === 'high') {
      return 'You\'re in the zone! Keep capitalizing on this energy.';
    } else {
      return 'You\'re maintaining good energy. Keep a balanced pace.';
    }
  }

  /**
   * Get productivity recommendation
   */
  private getProductivityRecommendation(score: number): string {
    if (score >= 80) {
      return '🌟 Exceptional day! Maintain this pace.';
    } else if (score >= 60) {
      return '👍 Good progress. Small tweaks could boost productivity.';
    } else if (score >= 40) {
      return '⚠️ Moderate day. Try increasing focus sessions tomorrow.';
    } else {
      return '📈 Low productivity. Consider adjusting your schedule.';
    }
  }

  /**
   * Detect patterns in activity
   */
  async detectPatterns(founderEmail: string, days: number = 7): Promise<{
    peakHours: string[];
    productivityPattern: string;
    focusDuration: string;
    breakPattern: string;
  }> {
    try {
      this.logger.info(`[Insights] Detecting patterns for ${founderEmail} over ${days} days`);

      // Simulate pattern detection
      return {
        peakHours: ['9-11 AM', '2-4 PM'],
        productivityPattern: 'You\'re most productive in the morning',
        focusDuration: 'Average focus session: 60 minutes',
        breakPattern: 'You take breaks every 90 minutes on average',
      };
    } catch (error) {
      this.logger.error('[Insights] Pattern detection error:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for improvement
   */
  async getRecommendations(founderEmail: string): Promise<string[]> {
    try {
      this.logger.info(`[Insights] Generating recommendations for ${founderEmail}`);

      return [
        '🎯 Schedule your deepest work during peak hours (9-11 AM)',
        '⏰ Try the Pomodoro technique with 50-min focus + 10-min breaks',
        '🧘 Add more meditation sessions before difficult tasks',
        '📊 Review your weekly metrics every Sunday',
        '💪 Celebrate small wins to maintain motivation',
      ];
    } catch (error) {
      this.logger.error('[Insights] Recommendations error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const insightsService = new InsightsService();
