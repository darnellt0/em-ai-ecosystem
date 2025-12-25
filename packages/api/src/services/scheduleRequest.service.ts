import crypto from 'crypto';
import { VoiceCommand } from '../types/voiceCommand';

export interface ScheduleRequest {
  id: string;
  user: string;
  command: VoiceCommand;
  status: 'pending' | 'resolved';
  createdAt: string;
}

const requests = new Map<string, ScheduleRequest>();

export function createScheduleRequest(command: VoiceCommand): ScheduleRequest {
  const request: ScheduleRequest = {
    id: crypto.randomUUID(),
    user: command.user,
    command,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.set(request.id, request);
  return request;
}

export function getScheduleRequest(id: string): ScheduleRequest | undefined {
  return requests.get(id);
}

export function listScheduleRequests(limit = 20): ScheduleRequest[] {
  return Array.from(requests.values()).slice(-limit);
}

export function resetScheduleRequestsForTest() {
  requests.clear();
}
