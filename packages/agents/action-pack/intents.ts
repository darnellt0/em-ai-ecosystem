export const ACTION_PACK_INTENTS = ['action_pack.generate'] as const;

export type ActionPackIntent = typeof ACTION_PACK_INTENTS[number];
