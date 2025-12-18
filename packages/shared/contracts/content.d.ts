export type ContentChannel = 'linkedin' | 'email' | 'video_script' | 'web_copy';
export interface ContentAsset {
    id: string;
    channel: ContentChannel;
    title: string;
    body: string;
    tags?: string[];
    cta?: string;
    metadata?: Record<string, any>;
}
export interface ContentPack {
    packId: string;
    createdAt: string;
    userId: string;
    topic: string;
    theme?: string;
    sources?: {
        p0RunId?: string;
        p1AgentKey?: string;
    };
    assets: ContentAsset[];
    plannedActionIds: string[];
    status: 'ready' | 'degraded';
    notes?: string;
}
export declare function safeSlug(str: string): string;
export declare function createPackId(topic: string, createdAt?: Date): string;
//# sourceMappingURL=content.d.ts.map