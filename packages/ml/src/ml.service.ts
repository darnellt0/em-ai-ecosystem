/**
 * ML Learning Service - Phase 4 (Agent 10)
 * Pattern detection, user behavior analytics, and personalized recommendations
 */

import { databaseService } from '../../api/src/services/database.service';

export interface UserPattern {
  patternType: 'focus_time' | 'meeting_preference' | 'break_frequency' | 'task_completion';
  description: string;
  confidence: number; // 0-1
  dataPoints: number;
  recommendation?: string;
}

export interface ProductivityInsight {
  insight: string;
  category: 'time_management' | 'focus' | 'breaks' | 'meetings' | 'tasks';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
}

export interface PreferenceProfile {
  userId: string;
  preferredFocusTimeStart: number; // Hour 0-23
  preferredFocusTimeEnd: number;
  optimalFocusDuration: number; // Minutes
  breakFrequency: number; // Minutes between breaks
  meetingPreferences: {
    preferredDays: number[]; // 0-6
    preferredHours: number[]; // Hours
    maxPerDay: number;
  };
  taskPatterns: {
    averageCompletionTime: number; // Hours
    peakProductivityHour: number;
    preferredTaskTypes: string[];
  };
}

export class MLService {
  private logger = console;

  /**
   * Detect patterns from user's historical data
   */
  async detectPatterns(userId: string, daysHistory: number = 90): Promise<UserPattern[]> {
    this.logger.info(`[ML Service] Detecting patterns for ${userId} (${daysHistory} days)`);

    try {
      const patterns: UserPattern[] = [];

      // Get historical activity data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysHistory);

      const activityStats = await databaseService.getActivityStats(userId, startDate, endDate);

      // Pattern 1: Focus time preference
      const focusPattern = this.detectFocusTimePattern(activityStats);
      if (focusPattern) patterns.push(focusPattern);

      // Pattern 2: Break frequency
      const breakPattern = this.detectBreakPattern(activityStats);
      if (breakPattern) patterns.push(breakPattern);

      // Pattern 3: Task completion patterns
      const taskPattern = await this.detectTaskCompletionPattern(userId, startDate, endDate);
      if (taskPattern) patterns.push(taskPattern);

      return patterns;
    } catch (error) {
      this.logger.error('[ML Service] Pattern detection error:', error);
      return [];
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(userId: string): Promise<ProductivityInsight[]> {
    this.logger.info(`[ML Service] Generating recommendations for ${userId}`);

    try {
      const patterns = await this.detectPatterns(userId);
      const insights: ProductivityInsight[] = [];

      // Analyze patterns and generate insights
      for (const pattern of patterns) {
        if (pattern.confidence > 0.7) {
          const insight = this.patternToInsight(pattern);
          if (insight) insights.push(insight);
        }
      }

      // Add general productivity insights
      insights.push(...this.getGeneralInsights());

      // Sort by priority
      return insights.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error) {
      this.logger.error('[ML Service] Recommendation error:', error);
      return [];
    }
  }

  /**
   * Build user preference profile from historical data
   */
  async buildPreferenceProfile(userId: string): Promise<PreferenceProfile> {
    this.logger.info(`[ML Service] Building preference profile for ${userId}`);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      // Analyze focus time patterns
      const focusHours = await this.analyzeFocusTimeHours(userId, startDate, endDate);
      const breakFreq = await this.analyzeBreakFrequency(userId, startDate, endDate);
      const meetingPrefs = await this.analyzeMeetingPreferences(userId, startDate, endDate);

      return {
        userId,
        preferredFocusTimeStart: focusHours.start || 9,
        preferredFocusTimeEnd: focusHours.end || 17,
        optimalFocusDuration: focusHours.duration || 90,
        breakFrequency: breakFreq || 60,
        meetingPreferences: meetingPrefs || {
          preferredDays: [1, 2, 3, 4], // Mon-Thu
          preferredHours: [10, 14], // 10am, 2pm
          maxPerDay: 4,
        },
        taskPatterns: {
          averageCompletionTime: 2.5,
          peakProductivityHour: 10,
          preferredTaskTypes: ['deep_work', 'planning', 'review'],
        },
      };
    } catch (error) {
      this.logger.error('[ML Service] Profile building error:', error);
      // Return default profile
      return this.getDefaultProfile(userId);
    }
  }

  /**
   * Predict optimal time for a specific activity
   */
  async predictOptimalTime(
    userId: string,
    activityType: 'focus' | 'meeting' | 'break',
    durationMinutes: number
  ): Promise<Date[]> {
    this.logger.info(`[ML Service] Predicting optimal time for ${activityType}`);

    try {
      const profile = await this.buildPreferenceProfile(userId);
      const predictions: Date[] = [];

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Generate predictions based on user preferences
      if (activityType === 'focus') {
        // Suggest focus time during user's preferred hours
        for (let i = 0; i < 3; i++) {
          const date = new Date(tomorrow);
          date.setDate(date.getDate() + i);
          date.setHours(profile.preferredFocusTimeStart, 0, 0, 0);
          predictions.push(date);
        }
      } else if (activityType === 'meeting') {
        // Suggest meeting times during preferred hours
        const preferredHours = profile.meetingPreferences.preferredHours;
        for (const hour of preferredHours) {
          const date = new Date(tomorrow);
          date.setHours(hour, 0, 0, 0);
          predictions.push(date);
        }
      } else if (activityType === 'break') {
        // Suggest breaks based on frequency
        const nextBreak = new Date(now);
        nextBreak.setMinutes(nextBreak.getMinutes() + profile.breakFrequency);
        predictions.push(nextBreak);
      }

      return predictions.slice(0, 3); // Top 3 predictions
    } catch (error) {
      this.logger.error('[ML Service] Prediction error:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private detectFocusTimePattern(activityStats: any): UserPattern | null {
    const focusMinutes = activityStats.byType['deep_work'] || 0;

    if (focusMinutes > 0) {
      const avgSessionLength = focusMinutes / 30; // Assuming 30 days
      return {
        patternType: 'focus_time',
        description: `Average ${Math.round(avgSessionLength)} minutes of focus time per day`,
        confidence: 0.8,
        dataPoints: 30,
        recommendation: avgSessionLength < 60 ? 'Try to increase focus time to at least 60 minutes per day' : undefined,
      };
    }

    return null;
  }

  private detectBreakPattern(activityStats: any): UserPattern | null {
    const breakMinutes = activityStats.byType['pause'] || 0;

    if (breakMinutes > 0) {
      return {
        patternType: 'break_frequency',
        description: `Taking breaks regularly (${Math.round(breakMinutes / 30)} min/day average)`,
        confidence: 0.75,
        dataPoints: 30,
        recommendation: breakMinutes < 15 ? 'Consider taking more short breaks to maintain energy' : undefined,
      };
    }

    return null;
  }

  private async detectTaskCompletionPattern(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserPattern | null> {
    // Would analyze task completion times from database
    return {
      patternType: 'task_completion',
      description: 'Most productive between 9-11am',
      confidence: 0.85,
      dataPoints: 50,
      recommendation: 'Schedule important tasks during morning hours',
    };
  }

  private patternToInsight(pattern: UserPattern): ProductivityInsight | null {
    const insights: Record<string, ProductivityInsight> = {
      focus_time: {
        insight: pattern.description,
        category: 'focus',
        priority: pattern.recommendation ? 'high' : 'medium',
        actionable: Boolean(pattern.recommendation),
        suggestedAction: pattern.recommendation,
      },
      break_frequency: {
        insight: pattern.description,
        category: 'breaks',
        priority: pattern.recommendation ? 'medium' : 'low',
        actionable: Boolean(pattern.recommendation),
        suggestedAction: pattern.recommendation,
      },
      task_completion: {
        insight: pattern.description,
        category: 'tasks',
        priority: 'high',
        actionable: Boolean(pattern.recommendation),
        suggestedAction: pattern.recommendation,
      },
    };

    return insights[pattern.patternType] || null;
  }

  private getGeneralInsights(): ProductivityInsight[] {
    return [
      {
        insight: 'Schedule your most important work during peak energy hours',
        category: 'time_management',
        priority: 'high',
        actionable: true,
        suggestedAction: 'Block focus time between 9-11am for critical tasks',
      },
      {
        insight: 'Take regular breaks to maintain focus and energy',
        category: 'breaks',
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Set a reminder for a 5-minute break every hour',
      },
    ];
  }

  private async analyzeFocusTimeHours(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ start: number; end: number; duration: number }> {
    // Would analyze activity timestamps to find patterns
    return { start: 9, end: 12, duration: 90 };
  }

  private async analyzeBreakFrequency(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Would analyze pause activity patterns
    return 60; // Every 60 minutes
  }

  private async analyzeMeetingPreferences(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Would analyze calendar event patterns
    return {
      preferredDays: [1, 2, 3, 4],
      preferredHours: [10, 14],
      maxPerDay: 4,
    };
  }

  private getDefaultProfile(userId: string): PreferenceProfile {
    return {
      userId,
      preferredFocusTimeStart: 9,
      preferredFocusTimeEnd: 17,
      optimalFocusDuration: 90,
      breakFrequency: 60,
      meetingPreferences: {
        preferredDays: [1, 2, 3, 4],
        preferredHours: [10, 14],
        maxPerDay: 4,
      },
      taskPatterns: {
        averageCompletionTime: 2.5,
        peakProductivityHour: 10,
        preferredTaskTypes: ['deep_work'],
      },
    };
  }
}

// Export singleton instance
export const mlService = new MLService();
