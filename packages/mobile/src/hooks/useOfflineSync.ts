// useOfflineSync Hook - Offline data synchronization
import { useState, useEffect, useCallback } from 'react';
import offlineSyncService from '../services/offlineSync';
import { useApp } from '../store/AppContext';
import { SyncStatus } from '../types';

export const useOfflineSync = () => {
  const { updateSyncStatus } = useApp();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSyncTime: 'Never',
    pendingItems: 0,
    isSyncing: false,
    errors: [],
  });

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      updateSyncStatus(status);
    });

    // Initial status
    loadSyncStatus();

    return unsubscribe;
  }, [updateSyncStatus]);

  const loadSyncStatus = useCallback(async () => {
    const status = await offlineSyncService.getSyncStatus();
    setSyncStatus(status);
    updateSyncStatus(status);
  }, [updateSyncStatus]);

  const triggerSync = useCallback(async () => {
    await offlineSyncService.syncOfflineQueue();
  }, []);

  const addToQueue = useCallback(async (type: string, data: any) => {
    await offlineSyncService.addToQueue(type, data);
    await loadSyncStatus();
  }, [loadSyncStatus]);

  const clearQueue = useCallback(async () => {
    await offlineSyncService.clearQueue();
    await loadSyncStatus();
  }, [loadSyncStatus]);

  return {
    syncStatus,
    triggerSync,
    addToQueue,
    clearQueue,
    refresh: loadSyncStatus,
  };
};
