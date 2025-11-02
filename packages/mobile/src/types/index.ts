// Core Types for Elevated Movements AI Mobile App

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'team_member';
  teamId?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastActive: string;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  offlineMode: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VoiceCommand {
  id: string;
  userId: string;
  transcript: string;
  audioUrl?: string;
  duration: number;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response?: VoiceResponse;
  agentType?: string;
}

export interface VoiceResponse {
  id: string;
  commandId: string;
  text: string;
  audioUrl?: string;
  actions: Action[];
  timestamp: string;
  agentName: string;
}

export interface Action {
  type: 'email' | 'calendar' | 'task' | 'note' | 'reminder' | 'analysis';
  status: 'pending' | 'completed' | 'failed';
  data: any;
  timestamp: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'voice_command' | 'action' | 'sync' | 'error';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface AnalyticsData {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageResponseTime: number;
    mostUsedAgents: AgentUsage[];
    productivity: ProductivityMetrics;
  };
  charts: {
    commandsOverTime: ChartData[];
    agentDistribution: ChartData[];
    productivityTrend: ChartData[];
  };
}

export interface AgentUsage {
  agentName: string;
  count: number;
  percentage: number;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  emailsSent: number;
  meetingsScheduled: number;
  notesCreated: number;
  timesSaved: number; // in minutes
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
  settings: TeamSettings;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  permissions: string[];
}

export interface TeamSettings {
  allowVoiceCommands: boolean;
  sharedAnalytics: boolean;
  dataRetentionDays: number;
}

export interface OfflineQueue {
  id: string;
  type: 'voice_command' | 'action' | 'sync';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string;
  pendingItems: number;
  isSyncing: boolean;
  errors: string[];
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface MLPrediction {
  type: 'schedule_suggestion' | 'task_priority' | 'time_estimate';
  confidence: number;
  prediction: any;
  factors: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Analytics: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};
