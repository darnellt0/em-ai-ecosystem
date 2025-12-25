import crypto from 'crypto';

export interface PendingFollowUp {
  id: string;
  user: string;
  originalText: string;
  prompt: string;
  suggestedCommands?: string[];
  createdAt: string;
}

const followUps = new Map<string, PendingFollowUp>();

export async function createPendingFollowUp(input: {
  user: string;
  originalText: string;
  prompt: string;
  suggestedCommands?: string[];
}): Promise<PendingFollowUp> {
  const pending: PendingFollowUp = {
    id: crypto.randomUUID(),
    user: input.user,
    originalText: input.originalText,
    prompt: input.prompt,
    suggestedCommands: input.suggestedCommands,
    createdAt: new Date().toISOString(),
  };
  followUps.set(pending.id, pending);
  return pending;
}

export async function getPendingFollowUp(id: string): Promise<PendingFollowUp | null> {
  return followUps.get(id) || null;
}

export async function resolvePendingFollowUp(id: string): Promise<boolean> {
  return followUps.delete(id);
}

export function resetVoiceFollowUpsForTest() {
  followUps.clear();
}
