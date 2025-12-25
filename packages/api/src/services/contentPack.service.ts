import { ContentAsset, ContentPack, safeSlug } from '../../../shared/contracts';
import { saveContentPack } from '../content/contentPack.store';

interface GenerateContentPackInput {
  userId: string;
  topic: string;
  includeP0?: boolean;
}

const DEFAULT_CREATED_AT = '2025-01-01T00:00:00.000Z';

function buildAssets(packId: string, topic: string): ContentAsset[] {
  const safeTopic = topic || 'content';
  return [
    {
      id: `${packId}_linkedin`,
      channel: 'linkedin',
      title: `LinkedIn: ${safeTopic}`,
      body: `Draft LinkedIn post about ${safeTopic}.`,
      tags: ['em', 'leadership'],
      cta: 'Share your takeaway in the comments.',
    },
    {
      id: `${packId}_email`,
      channel: 'email',
      title: `Email: ${safeTopic}`,
      body: `Draft email copy about ${safeTopic}.`,
      tags: ['em', 'newsletter'],
      cta: 'Reply with your questions.',
    },
  ];
}

export async function generateContentPack(input: GenerateContentPackInput): Promise<ContentPack> {
  const packId = `pack_${safeSlug(input.userId)}_${safeSlug(input.topic)}`;
  const pack: ContentPack = {
    packId,
    createdAt: DEFAULT_CREATED_AT,
    userId: input.userId,
    topic: input.topic,
    theme: input.includeP0 ? 'p0' : undefined,
    assets: buildAssets(packId, input.topic),
    plannedActionIds: [],
    status: 'ready',
  };

  if (process.env.ENABLE_CONTENT_PACK_STORAGE === 'true' && process.env.NODE_ENV !== 'test') {
    return saveContentPack(pack);
  }

  return pack;
}
