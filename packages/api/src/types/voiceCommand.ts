export type VoiceCommandAction =
  | 'run_intent'
  | 'show_runs'
  | 'help'
  | 'status'
  | 'schedule'
  | 'confirm_required'
  | 'unknown';

export interface VoiceCommand {
  user: string;
  rawText: string;
  action: VoiceCommandAction;
  intent?: string;
  input?: Record<string, any>;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  suggestedCommands?: string[];
}
