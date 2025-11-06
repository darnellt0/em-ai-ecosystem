/**
 * Advanced Scheduling Service - Phase 3 (Agent 8)
 * Intelligent scheduling algorithms for conflict prediction and optimal time finding
 */

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  score?: number; // 0-100, higher is better
}

export interface SchedulingPreferences {
  preferredStartHour?: number; // 9 = 9am
  preferredEndHour?: number; // 17 = 5pm
  minimumBufferMinutes?: number; // Buffer between meetings
  maxBackToBackMeetings?: number; // Max consecutive meetings
  preferredDays?: number[]; // 0 = Sunday, 1 = Monday, etc
  avoidDays?: number[]; // Days to avoid scheduling
}

export interface ConflictPrediction {
  probability: number; // 0-1
  reason: string;
  conflictingEvents: string[];
  suggestedAlternatives: TimeSlot[];
}

export interface OptimalTimeResult {
  slot: TimeSlot;
  score: number;
  reasoning: string[];
}

export class SchedulerService {
  private logger = console;

  /**
   * Find optimal time slots for a meeting/event
   */
  async findOptimalTime(
    durationMinutes: number,
    searchWindowDays: number = 7,
    preferences?: SchedulingPreferences,
    existingEvents?: TimeSlot[]
  ): Promise<OptimalTimeResult[]> {
    this.logger.info(`[Scheduler] Finding optimal ${durationMinutes}min slot in next ${searchWindowDays} days`);

    try {
      const now = new Date();
      const searchEnd = new Date();
      searchEnd.setDate(searchEnd.getDate() + searchWindowDays);

      // Generate candidate slots
      const candidates = this.generateCandidateSlots(
        now,
        searchEnd,
        durationMinutes,
        preferences
      );

      // Score each candidate
      const scoredSlots = candidates.map((slot) => {
        const score = this.scoreTimeSlot(slot, existingEvents || [], preferences);
        const reasoning = this.getScoreReasoning(slot, score, preferences);

        return {
          slot,
          score,
          reasoning,
        };
      });

      // Sort by score (highest first)
      scoredSlots.sort((a, b) => b.score - a.score);

      // Return top 5 options
      return scoredSlots.slice(0, 5);
    } catch (error) {
      this.logger.error('[Scheduler] Find optimal time error:', error);
      throw error;
    }
  }

  /**
   * Predict conflicts for a proposed time slot
   */
  async predictConflicts(
    proposedSlot: TimeSlot,
    existingEvents: TimeSlot[],
    historicalPatterns?: any
  ): Promise<ConflictPrediction> {
    this.logger.info('[Scheduler] Predicting conflicts for proposed time');

    try {
      const conflicts: string[] = [];
      let probability = 0;

      // Check direct time overlaps
      for (const event of existingEvents) {
        if (this.slotsOverlap(proposedSlot, event)) {
          conflicts.push(`Overlaps with existing event`);
          probability += 0.3;
        }
      }

      // Check if it's within working hours
      const hour = proposedSlot.start.getHours();
      if (hour < 8 || hour > 18) {
        conflicts.push('Outside typical working hours (8am-6pm)');
        probability += 0.2;
      }

      // Check day of week patterns
      const dayOfWeek = proposedSlot.start.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        conflicts.push('Falls on weekend');
        probability += 0.4;
      }

      // Check for back-to-back meetings
      const hasAdjacentMeeting = existingEvents.some((event) =>
        this.isAdjacent(proposedSlot, event)
      );
      if (hasAdjacentMeeting) {
        conflicts.push('Back-to-back with another meeting (no buffer)');
        probability += 0.15;
      }

      // Cap probability at 1.0
      probability = Math.min(probability, 1.0);

      // Generate alternatives if conflicts found
      const suggestedAlternatives =
        conflicts.length > 0
          ? await this.findAlternativeSlots(proposedSlot, existingEvents)
          : [];

      return {
        probability,
        reason:
          conflicts.length > 0
            ? conflicts.join('; ')
            : 'No significant conflicts detected',
        conflictingEvents: conflicts,
        suggestedAlternatives,
      };
    } catch (error) {
      this.logger.error('[Scheduler] Predict conflicts error:', error);
      throw error;
    }
  }

  /**
   * Optimize meeting duration based on historical data
   */
  optimizeMeetingDuration(
    meetingType: string,
    proposedDuration: number,
    historicalAverageDuration?: number
  ): number {
    this.logger.info(`[Scheduler] Optimizing duration for ${meetingType}`);

    // If we have historical data, suggest based on that
    if (historicalAverageDuration) {
      // Round to nearest 15 minutes
      return Math.ceil(historicalAverageDuration / 15) * 15;
    }

    // Default optimizations by meeting type
    const defaults: Record<string, number> = {
      'standup': 15,
      '1-on-1': 30,
      'planning': 60,
      'review': 45,
      'brainstorm': 90,
    };

    return defaults[meetingType.toLowerCase()] || proposedDuration;
  }

  /**
   * Smart buffer management between meetings
   */
  calculateOptimalBuffer(
    previousMeetingDuration: number,
    nextMeetingDuration: number,
    travelRequired: boolean = false
  ): number {
    this.logger.info('[Scheduler] Calculating optimal buffer');

    let buffer = 5; // Minimum 5 minutes

    // Longer meetings need more buffer
    if (previousMeetingDuration >= 60) {
      buffer += 5;
    }

    // If next meeting is important/long, add buffer
    if (nextMeetingDuration >= 60) {
      buffer += 5;
    }

    // Travel time
    if (travelRequired) {
      buffer += 15;
    }

    return buffer;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateCandidateSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes: number,
    preferences?: SchedulingPreferences
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    // Default preferences
    const preferredStart = preferences?.preferredStartHour || 9; // 9am
    const preferredEnd = preferences?.preferredEndHour || 17; // 5pm

    while (current < endDate) {
      const dayOfWeek = current.getDay();

      // Skip weekends unless preferred
      if (
        !preferences?.preferredDays?.includes(dayOfWeek) &&
        (dayOfWeek === 0 || dayOfWeek === 6)
      ) {
        current.setDate(current.getDate() + 1);
        current.setHours(preferredStart, 0, 0, 0);
        continue;
      }

      // Generate slots for this day
      for (let hour = preferredStart; hour < preferredEnd; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(current);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Skip if slot ends after preferred end time
          if (slotEnd.getHours() >= preferredEnd) {
            continue;
          }

          slots.push({
            start: slotStart,
            end: slotEnd,
            available: true,
          });
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(preferredStart, 0, 0, 0);
    }

    return slots;
  }

  private scoreTimeSlot(
    slot: TimeSlot,
    existingEvents: TimeSlot[],
    preferences?: SchedulingPreferences
  ): number {
    let score = 100; // Start with perfect score

    // Check for overlaps (major penalty)
    const hasOverlap = existingEvents.some((event) =>
      this.slotsOverlap(slot, event)
    );
    if (hasOverlap) {
      score -= 50;
    }

    // Check for adjacent meetings (minor penalty)
    const hasAdjacent = existingEvents.some((event) =>
      this.isAdjacent(slot, event)
    );
    if (hasAdjacent) {
      score -= 10;
    }

    // Prefer mid-morning (10am-11am) or mid-afternoon (2pm-3pm)
    const hour = slot.start.getHours();
    if (hour === 10 || hour === 14) {
      score += 10;
    } else if (hour < 9 || hour > 16) {
      score -= 15;
    }

    // Prefer Tuesday-Thursday
    const dayOfWeek = slot.start.getDay();
    if (dayOfWeek >= 2 && dayOfWeek <= 4) {
      score += 5;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      score -= 30; // Weekend penalty
    }

    // Apply user preferences
    if (preferences?.preferredDays?.includes(dayOfWeek)) {
      score += 10;
    }
    if (preferences?.avoidDays?.includes(dayOfWeek)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private getScoreReasoning(
    slot: TimeSlot,
    score: number,
    preferences?: SchedulingPreferences
  ): string[] {
    const reasons: string[] = [];
    const hour = slot.start.getHours();
    const dayOfWeek = slot.start.getDay();

    if (score >= 90) {
      reasons.push('Excellent time slot');
    } else if (score >= 70) {
      reasons.push('Good time slot');
    } else if (score >= 50) {
      reasons.push('Acceptable time slot');
    } else {
      reasons.push('Suboptimal time slot');
    }

    if (hour === 10 || hour === 14) {
      reasons.push('Optimal hour (peak productivity)');
    }

    if (dayOfWeek >= 2 && dayOfWeek <= 4) {
      reasons.push('Mid-week (preferred)');
    }

    return reasons;
  }

  private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.start < slot2.end && slot1.end > slot2.start;
  }

  private isAdjacent(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (
      Math.abs(slot1.end.getTime() - slot2.start.getTime()) < buffer ||
      Math.abs(slot2.end.getTime() - slot1.start.getTime()) < buffer
    );
  }

  private async findAlternativeSlots(
    proposedSlot: TimeSlot,
    existingEvents: TimeSlot[]
  ): Promise<TimeSlot[]> {
    const durationMs = proposedSlot.end.getTime() - proposedSlot.start.getTime();
    const durationMinutes = durationMs / (60 * 1000);

    // Find slots within next 3 days
    const optimalResults = await this.findOptimalTime(
      durationMinutes,
      3,
      undefined,
      existingEvents
    );

    return optimalResults.map((result) => result.slot);
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
