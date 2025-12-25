import { VoiceCommand } from '../types/voiceCommand';

const HELP_COMMANDS = [
  'daily reflection',
  'midday check in',
  'close my day',
  'daily brief',
  'action pack',
];

export function getHelpCommands() {
  return {
    summary: 'Try: daily reflection, midday check in, close my day, daily brief, or action pack.',
    commands: HELP_COMMANDS,
  };
}

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

export function buildVoiceCommand(input: { user: string; text: string }): VoiceCommand {
  const rawText = input.text || '';
  const normalized = normalize(rawText);
  const base: VoiceCommand = {
    user: input.user,
    rawText,
    action: 'unknown',
    suggestedCommands: HELP_COMMANDS,
  };

  if (!normalized) return base;

  if (includesAny(normalized, ['help', 'commands'])) {
    return { ...base, action: 'help' };
  }

  if (normalized.includes('status')) {
    return { ...base, action: 'status' };
  }

  if (includesAny(normalized, ['show runs', 'list runs', 'journal runs'])) {
    return { ...base, action: 'show_runs' };
  }

  if (includesAny(normalized, ['daily reflection', 'reflection'])) {
    return { ...base, action: 'run_intent', intent: 'journal.daily_reflection' };
  }

  if (includesAny(normalized, ['midday', 'check in', 'check-in'])) {
    return { ...base, action: 'run_intent', intent: 'journal.midday_check_in' };
  }

  if (includesAny(normalized, ['close my day', 'close the day', 'day close'])) {
    return { ...base, action: 'run_intent', intent: 'journal.day_close' };
  }

  if (normalized.includes('daily brief')) {
    return { ...base, action: 'run_intent', intent: 'p0.daily_brief' };
  }

  if (normalized.includes('daily focus')) {
    return { ...base, action: 'run_intent', intent: 'p0.daily_focus' };
  }

  if (normalized.includes('action pack')) {
    return { ...base, action: 'run_intent', intent: 'content.action_pack' };
  }

  return base;
}
