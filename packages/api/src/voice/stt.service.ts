/**
 * Speech-to-Text (STT) Service
 * Supports multiple STT providers (OpenAI Whisper)
 * Designed to be provider-agnostic with easy extensibility
 */

import { Readable } from 'stream';
import OpenAI from 'openai';

// ============================================================================
// TYPES
// ============================================================================

export type STTProvider = 'none' | 'openai';

export interface STTConfig {
  provider: STTProvider;
  openaiApiKey?: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  provider?: string;
  error?: string;
  duration?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Load STT configuration from environment variables
 */
export function loadSTTConfig(): STTConfig {
  const provider = (process.env.STT_PROVIDER || 'none').toLowerCase() as STTProvider;
  const openaiApiKey = process.env.STT_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  return {
    provider,
    openaiApiKey,
  };
}

// ============================================================================
// OPENAI WHISPER PROVIDER
// ============================================================================

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithOpenAI(
  audioBuffer: Buffer,
  filename: string,
  apiKey: string
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    const openai = new OpenAI({ apiKey });

    // Create a Readable stream from buffer for OpenAI SDK
    const stream = Readable.from(audioBuffer);

    // Cast to any to work around type issues with File-like objects in Node.js
    const audioFile: any = Object.assign(stream, {
      name: filename,
      type: 'audio/webm',
      path: filename,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optional: specify language for better accuracy
      response_format: 'text',
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      text: typeof transcription === 'string' ? transcription : String(transcription),
      provider: 'openai',
      duration,
    };
  } catch (error: any) {
    console.error('OpenAI Whisper transcription error:', error);
    return {
      success: false,
      error: error.message || 'OpenAI transcription failed',
      provider: 'openai',
      duration: Date.now() - startTime,
    };
  }
}

// ============================================================================
// MAIN STT SERVICE
// ============================================================================

/**
 * Transcribe audio buffer using configured STT provider
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.webm'
): Promise<TranscriptionResult> {
  const config = loadSTTConfig();

  // Handle 'none' provider
  if (config.provider === 'none') {
    return {
      success: false,
      error: 'STT provider not configured. Set STT_PROVIDER=openai and STT_OPENAI_API_KEY in your environment.',
    };
  }

  // Handle OpenAI provider
  if (config.provider === 'openai') {
    if (!config.openaiApiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Set STT_OPENAI_API_KEY or OPENAI_API_KEY in your environment.',
      };
    }

    return transcribeWithOpenAI(audioBuffer, filename, config.openaiApiKey);
  }

  // Unknown provider
  return {
    success: false,
    error: `Unknown STT provider: ${config.provider}. Supported providers: none, openai`,
  };
}

/**
 * Check if STT is configured and available
 */
export function isSTTAvailable(): boolean {
  const config = loadSTTConfig();

  if (config.provider === 'none') {
    return false;
  }

  if (config.provider === 'openai') {
    return !!config.openaiApiKey;
  }

  return false;
}

/**
 * Get STT configuration status for debugging
 */
export function getSTTStatus() {
  const config = loadSTTConfig();

  return {
    provider: config.provider,
    available: isSTTAvailable(),
    openaiKeyConfigured: !!config.openaiApiKey,
  };
}
