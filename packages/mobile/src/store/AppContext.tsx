// App Context Provider - Global app state
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Activity, VoiceCommand, SyncStatus } from '../types';

interface AppState {
  activities: Activity[];
  voiceCommands: VoiceCommand[];
  syncStatus: SyncStatus;
  notifications: any[];
  isVoiceRecording: boolean;
}

interface AppContextType extends AppState {
  addActivity: (activity: Activity) => void;
  addVoiceCommand: (command: VoiceCommand) => void;
  updateVoiceCommand: (id: string, updates: Partial<VoiceCommand>) => void;
  updateSyncStatus: (status: SyncStatus) => void;
  setVoiceRecording: (recording: boolean) => void;
  clearActivities: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    activities: [],
    voiceCommands: [],
    syncStatus: {
      isOnline: true,
      lastSyncTime: 'Never',
      pendingItems: 0,
      isSyncing: false,
      errors: [],
    },
    notifications: [],
    isVoiceRecording: false,
  });

  const addActivity = (activity: Activity) => {
    setState((prev) => ({
      ...prev,
      activities: [activity, ...prev.activities].slice(0, 100), // Keep last 100
    }));
  };

  const addVoiceCommand = (command: VoiceCommand) => {
    setState((prev) => ({
      ...prev,
      voiceCommands: [command, ...prev.voiceCommands].slice(0, 50), // Keep last 50
    }));

    // Also add as activity
    addActivity({
      id: command.id,
      userId: command.userId,
      type: 'voice_command',
      title: 'Voice Command',
      description: command.transcript,
      timestamp: command.timestamp,
    });
  };

  const updateVoiceCommand = (id: string, updates: Partial<VoiceCommand>) => {
    setState((prev) => ({
      ...prev,
      voiceCommands: prev.voiceCommands.map((cmd) =>
        cmd.id === id ? { ...cmd, ...updates } : cmd
      ),
    }));
  };

  const updateSyncStatus = (syncStatus: SyncStatus) => {
    setState((prev) => ({ ...prev, syncStatus }));
  };

  const setVoiceRecording = (isVoiceRecording: boolean) => {
    setState((prev) => ({ ...prev, isVoiceRecording }));
  };

  const clearActivities = () => {
    setState((prev) => ({ ...prev, activities: [], voiceCommands: [] }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addActivity,
        addVoiceCommand,
        updateVoiceCommand,
        updateSyncStatus,
        setVoiceRecording,
        clearActivities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
