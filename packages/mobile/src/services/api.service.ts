/**
 * API Service - Mobile App (Phase 3 - Agent 5)
 * Handles all API communication with backend
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.VOICE_API_TOKEN || 'elevenlabs-voice-secure-token-2025';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Block focus time
   */
  async blockFocusTime(minutes: number, reason: string, founder: string) {
    const response = await this.client.post('/api/voice/scheduler/block', {
      minutes,
      reason,
      founder,
    });
    return response.data;
  }

  /**
   * Log task completion
   */
  async logTaskComplete(taskId: string, note: string, founder: string) {
    const response = await this.client.post('/api/voice/support/log-complete', {
      taskId,
      note,
      founder,
    });
    return response.data;
  }

  /**
   * Create follow-up task
   */
  async createFollowUp(subject: string, dueISO: string, founder: string) {
    const response = await this.client.post('/api/voice/support/follow-up', {
      subject,
      dueISO,
      founder,
    });
    return response.data;
  }

  /**
   * Start pause/meditation session
   */
  async startPause(style: string, durationSeconds: number, founder: string) {
    const response = await this.client.post('/api/voice/coach/pause', {
      style,
      durationSeconds,
      founder,
    });
    return response.data;
  }

  /**
   * Get analytics metrics
   */
  async getMetrics(founder: string) {
    const response = await this.client.get('/api/analytics/metrics', {
      params: { founder },
    });
    return response.data;
  }

  /**
   * Get productivity trends
   */
  async getTrends(founder: string, days: number = 30) {
    const response = await this.client.get('/api/analytics/trends', {
      params: { founder, days },
    });
    return response.data;
  }

  /**
   * Get health score
   */
  async getHealthScore(founder: string) {
    const response = await this.client.get('/api/analytics/health', {
      params: { founder },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
