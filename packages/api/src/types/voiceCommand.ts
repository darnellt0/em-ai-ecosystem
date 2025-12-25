export type VoiceCommandAction =
  | 'run_intent'
  | 'show_runs'
  | 'help'
  | 'status'
  | 'schedule'
  | 'unknown'
  | 'confirm_required';

export interface VoiceCommandInput {
  date?: string;
  dateRange?: { start: string; end: string };
  mode?: string;
  text?: string;
}

export interface VoiceCommand {
  user: string;
  text?: string;
  intent?: string;
  action: VoiceCommandAction;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  input?: VoiceCommandInput;
  followUp?: {
    prompt: string;
    suggestedCommands: string[];
  };
}
