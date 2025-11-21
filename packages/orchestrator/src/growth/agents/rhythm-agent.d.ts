/**
 * Rhythm Agent - Rest & Rhythm Planner
 * Phase: Rooted
 * Helps users find balance between productivity and rest
 */
import { OrchestratorRunContext, GrowthAgentResult } from '../types';
/**
 * Calendar event structure
 */
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    duration: number;
}
/**
 * Pause block suggestion
 */
export interface PauseBlock {
    title: string;
    suggestedStart: Date;
    suggestedEnd: Date;
    duration: number;
    reason: string;
    dayDate: string;
}
/**
 * Dense day analysis
 */
export interface DenseDayAnalysis {
    date: string;
    totalMeetingMinutes: number;
    eventCount: number;
    longestGapMinutes: number;
    isDense: boolean;
    pauseBlocksNeeded: number;
}
/**
 * Run Rhythm Agent
 */
export declare function runRhythmAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult>;
//# sourceMappingURL=rhythm-agent.d.ts.map