// Offline Sync Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue, SyncStatus } from '../types';
import api from './api';

const OFFLINE_QUEUE_KEY = 'offline_queue';
const LAST_SYNC_KEY = 'last_sync_time';

class OfflineSyncService {
  private syncInProgress = false;
  private isOnline = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      console.log('Network status changed:', this.isOnline ? 'Online' : 'Offline');

      // If coming back online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log('Network restored, triggering sync...');
        this.syncOfflineQueue();
      }

      this.notifyListeners();
    });

    // Start periodic sync (every 5 minutes)
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncOfflineQueue();
      }
    }, 5 * 60 * 1000);
  }

  async addToQueue(type: string, data: any): Promise<void> {
    const queue = await this.getQueue();

    const item: OfflineQueue = {
      id: this.generateId(),
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    queue.push(item);
    await this.saveQueue(queue);
    console.log('Added to offline queue:', item.id, item.type);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineQueue();
    }
  }

  async syncOfflineQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      console.log('Sync skipped:', { syncInProgress: this.syncInProgress, isOnline: this.isOnline });
      return;
    }

    try {
      this.syncInProgress = true;
      this.notifyListeners();

      const queue = await this.getQueue();
      const pendingItems = queue.filter((item) => item.status === 'pending');

      if (pendingItems.length === 0) {
        console.log('No pending items to sync');
        return;
      }

      console.log(`Syncing ${pendingItems.length} items...`);

      // Send to backend
      const result = await api.syncOfflineData(pendingItems);

      // Process results
      const updatedQueue = queue.filter((item) => {
        if (item.status === 'pending') {
          const syncResult = result.results?.find((r: any) => r.id === item.id);
          if (syncResult?.success) {
            return false; // Remove successfully synced items
          } else {
            item.retryCount++;
            if (item.retryCount >= 3) {
              item.status = 'failed';
            }
            return true; // Keep failed items
          }
        }
        return true;
      });

      await this.saveQueue(updatedQueue);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('Sync completed:', {
        synced: pendingItems.length - updatedQueue.filter((i) => i.status === 'pending').length,
        failed: updatedQueue.filter((i) => i.status === 'failed').length,
      });
    } catch (error: any) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  async getQueue(): Promise<OfflineQueue[]> {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  async saveQueue(queue: OfflineQueue[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const lastSyncTime = await AsyncStorage.getItem(LAST_SYNC_KEY);

    return {
      isOnline: this.isOnline,
      lastSyncTime: lastSyncTime || 'Never',
      pendingItems: queue.filter((i) => i.status === 'pending').length,
      isSyncing: this.syncInProgress,
      errors: queue.filter((i) => i.status === 'failed').map((i) => `Failed to sync ${i.type}`),
    };
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners() {
    const status = await this.getSyncStatus();
    this.listeners.forEach((callback) => callback(status));
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default new OfflineSyncService();
