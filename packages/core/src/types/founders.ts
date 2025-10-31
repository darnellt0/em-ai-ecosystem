export type FounderId = 'darnell' | 'shria';

export interface EmailAccount {
  primary: string;
  personal: string;
  active: boolean;
}

export interface FounderPreferences {
  dailyBriefTime: string;
  inboxDigestTimes: string[];
  notificationChannels: ('email' | 'slack' | 'sms')[];
  voiceNarration: boolean;
  energyAlerts: boolean;
  weeklyRetrospective: boolean;
}

export interface Founder {
  id: FounderId;
  name: string;
  emails: EmailAccount[];
  calendarId: string;
  role: 'admin' | 'co-founder';
  preferences: FounderPreferences;
}

export const FOUNDERS: Record<FounderId, Founder> = {
  darnell: {
    id: 'darnell',
    name: 'Darnell Tomlinson',
    emails: [
      {
        primary: 'darnell@elevatedmovements.com',
        personal: 'darnell.tomlinson@gmail.com',
        active: true
      }
    ],
    calendarId: 'primary',
    role: 'admin',
    preferences: {
      dailyBriefTime: '07:00',
      inboxDigestTimes: ['08:00', '13:00', '17:00'],
      notificationChannels: ['email'],
      voiceNarration: true,
      energyAlerts: true,
      weeklyRetrospective: true
    }
  },
  shria: {
    id: 'shria',
    name: 'Shria Tomlinson',
    emails: [
      {
        primary: 'shria@elevatedmovements.com',
        personal: 'shria.tomlinson@gmail.com',
        active: true
      }
    ],
    calendarId: 'primary',
    role: 'co-founder',
    preferences: {
      dailyBriefTime: '07:00',
      inboxDigestTimes: ['08:00', '13:00', '17:00'],
      notificationChannels: ['email'],
      voiceNarration: true,
      energyAlerts: true,
      weeklyRetrospective: true
    }
  }
};
