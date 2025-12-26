/**
 * ElevenLabs TTS Service
 *
 * Handles text-to-speech generation using ElevenLabs API
 */

import axios from 'axios';

const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';  // Default: Rachel

export interface SpeechResult {
  success: boolean;
  audioUrl?: string;
  audioData?: string;  // base64 encoded
  error?: string;
  duration?: number;
  characterCount?: number;
}

export interface VoiceSettings {
  stability?: number;  // 0-1, default 0.5
  similarity_boost?: number;  // 0-1, default 0.75
  style?: number;  // 0-1, default 0
  use_speaker_boost?: boolean;  // default true
}

/**
 * Generate speech from text using ElevenLabs API
 *
 * @param text - Text to convert to speech
 * @param voiceId - Optional voice ID (defaults to env var)
 * @param voiceSettings - Optional voice settings
 * @returns SpeechResult with audio data
 */
export async function generateSpeech(
  text: string,
  voiceId?: string,
  voiceSettings?: VoiceSettings
): Promise<SpeechResult> {
  const startTime = Date.now();

  try {
    if (!ELEVENLABS_API_KEY) {
      return {
        success: false,
        error: 'ELEVENLABS_API_KEY environment variable not set',
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Text is required',
      };
    }

    const targetVoiceId = voiceId || ELEVENLABS_VOICE_ID;

    const defaultSettings: VoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
    };

    const settings = { ...defaultSettings, ...voiceSettings };

    // Call ElevenLabs API
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/v1/text-to-speech/${targetVoiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: settings,
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000,  // 30 second timeout
      }
    );

    const audioBuffer = Buffer.from(response.data);
    const audioData = audioBuffer.toString('base64');

    const duration = Date.now() - startTime;

    // In a real implementation, you might upload this to cloud storage
    // For now, we'll return the base64 data directly
    const audioUrl = `data:audio/mpeg;base64,${audioData}`;

    return {
      success: true,
      audioUrl,
      audioData,
      duration,
      characterCount: text.length,
    };

  } catch (error: any) {
    console.error('[ElevenLabs Service] Speech generation error:', error.message);

    return {
      success: false,
      error: error.response?.data?.detail?.message || error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get list of available voices
 *
 * @returns Array of voice objects
 */
export async function getVoices(): Promise<any> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable not set');
    }

    const response = await axios.get(
      `${ELEVENLABS_API_URL}/v1/voices`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    return response.data.voices;

  } catch (error: any) {
    console.error('[ElevenLabs Service] Get voices error:', error.message);
    throw error;
  }
}
