import crypto from 'crypto';
import { VoiceCommand } from '../types/voiceCommand';

export interface VoiceCommandHistoryRecord {
  id: string;
  user: string;
  command: VoiceCommand;
  resultSummary: string;
  runId?: string;
  createdAt: string;
}

const history: VoiceCommandHistoryRecord[] = [];

export function recordVoiceCommandHistory(input: {
  user: string;
  command: VoiceCommand;
  resultSummary: string;
  runId?: string;
}): VoiceCommandHistoryRecord {
  const record: VoiceCommandHistoryRecord = {
    id: crypto.randomUUID(),
    user: input.user,
    command: input.command,
    resultSummary: input.resultSummary,
    runId: input.runId,
    createdAt: new Date().toISOString(),
  };
  history.push(record);
  return record;
}

export function listVoiceCommandHistory(input: { user: string; limit?: number }): VoiceCommandHistoryRecord[] {
  const limit = input.limit ?? 20;
  return history.filter((item) => item.user === input.user).slice(-limit);
}

export function getVoiceCommandHistoryRecord(id: string): VoiceCommandHistoryRecord | null {
  return history.find((item) => item.id === id) || null;
}

export function resetVoiceCommandHistoryForTest() {
  history.length = 0;
}
