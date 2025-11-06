/**
 * Analytics Service - Phase 3
 * Provides real-time metrics and insights for the dashboard
 */

import { databaseService } from './database.service';

export interface DashboardMetrics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  };
  timeTracking: {
    totalFocusMinutes: number;
    totalMeetingMinutes: number;
    totalPauseMinutes: number;
    deepWorkSessions: number;
  };
  productivity: {
    tasksCompletedToday: number;
    focusHoursToday: number;
    averageTaskCompletionTime: number;
    productivityScore: number;
  };
  calendar: {
    eventsToday: number;
    eventsThisWeek: number;
    focusBlocksCreated: number;
    conflictsDetected: number;
  };
  costs: {
    totalCostThisMonth: number;
    apiCallsThisMonth: number;
    costPerDay: number;
    projectedMonthly: number;
  };
}

export interface ActivityTimeline {
  timestamp: Date;
  type: string;
  duration: number;
  description: string;
}

export interface ProductivityTrend {
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  productivityScore: number;
}

export class AnalyticsService {
  private logger = console;

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(founderEmail: string): Promise<DashboardMetrics> {
    this.logger.info(`[Analytics] Getting dashboard metrics for ${founderEmail}`);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get tasks overview
      const allTasks = await databaseService.getPendingTasks(founderEmail);
      const completedTasksCount = await this.getCompletedTasksCount(founderEmail, monthStart);
      const totalTasks = allTasks.length + completedTasksCount;

      // Get activity stats
      const activityStats = await databaseService.getActivityStats(founderEmail, monthStart, now);
      const todayActivityStats = await databaseService.getActivityStats(founderEmail, todayStart, now);

      // Calculate metrics
      const completionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
      const productivityScore = this.calculateProductivityScore(
        completedTasksCount,
        activityStats.byType['deep_work'] || 0,
        activityStats.byType['pause'] || 0
      );

      return {
        overview: {
          totalTasks,
          completedTasks: completedTasksCount,
          pendingTasks: allTasks.length,
          completionRate: Math.round(completionRate),
        },
        timeTracking: {
          totalFocusMinutes: activityStats.byType['deep_work'] || 0,
          totalMeetingMinutes: activityStats.byType['meeting'] || 0,
          totalPauseMinutes: activityStats.byType['pause'] || 0,
          deepWorkSessions: await this.getDeepWorkSessionCount(founderEmail, monthStart),
        },
        productivity: {
          tasksCompletedToday: await this.getCompletedTasksCount(founderEmail, todayStart),
          focusHoursToday: Math.round((todayActivityStats.byType['deep_work'] || 0) / 60 * 10) / 10,
          averageTaskCompletionTime: await this.getAverageTaskCompletionTime(founderEmail),
          productivityScore: Math.round(productivityScore),
        },
        calendar: {
          eventsToday: await this.getCalendarEventsCount(founderEmail, todayStart, now),
          eventsThisWeek: await this.getCalendarEventsCount(founderEmail, weekStart, now),
          focusBlocksCreated: await this.getFocusBlocksCount(founderEmail, monthStart),
          conflictsDetected: 0, // Would track from calendar service
        },
        costs: {
          totalCostThisMonth: 0, // Would integrate with cost tracking
          apiCallsThisMonth: 0,
          costPerDay: 0,
          projectedMonthly: 0,
        },
      };
    } catch (error) {
      this.logger.error('[Analytics] Get metrics error:', error);
      throw error;
    }
  }

  /**
   * Get activity timeline for visualization
   */
  async getActivityTimeline(
    founderEmail: string,
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ): Promise<ActivityTimeline[]> {
    this.logger.info(`[Analytics] Getting activity timeline for ${founderEmail}`);

    try {
      // This would query activities table with JOIN on tasks
      // For now, return mock data structure
      return [];
    } catch (error) {
      this.logger.error('[Analytics] Get timeline error:', error);
      return [];
    }
  }

  /**
   * Get productivity trends over time
   */
  async getProductivityTrends(
    founderEmail: string,
    days: number = 30
  ): Promise<ProductivityTrend[]> {
    this.logger.info(`[Analytics] Getting productivity trends for ${founderEmail}`);

    try {
      const trends: ProductivityTrend[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const tasksCompleted = await this.getCompletedTasksCount(founderEmail, dayStart, dayEnd);
        const activityStats = await databaseService.getActivityStats(founderEmail, dayStart, dayEnd);
        const focusMinutes = activityStats.byType['deep_work'] || 0;
        const productivityScore = this.calculateProductivityScore(tasksCompleted, focusMinutes, 0);

        trends.push({
          date: dayStart.toISOString().split('T')[0],
          tasksCompleted,
          focusMinutes,
          productivityScore: Math.round(productivityScore),
        });
      }

      return trends;
    } catch (error) {
      this.logger.error('[Analytics] Get trends error:', error);
      return [];
    }
  }

  /**
   * Get health score (0-100)
   */
  async getHealthScore(founderEmail: string): Promise<number> {
    try {
      const metrics = await this.getDashboardMetrics(founderEmail);

      // Health score based on:
      // - Completion rate (40%)
      // - Focus time (30%)
      // - Balance (breaks vs work) (30%)

      const completionScore = metrics.overview.completionRate * 0.4;
      const focusScore = Math.min(metrics.timeTracking.totalFocusMinutes / 120, 1) * 30; // 2hrs = 100%
      const balanceScore = Math.min(metrics.timeTracking.totalPauseMinutes / 30, 1) * 30; // 30min = 100%

      return Math.round(completionScore + focusScore + balanceScore);
    } catch (error) {
      this.logger.error('[Analytics] Get health score error:', error);
      return 50; // Default mid-range score
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getCompletedTasksCount(
    founderEmail: string,
    startDate: Date,
    endDate?: Date
  ): Promise<number> {
    // Would query: SELECT COUNT(*) FROM tasks WHERE status='completed' AND completed_at BETWEEN ...
    // For now, return 0 as placeholder
    return 0;
  }

  private async getDeepWorkSessionCount(founderEmail: string, startDate: Date): Promise<number> {
    // Would query: SELECT COUNT(DISTINCT DATE(timestamp)) FROM activities WHERE activity_type='deep_work'
    return 0;
  }

  private async getCalendarEventsCount(
    founderEmail: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Would query calendar_events table
    return 0;
  }

  private async getFocusBlocksCount(founderEmail: string, startDate: Date): Promise<number> {
    // Would query calendar_events WHERE event_type='focus_block'
    return 0;
  }

  private async getAverageTaskCompletionTime(founderEmail: string): Promise<number> {
    // Would calculate: AVG(completed_at - created_at) in hours
    return 0;
  }

  private calculateProductivityScore(
    tasksCompleted: number,
    focusMinutes: number,
    pauseMinutes: number
  ): number {
    // Weighted score:
    // - Tasks completed: 50%
    // - Focus time: 40%
    // - Breaks taken: 10%

    const taskScore = Math.min(tasksCompleted / 8, 1) * 50; // 8 tasks = 100%
    const focusScore = Math.min(focusMinutes / 240, 1) * 40; // 4 hours = 100%
    const pauseScore = Math.min(pauseMinutes / 30, 1) * 10; // 30 min = 100%

    return taskScore + focusScore + pauseScore;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
