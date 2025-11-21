/**
 * Purpose Agent - Purpose Pathfinder
 * Phase: Radiant
 * Helps users discover and articulate their core purpose through Ikigai framework
 */
import { OrchestratorRunContext, GrowthAgentResult } from '../types';
/**
 * Ikigai framework components
 */
export interface IkigaiComponents {
    whatYouLove: string[];
    whatTheWorldNeeds: string[];
    whatYouCanBePaidFor: string[];
    whatYouAreGoodAt: string[];
}
/**
 * Purpose declaration
 */
export interface PurposeDeclaration {
    statement: string;
    confidence: number;
    timestamp: string;
    userId: string;
}
/**
 * Purpose card (visual representation)
 */
export interface PurposeCard {
    declaration: string;
    brandColors: {
        plum: string;
        teal: string;
        gold: string;
        rose: string;
        slate: string;
    };
    createdAt: string;
    userId: string;
    cardHtml: string;
}
/**
 * Daily affirmation
 */
export interface DailyAffirmation {
    day: number;
    message: string;
    deliveryTime: string;
}
/**
 * Run Purpose Agent
 */
export declare function runPurposeAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult>;
//# sourceMappingURL=purpose-agent.d.ts.map