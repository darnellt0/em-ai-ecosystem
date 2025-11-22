/**
 * HeyGen Interactive Avatar Configuration
 * Manages API credentials and configuration for HeyGen integration
 */

export interface HeygenConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

class HeygenConfigManager {
  private config: HeygenConfig | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.HEYGEN_API_KEY;
    const baseUrl = process.env.HEYGEN_BASE_URL || 'https://api.heygen.com';
    const timeoutMs = parseInt(process.env.HEYGEN_TIMEOUT_MS || '30000', 10);

    if (!apiKey) {
      console.warn('[HeyGen Config] HEYGEN_API_KEY not found in environment variables');
      console.warn('[HeyGen Config] HeyGen endpoints will return 503 Service Unavailable');
      this.isConfigured = false;
      return;
    }

    this.config = {
      apiKey,
      baseUrl,
      timeoutMs,
    };

    this.isConfigured = true;
    console.log('[HeyGen Config] Configuration loaded successfully');
    console.log(`[HeyGen Config] Base URL: ${baseUrl}`);
  }

  getConfig(): HeygenConfig {
    if (!this.isConfigured || !this.config) {
      throw new Error('HeyGen is not configured. Please set HEYGEN_API_KEY in environment variables.');
    }
    return this.config;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): {
    configured: boolean;
    baseUrl?: string;
    warning?: string;
  } {
    return {
      configured: this.isConfigured,
      baseUrl: this.config?.baseUrl,
      warning: !this.isConfigured
        ? 'HeyGen not configured. Add HEYGEN_API_KEY to .env'
        : undefined,
    };
  }
}

// Export singleton instance
export const heygenConfig = new HeygenConfigManager();
