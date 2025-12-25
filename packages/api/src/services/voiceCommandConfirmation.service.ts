import crypto from 'crypto';
import { VoiceCommand } from '../types/voiceCommand';

interface PendingConfirmation {
  id: string;
  user: string;
  command: VoiceCommand;
  confirmationPrompt?: string;
  createdAt: string;
}

const confirmations = new Map<string, PendingConfirmation>();

export function createPendingConfirmation(input: {
  user: string;
  command: VoiceCommand;
  confirmationPrompt?: string;
}): PendingConfirmation {
  const record: PendingConfirmation = {
    id: crypto.randomUUID(),
    user: input.user,
    command: input.command,
    confirmationPrompt: input.confirmationPrompt,
    createdAt: new Date().toISOString(),
  };
  confirmations.set(record.id, record);
  return record;
}

export async function getPendingConfirmation(id: string): Promise<PendingConfirmation | null> {
  return confirmations.get(id) || null;
}

export async function resolvePendingConfirmation(id: string): Promise<void> {
  confirmations.delete(id);
}
