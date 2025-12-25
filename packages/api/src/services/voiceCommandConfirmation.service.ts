import crypto from 'crypto';
import { VoiceCommand } from '../types/voiceCommand';

export interface PendingConfirmation {
  id: string;
  user: string;
  command: VoiceCommand;
  confirmationPrompt: string;
  createdAt: string;
}

const confirmations = new Map<string, PendingConfirmation>();

export async function createPendingConfirmation(input: {
  user: string;
  command: VoiceCommand;
  confirmationPrompt: string;
}): Promise<PendingConfirmation> {
  const pending: PendingConfirmation = {
    id: crypto.randomUUID(),
    user: input.user,
    command: input.command,
    confirmationPrompt: input.confirmationPrompt,
    createdAt: new Date().toISOString(),
  };
  confirmations.set(pending.id, pending);
  return pending;
}

export async function getPendingConfirmation(id: string): Promise<PendingConfirmation | null> {
  return confirmations.get(id) || null;
}

export async function resolvePendingConfirmation(id: string): Promise<boolean> {
  return confirmations.delete(id);
}

export function resetVoiceConfirmationsForTest() {
  confirmations.clear();
}
