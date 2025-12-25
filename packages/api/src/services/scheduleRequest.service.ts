import { VoiceCommand } from '../types/voiceCommand';

let requestCounter = 0;

export function createScheduleRequest(command: VoiceCommand) {
  requestCounter += 1;
  return {
    requestId: `schedule-${requestCounter}`,
    status: 'queued',
    command,
    createdAt: new Date().toISOString(),
  };
}
