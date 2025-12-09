export interface DailyBriefInput {
  userId: string;
  date?: string; // ISO date
}

export interface FocusWindow {
  start: string;
  end: string;
  reason: string;
}

export interface DailyBriefRendered {
  text: string;
  html?: string;
  audioPath?: string;
}

export interface DailyBriefOutput {
  date: string;
  userId: string;
  priorities: string[];
  agenda: string[];
  tasks: string[];
  inboxHighlights: string[];
  suggestedFocusWindows: FocusWindow[];
  rendered: DailyBriefRendered;
}
