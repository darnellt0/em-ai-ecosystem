export type AgentStatus = 'OK' | 'SKIPPED' | 'FAILED';
export interface AgentOutput<T = any> {
    status: AgentStatus;
    output?: T;
    warnings?: string[];
    error?: string;
}
export interface Insight {
    title: string;
    detail: string;
    confidence?: number;
}
export interface Action {
    title: string;
    detail: string;
    priority?: 'low' | 'medium' | 'high';
}
export interface ActionPack {
    linkedinDraft?: string;
    emailDraft?: string;
    journalExpansion?: string;
    reflectionExercise?: string;
    focusNarrative?: string;
    status?: 'ready' | 'blocked';
    blockers?: string[];
    safeNextSteps?: string[];
}
export type ActionStatus = 'PLANNED' | 'APPROVED' | 'EXECUTED' | 'BLOCKED' | 'FAILED';
export interface PlannedAction {
    id: string;
    type: string;
    requiresApproval: boolean;
    payload: Record<string, any>;
    risk?: 'low' | 'medium' | 'high';
    priority?: 'low' | 'medium' | 'high';
    idempotencyKey?: string;
    status: ActionStatus;
    receipt?: ActionReceipt;
    notes?: string;
}
export interface ActionReceipt {
    status: ActionStatus;
    message: string;
    externalRef?: string;
    executedAt?: string;
}
export * from './content';
//# sourceMappingURL=index.d.ts.map