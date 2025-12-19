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

export function safeSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export function createPackId(topic: string, createdAt: Date = new Date()): string {
  const date = createdAt.toISOString().split('T')[0];
  const slug = safeSlug(topic || 'content-pack');
  return `${date}-${slug}-${Math.random().toString(36).slice(2, 8)}`;
}
