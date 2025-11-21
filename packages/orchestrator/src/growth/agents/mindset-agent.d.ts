/**
 * Mindset Agent - Mindset Shift Mentor
 * Phase: Grounded
 * Helps users reframe limiting beliefs and develop empowering mindsets
 */
import { OrchestratorRunContext, GrowthAgentResult } from '../types';
/**
 * Mindset entry structure
 */
export interface MindsetEntry {
    timestamp: string;
    belief: string;
    reframe: string;
    affirmation: string;
    microPractice: string;
    userId: string;
}
/**
 * Weekly mindset snapshot
 */
export interface MindsetSnapshot {
    userId: string;
    weekStartDate: string;
    weekEndDate: string;
    entriesCount: number;
    topThemes: string[];
    progressSummary: string;
    nextSteps: string[];
}
/**
 * Run Mindset Agent
 */
export declare function runMindsetAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult>;
//# sourceMappingURL=mindset-agent.d.ts.map