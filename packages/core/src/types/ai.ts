import { FounderId } from './founders';
import { CalendarEvent, TimeBlock } from './calendar';

export interface DailyBrief {
  date: Date;
  founderId: FounderId;
  greeting: string;
  dayOverview: string;
  events: CalendarEvent[];
  priorities: string[];
  reminders: string[];
  energyNote?: string;
  focusTimeAvailable: number;
  restBlocks: TimeBlock[];
  teamCoordination?: string;
}

export interface WeeklyRetrospective {
  weekOf: Date;
  founderId: FounderId;
  personalEnergyScore: number;
  teamHealthScore: number;
  wins: string[];
  challenges: string[];
  calendarDensity: number;
  emailVolume: number;
  recommendations: string[];
  nextWeekFocus: string[];
}
