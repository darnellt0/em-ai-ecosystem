// API Service for Elevated Movements AI Mobile App
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConfig } from '../types';

class ApiService {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear auth
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async signup(name: string, email: string, password: string) {
    const response = await this.client.post('/auth/signup', { name, email, password });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh');
    return response.data;
  }

  // Voice endpoints
  async sendVoiceCommand(audioUri: string, transcript?: string) {
    console.log('[ApiService] Sending voice command:', { transcript });

    // In React Native, we need to send the file URI
    // FormData in React Native can handle file URIs directly
    const formData = new FormData();

    // Add audio file from URI
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    // Add transcript if available (fallback for when Whisper isn't available)
    if (transcript) {
      formData.append('transcript', transcript);
    }

    const response = await this.client.post('/voice/command', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('[ApiService] Voice command response:', response.data);
    return response.data;
  }

  async getVoiceHistory(limit = 50, offset = 0) {
    const response = await this.client.get('/voice/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getVoiceCommandStatus(commandId: string) {
    const response = await this.client.get(`/voice/command/${commandId}`);
    return response.data;
  }

  // Activity endpoints
  async getActivities(limit = 50, offset = 0) {
    const response = await this.client.get('/activities', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getActivityDetails(activityId: string) {
    const response = await this.client.get(`/activities/${activityId}`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'week') {
    const response = await this.client.get('/analytics', {
      params: { period },
    });
    return response.data;
  }

  async getProductivityMetrics() {
    const response = await this.client.get('/analytics/productivity');
    return response.data;
  }

  async getAgentUsageStats() {
    const response = await this.client.get('/analytics/agents');
    return response.data;
  }

  // User endpoints
  async getUserProfile() {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  async updateUserProfile(updates: any) {
    const response = await this.client.patch('/user/profile', updates);
    return response.data;
  }

  async updateUserPreferences(preferences: any) {
    const response = await this.client.patch('/user/preferences', preferences);
    return response.data;
  }

  // Team endpoints
  async getTeam() {
    const response = await this.client.get('/team');
    return response.data;
  }

  async createTeam(name: string) {
    const response = await this.client.post('/team', { name });
    return response.data;
  }

  async inviteTeamMember(email: string, role: string) {
    const response = await this.client.post('/team/invite', { email, role });
    return response.data;
  }

  async removeTeamMember(userId: string) {
    const response = await this.client.delete(`/team/member/${userId}`);
    return response.data;
  }

  // Sync endpoints
  async syncOfflineData(queueItems: any[]) {
    const response = await this.client.post('/sync', { items: queueItems });
    return response.data;
  }

  async getSyncStatus() {
    const response = await this.client.get('/sync/status');
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export default new ApiService();
