import { ContentPack, ContentAsset, createPackId } from '../../../shared/contracts/content';
import { saveContentPack } from '../content/contentPack.store';

interface GenerateContentPackParams {
  userId: string;
  topic: string;
  includeP0?: boolean;
}

function buildDeterministicAssets(topic: string): ContentAsset[] {
  const base = `Theme: ${topic}`;
  return [
    {
      id: 'linkedin-post',
      channel: 'linkedin',
      title: `${base} • LinkedIn`,
      body: `${base} • Share a concise leadership takeaway and one actionable prompt.`,
    },
    {
      id: 'email-draft',
      channel: 'email',
      title: `${base} • Email`,
      body: `${base} • Draft an email update with three bullet highlights and a clear CTA.`,
    },
    {
      id: 'video-script',
      channel: 'video_script',
      title: `${base} • Video`,
      body: `${base} • 45s script: hook, story, and closing invitation.`,
    },
    {
      id: 'web-copy',
      channel: 'web_copy',
      title: `${base} • Web`,
      body: `${base} • Short hero copy plus a supporting subheadline.`,
    },
  ];
}

/**
 * Minimal, deterministic content pack generator for unit tests and local runs.
 * Avoids external services while producing stable sample assets.
 */
export async function generateContentPack(params: GenerateContentPackParams): Promise<ContentPack> {
  const createdAt = new Date();
  const pack: ContentPack = {
    packId: createPackId(params.topic || 'content-pack', createdAt),
    createdAt: createdAt.toISOString(),
    userId: params.userId,
    topic: params.topic,
    theme: params.includeP0 ? 'p0' : 'standard',
    assets: buildDeterministicAssets(params.topic),
    plannedActionIds: [],
    status: 'ready',
    sources: params.includeP0 ? { p0RunId: 'p0-stub' } : undefined,
  };

  saveContentPack(pack);
  return pack;
}
