export type EventOwner = 'darnell' | 'shria' | 'shared';
export type EventCategory = 'focus' | 'meeting' | 'personal' | 'admin' | 'client';
export type EventVisibility = 'public' | 'private';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  isAllDay: boolean;
  category?: EventCategory;
  energyCost?: 1 | 2 | 3 | 4 | 5;
  owner: EventOwner;
  visibility: EventVisibility;
  calendarSource: string;
}

export interface TimeBlock {
  start: Date;
  end: Date;
  type: 'deep-work' | 'shallow-work' | 'meeting' | 'rest' | 'buffer';
  protected: boolean;
}

export interface CalendarDensity {
  darnell: number;
  shria: number;
  shared: number;
}

export interface SchedulingRule {
  name: string;
  priority: number;
  condition: (events: CalendarEvent[]) => boolean;
  action: string;
  severity: 'info' | 'warning' | 'critical';
}
