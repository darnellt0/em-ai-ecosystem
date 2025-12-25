import { VoiceCommand } from '../types/voiceCommand';

interface BuildCommandParams {
  user: string;
  text: string;
}

function normalize(text: string) {
  return text.toLowerCase();
}

function buildRunIntent(user: string, intent: string, input?: VoiceCommand['input']): VoiceCommand {
  return {
    user,
    intent,
    action: 'run_intent',
    requiresConfirmation: false,
    input,
    text: intent,
  };
}

export function buildVoiceCommand(params: BuildCommandParams): VoiceCommand {
  const normalized = normalize(params.text || '');

  if (normalized.includes('daily reflection')) {
    return buildRunIntent(params.user, 'journal.daily_reflection', { text: params.text });
  }

  if (normalized.includes('midday check')) {
    return buildRunIntent(params.user, 'journal.midday_check_in', { text: params.text });
  }

  if (normalized.includes('close my day') || normalized.includes('close the day')) {
    return buildRunIntent(params.user, 'journal.close_day', { text: params.text });
  }

  if (normalized.includes('daily brief')) {
    return buildRunIntent(params.user, 'p0.daily_brief', { text: params.text });
  }

  if (normalized.includes('status')) {
    return { user: params.user, action: 'status', text: params.text };
  }

  if (normalized.includes('help')) {
    return { user: params.user, action: 'help', text: params.text };
  }

  if (normalized.includes('schedule')) {
    return {
      user: params.user,
      action: 'confirm_required',
      requiresConfirmation: true,
      confirmationPrompt: 'Do you want me to schedule this now?',
      intent: 'schedule.block_time',
      input: { text: params.text },
    };
  }

  if (normalized.includes('journal') || normalized.includes('reflection')) {
    return buildRunIntent(params.user, 'journal.daily_reflection', { text: params.text });
  }

  return {
    user: params.user,
    action: 'unknown',
    text: params.text,
    followUp: {
      prompt: 'Try: daily reflection, midday check in, close my day, or daily brief.',
      suggestedCommands: ['daily reflection', 'midday check in', 'close my day', 'daily brief'],
    },
  };
}

export function getHelpCommands() {
  return {
    summary: 'You can say: daily reflection, midday check in, close my day, daily brief, or ask for system status.',
    commands: [
      { phrase: 'Run my daily reflection', intent: 'journal.daily_reflection' },
      { phrase: 'Run my midday check in', intent: 'journal.midday_check_in' },
      { phrase: 'Close my day', intent: 'journal.close_day' },
      { phrase: 'Daily brief', intent: 'p0.daily_brief' },
      { phrase: 'What is the system status?', intent: 'status' },
    ],
  };
}
