/**
 * Whisper STT Service
 *
 * Handles speech-to-text transcription using OpenAI Whisper API
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const WHISPER_API_URL = process.env.WHISPER_API_URL || 'https://api.openai.com';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
  language?: string;
}

/**
 * Transcribe audio to text using Whisper API
 *
 * @param audioInput - URL to audio file or base64 encoded audio data
 * @returns TranscriptionResult with transcribed text
 */
export async function transcribeAudio(audioInput: string): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    if (!OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OPENAI_API_KEY environment variable not set',
      };
    }

    const formData = new FormData();

    // Handle URL vs base64 data
    if (audioInput.startsWith('http://') || audioInput.startsWith('https://')) {
      // Download audio from URL
      const audioResponse = await axios.get(audioInput, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

      formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
      });
    } else {
      // Assume base64 encoded data
      const audioBuffer = Buffer.from(audioInput, 'base64');

      formData.append('file', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
      });
    }

    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    // Call Whisper API
    const response = await axios.post(
      `${WHISPER_API_URL}/v1/audio/transcriptions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 30000,  // 30 second timeout
      }
    );

    const duration = Date.now() - startTime;

    return {
      success: true,
      text: response.data.text,
      duration,
      language: response.data.language || 'en',
    };

  } catch (error: any) {
    console.error('[Whisper Service] Transcription error:', error.message);

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Transcribe audio file from local path
 *
 * @param filePath - Path to local audio file
 * @returns TranscriptionResult with transcribed text
 */
export async function transcribeFile(filePath: string): Promise<TranscriptionResult> {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }

    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString('base64');

    return await transcribeAudio(base64Audio);

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
