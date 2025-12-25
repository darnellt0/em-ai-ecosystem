import crypto from 'crypto';
import { VoiceCommand } from '../types/voiceCommand';

interface PendingFollowUp {
  id: string;
  user: string;
  command: VoiceCommand;
  prompt: string;
  suggestedCommands?: string[];
  createdAt: string;
}

const followUps = new Map<string, PendingFollowUp>();

export function createPendingFollowUp(input: {
  user: string;
  command: VoiceCommand;
  prompt: string;
  suggestedCommands?: string[];
}) {
  const record: PendingFollowUp = {
    id: crypto.randomUUID(),
    user: input.user,
    command: input.command,
    prompt: input.prompt,
    suggestedCommands: input.suggestedCommands,
    createdAt: new Date().toISOString(),
  };
  followUps.set(record.id, record);
  return record;
}

export async function getPendingFollowUp(id: string): Promise<PendingFollowUp | null> {
  return followUps.get(id) || null;
}

export async function resolvePendingFollowUp(id: string): Promise<void> {
  followUps.delete(id);
}
