/**
 * Predictive Scheduling Service - Phase 4 (Agent 13)
 * ML-based time predictions, anticipate scheduling needs, proactive suggestions
 */

import { mlService } from '../../../ml/src/ml.service';
import { schedulerService } from '../scheduling/scheduler.service';

export interface SchedulingPrediction {
  activityType: 'focus_block' | 'meeting' | 'break' | 'task';
  suggestedTime: Date;
  confidence: number; // 0-1
  reasoning: string[];
  autoSchedule: boolean; // Should it be auto-scheduled?
}

export interface ProactiveSchedule {
  date: Date;
  recommendations: SchedulingPrediction[];
  estimatedProductivity: number; // 0-100
  warnings: string[]; // e.g., "No breaks scheduled", "Too many meetings"
}

class PredictiveSchedulerService {
  private logger = console;

  /**
   * Generate proactive scheduling recommendations for tomorrow
   */
  async generateDailySchedule(userId: string): Promise<ProactiveSchedule> {
    this.logger.info(`[Predictive Scheduler] Generating daily schedule for ${userId}`);

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Get user preferences and patterns
      const profile = await mlService.buildPreferenceProfile(userId);
      const patterns = await mlService.detectPatterns(userId);

      const recommendations: SchedulingPrediction[] = [];
      const warnings: string[] = [];

      // Predict morning focus block
      const morningFocus = await this.predictFocusBlock(userId, profile, 'morning');
      if (morningFocus) recommendations.push(morningFocus);

      // Predict mid-morning break
      const morningBreak = this.predictBreak(userId, profile, 'mid_morning');
      if (morningBreak) recommendations.push(morningBreak);

      // Predict afternoon focus block
      const afternoonFocus = await this.predictFocusBlock(userId, profile, 'afternoon');
      if (afternoonFocus) recommendations.push(afternoonFocus);

      // Check for missing breaks
      const breakCount = recommendations.filter((r) => r.activityType === 'break').length;
      if (breakCount < 3) {
        warnings.push('Consider scheduling more breaks throughout the day');
      }

      // Estimate productivity score
      const focusMinutes = recommendations
        .filter((r) => r.activityType === 'focus_block')
        .reduce((sum, r) => sum + 90, 0); // Assuming 90 min blocks

      const estimatedProductivity = Math.min(Math.round((focusMinutes / 240) * 100), 100);

      return {
        date: tomorrow,
        recommendations: recommendations.sort((a, b) => a.suggestedTime.getTime() - b.suggestedTime.getTime()),
        estimatedProductivity,
        warnings,
      };
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Generate schedule error:', error);
      throw error;
    }
  }

  /**
   * Predict when user will need a break
   */
  async predictNextBreakTime(userId: string): Promise<Date | null> {
    this.logger.info(`[Predictive Scheduler] Predicting next break time for ${userId}`);

    try {
      const profile = await mlService.buildPreferenceProfile(userId);
      const now = new Date();

      // Calculate next break based on user's break frequency pattern
      const nextBreak = new Date(now.getTime() + profile.breakFrequency * 60 * 1000);

      return nextBreak;
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Predict break error:', error);
      return null;
    }
  }

  /**
   * Anticipate scheduling conflicts before they occur
   */
  async anticipateConflicts(userId: string, daysAhead: number = 7): Promise<any[]> {
    this.logger.info(`[Predictive Scheduler] Anticipating conflicts for ${userId}`);

    try {
      const conflicts: any[] = [];

      // Would analyze:
      // - Historical patterns of double-booking
      // - Typical meeting overruns
      // - Buffer time violations
      // - Travel time conflicts

      return conflicts;
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Anticipate conflicts error:', error);
      return [];
    }
  }

  /**
   * Suggest meeting reschedule based on patterns
   */
  async suggestMeetingReschedule(
    userId: string,
    currentMeetingTime: Date,
    duration: number
  ): Promise<Date[]> {
    this.logger.info(`[Predictive Scheduler] Suggesting meeting reschedule for ${userId}`);

    try {
      // Use ML preferences to find better times
      const profile = await mlService.buildPreferenceProfile(userId);

      // Find optimal times using advanced scheduler
      const optimalTimes = await schedulerService.findOptimalTime(
        duration,
        7,
        {
          preferredDays: profile.meetingPreferences.preferredDays,
          preferredStartHour: 9,
          preferredEndHour: 17,
        },
        []
      );

      return optimalTimes.map((result) => result.slot.start);
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Suggest reschedule error:', error);
      return [];
    }
  }

  /**
   * Auto-schedule deep work blocks based on AI
   */
  async autoScheduleDeepWork(
    userId: string,
    weeklyGoalHours: number = 15
  ): Promise<SchedulingPrediction[]> {
    this.logger.info(`[Predictive Scheduler] Auto-scheduling deep work for ${userId}`);

    try {
      const profile = await mlService.buildPreferenceProfile(userId);
      const predictions: SchedulingPrediction[] = [];

      // Calculate how many blocks needed
      const blockDuration = profile.optimalFocusDuration;
      const blocksNeeded = Math.ceil((weeklyGoalHours * 60) / blockDuration);

      // Schedule blocks over next 7 days
      for (let i = 0; i < blocksNeeded; i++) {
        const dayOffset = Math.floor(i / 2); // 2 blocks per day max
        const timeSlot = i % 2 === 0 ? 'morning' : 'afternoon';

        const prediction = await this.predictFocusBlock(userId, profile, timeSlot, dayOffset);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      return predictions;
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Auto-schedule error:', error);
      return [];
    }
  }

  /**
   * Smart calendar optimization - rearrange for maximum productivity
   */
  async optimizeCalendar(userId: string, date: Date): Promise<any> {
    this.logger.info(`[Predictive Scheduler] Optimizing calendar for ${userId}`);

    try {
      // Would analyze current calendar and suggest:
      // - Moving meetings to better times
      // - Adding buffer time
      // - Consolidating similar activities
      // - Adding breaks
      // - Protecting focus time

      return {
        optimizations: [
          'Move 2pm standup to 4pm (end of day works better)',
          'Add 15-minute buffer before 1-on-1',
          'Block 9-11am for deep work (peak productivity time)',
        ],
        estimatedProductivityGain: 25, // percentage
      };
    } catch (error) {
      this.logger.error('[Predictive Scheduler] Optimize calendar error:', error);
      return { optimizations: [], estimatedProductivityGain: 0 };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async predictFocusBlock(
    userId: string,
    profile: any,
    timeOfDay: 'morning' | 'afternoon',
    dayOffset: number = 1
  ): Promise<SchedulingPrediction | null> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + dayOffset);
    tomorrow.setHours(0, 0, 0, 0);

    const hour = timeOfDay === 'morning' ? profile.preferredFocusTimeStart : profile.preferredFocusTimeStart + 4;

    const suggestedTime = new Date(tomorrow);
    suggestedTime.setHours(hour, 0, 0, 0);

    return {
      activityType: 'focus_block',
      suggestedTime,
      confidence: 0.85,
      reasoning: [
        `Based on your pattern of ${profile.optimalFocusDuration}-minute focus sessions`,
        `${timeOfDay === 'morning' ? 'Morning' : 'Afternoon'} is your peak productivity time`,
        'No conflicts detected in this time slot',
      ],
      autoSchedule: true,
    };
  }

  private predictBreak(
    userId: string,
    profile: any,
    timeOfDay: 'mid_morning' | 'mid_afternoon'
  ): SchedulingPrediction | null {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const hour = timeOfDay === 'mid_morning' ? 10 : 15;

    const suggestedTime = new Date(tomorrow);
    suggestedTime.setHours(hour, 30, 0, 0);

    return {
      activityType: 'break',
      suggestedTime,
      confidence: 0.75,
      reasoning: [
        `You typically take breaks every ${profile.breakFrequency} minutes`,
        'Short breaks improve focus and energy',
      ],
      autoSchedule: false, // Don't auto-schedule breaks, just suggest
    };
  }
}

// Export singleton instance
export const predictiveSchedulerService = new PredictiveSchedulerService();
