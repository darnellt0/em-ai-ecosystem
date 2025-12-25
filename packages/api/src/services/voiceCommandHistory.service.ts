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

const history = new Map<string, VoiceCommandHistoryRecord>();

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
  history.set(record.id, record);
  return record;
}

export function listVoiceCommandHistory(params: { user?: string; limit?: number }) {
  const items = Array.from(history.values()).filter((item) => !params.user || item.user === params.user);
  return items.slice(0, params.limit || 20);
}

export function getVoiceCommandHistoryRecord(id: string): VoiceCommandHistoryRecord | null {
  return history.get(id) || null;
}
