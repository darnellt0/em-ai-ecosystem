/**
 * Voice Profile Management - Phase 4 (Agent 11)
 * ElevenLabs voice cloning integration and profile management
 */

export interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  voiceId: string; // ElevenLabs voice ID
  isCustom: boolean; // true if voice-cloned
  isDefault: boolean;
  settings: {
    stability: number; // 0-1
    similarityBoost: number; // 0-1
    style: number; // 0-1
    useSpeakerBoost: boolean;
  };
  metadata?: {
    description?: string;
    language?: string;
    gender?: string;
    age?: string;
  };
  createdAt: Date;
}

export interface VoiceCloneRequest {
  name: string;
  description?: string;
  audioFiles: string[]; // URLs or paths to audio samples
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

class VoiceProfileService {
  private logger = console;
  private profiles: Map<string, VoiceProfile> = new Map();

  constructor() {
    // Initialize with default voices
    this.initializeDefaultVoices();
  }

  /**
   * Get all voice profiles for a user
   */
  async getUserVoiceProfiles(userId: string): Promise<VoiceProfile[]> {
    const userProfiles: VoiceProfile[] = [];

    for (const profile of this.profiles.values()) {
      if (profile.userId === userId || profile.userId === 'system') {
        userProfiles.push(profile);
      }
    }

    return userProfiles;
  }

  /**
   * Get default voice profile for user
   */
  async getDefaultVoiceProfile(userId: string): Promise<VoiceProfile | null> {
    const profiles = await this.getUserVoiceProfiles(userId);
    return profiles.find((p) => p.isDefault) || profiles[0] || null;
  }

  /**
   * Create custom voice from audio samples (ElevenLabs voice cloning)
   */
  async createCustomVoice(
    userId: string,
    request: VoiceCloneRequest
  ): Promise<VoiceProfile> {
    this.logger.info(`[Voice Profile] Creating custom voice for ${userId}: ${request.name}`);

    try {
      // In production, this would:
      // 1. Upload audio samples to ElevenLabs
      // 2. Create voice clone via their API
      // 3. Get the new voice ID

      // Mock implementation
      const voiceId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const profile: VoiceProfile = {
        id: `profile_${Date.now()}`,
        userId,
        name: request.name,
        voiceId,
        isCustom: true,
        isDefault: false,
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.5,
          useSpeakerBoost: true,
        },
        metadata: {
          description: request.description,
          language: 'en-US',
        },
        createdAt: new Date(),
      };

      this.profiles.set(profile.id, profile);

      this.logger.info(`[Voice Profile] Created custom voice: ${profile.id}`);

      return profile;
    } catch (error) {
      this.logger.error('[Voice Profile] Create custom voice error:', error);
      throw error;
    }
  }

  /**
   * Set default voice for user
   */
  async setDefaultVoice(userId: string, profileId: string): Promise<boolean> {
    this.logger.info(`[Voice Profile] Setting default voice for ${userId}: ${profileId}`);

    try {
      // Unset current default
      for (const profile of this.profiles.values()) {
        if (profile.userId === userId && profile.isDefault) {
          profile.isDefault = false;
        }
      }

      // Set new default
      const profile = this.profiles.get(profileId);
      if (profile && profile.userId === userId) {
        profile.isDefault = true;
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('[Voice Profile] Set default error:', error);
      return false;
    }
  }

  /**
   * Update voice profile settings
   */
  async updateVoiceSettings(
    profileId: string,
    settings: Partial<VoiceProfile['settings']>
  ): Promise<VoiceProfile | null> {
    this.logger.info(`[Voice Profile] Updating settings for ${profileId}`);

    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        return null;
      }

      profile.settings = {
        ...profile.settings,
        ...settings,
      };

      return profile;
    } catch (error) {
      this.logger.error('[Voice Profile] Update settings error:', error);
      return null;
    }
  }

  /**
   * Delete voice profile
   */
  async deleteVoiceProfile(userId: string, profileId: string): Promise<boolean> {
    this.logger.info(`[Voice Profile] Deleting profile ${profileId}`);

    try {
      const profile = this.profiles.get(profileId);

      // Can't delete system voices
      if (!profile || profile.userId === 'system') {
        return false;
      }

      // Can't delete if user doesn't own it
      if (profile.userId !== userId) {
        return false;
      }

      // Delete from ElevenLabs if custom voice
      if (profile.isCustom && ELEVENLABS_API_KEY) {
        // Would call ElevenLabs API to delete voice
        this.logger.info(`[Voice Profile] Would delete ElevenLabs voice: ${profile.voiceId}`);
      }

      this.profiles.delete(profileId);
      return true;
    } catch (error) {
      this.logger.error('[Voice Profile] Delete error:', error);
      return false;
    }
  }

  /**
   * Get available ElevenLabs voices
   */
  async getAvailableVoices(): Promise<any[]> {
    this.logger.info('[Voice Profile] Fetching available voices');

    try {
      if (!ELEVENLABS_API_KEY) {
        return this.getDefaultVoiceOptions();
      }

      // In production, would call ElevenLabs API:
      // GET https://api.elevenlabs.io/v1/voices
      return this.getDefaultVoiceOptions();
    } catch (error) {
      this.logger.error('[Voice Profile] Fetch voices error:', error);
      return this.getDefaultVoiceOptions();
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDefaultVoices(): void {
    const defaultVoices: VoiceProfile[] = [
      {
        id: 'profile_shria_default',
        userId: 'system',
        name: 'Shria (Default)',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
        isCustom: false,
        isDefault: true,
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.5,
          useSpeakerBoost: true,
        },
        metadata: {
          description: 'Clear, professional female voice',
          language: 'en-US',
          gender: 'female',
        },
        createdAt: new Date(),
      },
      {
        id: 'profile_josh_warm',
        userId: 'system',
        name: 'Josh (Warm)',
        voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh voice
        isCustom: false,
        isDefault: false,
        settings: {
          stability: 0.65,
          similarityBoost: 0.8,
          style: 0.6,
          useSpeakerBoost: true,
        },
        metadata: {
          description: 'Warm, friendly male voice',
          language: 'en-US',
          gender: 'male',
        },
        createdAt: new Date(),
      },
      {
        id: 'profile_sara_professional',
        userId: 'system',
        name: 'Sara (Professional)',
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sara voice
        isCustom: false,
        isDefault: false,
        settings: {
          stability: 0.7,
          similarityBoost: 0.75,
          style: 0.4,
          useSpeakerBoost: false,
        },
        metadata: {
          description: 'Professional, clear female voice',
          language: 'en-US',
          gender: 'female',
        },
        createdAt: new Date(),
      },
    ];

    for (const voice of defaultVoices) {
      this.profiles.set(voice.id, voice);
    }
  }

  private getDefaultVoiceOptions(): any[] {
    return [
      { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
      { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
      { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sara', category: 'premade' },
      { voice_id: 'IKne3meq5aSrNqZdkZeT', name: 'Clyde', category: 'premade' },
    ];
  }
}

// Export singleton instance
export const voiceProfileService = new VoiceProfileService();
