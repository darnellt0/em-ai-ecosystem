import { IntentEntities, SessionTurn } from './types';

export function resolveReferents(text: string, sessionTurns: SessionTurn[] = []): IntentEntities {
  const normalized = text.toLowerCase();
  const resolved: IntentEntities = {};

  const findLastEventEntities = () => {
    for (let i = sessionTurns.length - 1; i >= 0; i -= 1) {
      const turn = sessionTurns[i];
      if (!turn?.entities) continue;
      const isSchedulerIntent = turn.intent?.startsWith('scheduler.');
      if (turn.entities.eventId || isSchedulerIntent) {
        return turn.entities;
      }
    }
    return undefined;
  };

  const findLastTaskEntities = () => {
    for (let i = sessionTurns.length - 1; i >= 0; i -= 1) {
      const turn = sessionTurns[i];
      if (!turn?.entities) continue;
      const isTaskIntent = turn.intent === 'support.logComplete' || turn.intent === 'support.followUp';
      if (turn.entities.taskId || isTaskIntent) {
        return turn.entities;
      }
    }
    return undefined;
  };

  if (/that\s+(meeting|call|event)/i.test(text)) {
    const previous = findLastEventEntities();
    if (previous) {
      resolved.eventId = (previous.eventId as string) ?? resolved.eventId;
      resolved.title = (previous.title as string) ?? resolved.title;
      resolved.date = (previous.date as string) ?? resolved.date;
      resolved.time = (previous.time as string) ?? resolved.time;
    }
  }

  if (/that\s+(task|ticket|item)/i.test(text) || /mark\s+it\s+done/i.test(normalized) || /finished\s+it/i.test(normalized)) {
    const previous = findLastTaskEntities();
    if (previous) {
      resolved.taskId = (previous.taskId as string) ?? resolved.taskId;
      resolved.title = (previous.title as string) ?? resolved.title;
    }
  }

  if (/follow\s*up\s+on\s+that/i.test(normalized) || /remind\s+me\s+about\s+it/i.test(normalized)) {
    const previous = findLastTaskEntities();
    if (previous) {
      resolved.followUpDate = (previous.followUpDate as string) ?? resolved.followUpDate;
      resolved.title = (previous.title as string) ?? resolved.title;
    }
  }

  if (!resolved.title && /with\s+them/i.test(normalized)) {
    const previous = findLastEventEntities() ?? findLastTaskEntities();
    if (previous?.title) {
      resolved.title = previous.title;
    }
  }

  return resolved;
}
