export const DAILY_FOCUS_INTENTS = ['daily_focus.generate'] as const;

export type DailyFocusIntent = typeof DAILY_FOCUS_INTENTS[number];
