export type VoiceMode = 'companion' | 'brand' | 'coach';

export interface VoiceSettings {
  mode: VoiceMode;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost?: boolean;
}

export const VOICE_MODES: Record<VoiceMode, VoiceSettings> = {
  companion: {
    mode: 'companion',
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.3,
    speakerBoost: true
  },
  brand: {
    mode: 'brand',
    stability: 0.5,
    similarityBoost: 0.9,
    style: 0.5,
    speakerBoost: true
  },
  coach: {
    mode: 'coach',
    stability: 0.8,
    similarityBoost: 0.7,
    style: 0.2,
    speakerBoost: false
  }
};
