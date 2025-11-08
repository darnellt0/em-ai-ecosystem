/**
 * ElevenLabs Voice Integration
 * Handles text-to-speech conversion using ElevenLabs API
 *
 * Production integration for converting Voice API responses to audio
 */

import https from "https";

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
  };
}

export interface GeneratedAudio {
  success: boolean;
  audioBuffer?: Buffer;
  audioBase64?: string;
  size?: number;
  error?: string;
}

/**
 * Default voice configuration - Shria (cloned voice)
 */
export const DEFAULT_VOICE_CONFIG: ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || "",
  voiceId: "DoEstgRs2aKZVhKhJhnx", // Shria (cloned voice)
  modelId: "eleven_turbo_v2_5",
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
  },
};

/**
 * Available voice presets
 */
export const VOICE_PRESETS = {
  shria: {
    voiceId: "DoEstgRs2aKZVhKhJhnx",
    name: "Shria (Cloned Voice)",
    description: "Custom cloned voice for primary responses",
  },
  josh: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    name: "Josh (Male)",
    description: "Young & Energetic male voice",
  },
  sara: {
    voiceId: "ZQe5CZNOzWyzPSCn5a3c",
    name: "Sara (Female)",
    description: "Helpful & Clear female voice",
  },
  rachel: {
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel (Female)",
    description: "Calm & Professional female voice",
  },
} as const;

/**
 * Generate audio from text using ElevenLabs API
 * Returns audio buffer or base64-encoded string
 *
 * @param text - Text to convert to speech
 * @param config - ElevenLabs configuration (uses defaults if not provided)
 * @param returnBase64 - If true, returns base64 string instead of buffer
 * @returns GeneratedAudio object with audio data or error
 */
export async function generateAudio(
  text: string,
  config: Partial<ElevenLabsConfig> = {},
  returnBase64 = false,
): Promise<GeneratedAudio> {
  try {
    // Merge with defaults
    const finalConfig: ElevenLabsConfig = {
      ...DEFAULT_VOICE_CONFIG,
      ...config,
    };

    // Validate API key
    if (!finalConfig.apiKey) {
      return {
        success: false,
        error: "ELEVENLABS_API_KEY not configured",
      };
    }

    // Validate text
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "Text cannot be empty",
      };
    }

    // Create request payload
    const requestBody = JSON.stringify({
      text: text,
      model_id: finalConfig.modelId,
      voice_settings: finalConfig.voiceSettings,
    });

    // Make HTTPS request
    return new Promise((resolve) => {
      const options = {
        hostname: "api.elevenlabs.io",
        path: `/v1/text-to-speech/${finalConfig.voiceId}/stream`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": finalConfig.apiKey,
          "Content-Length": Buffer.byteLength(requestBody),
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          const audioBuffer = Buffer.concat(chunks);

          // Check for error (usually very small response)
          if (audioBuffer.length < 100 && res.statusCode !== 200) {
            return resolve({
              success: false,
              error: `ElevenLabs API error: ${res.statusCode}`,
            });
          }

          if (returnBase64) {
            return resolve({
              success: true,
              audioBase64: audioBuffer.toString("base64"),
              size: audioBuffer.length,
            });
          }

          return resolve({
            success: true,
            audioBuffer,
            size: audioBuffer.length,
          });
        });
      });

      req.on("error", (err) => {
        resolve({
          success: false,
          error: `Network error: ${err.message}`,
        });
      });

      req.write(requestBody);
      req.end();
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Batch generate audio for multiple texts
 * Useful for generating multiple voice responses
 *
 * @param texts - Array of texts to convert
 * @param config - ElevenLabs configuration
 * @returns Array of GeneratedAudio results in same order
 */
export async function generateAudioBatch(
  texts: string[],
  config: Partial<ElevenLabsConfig> = {},
): Promise<GeneratedAudio[]> {
  return Promise.all(texts.map((text) => generateAudio(text, config)));
}

/**
 * Get available voices
 */
export function getAvailableVoices() {
  return VOICE_PRESETS;
}

/**
 * Validate voice configuration
 */
export function validateConfig(config: Partial<ElevenLabsConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey && !DEFAULT_VOICE_CONFIG.apiKey) {
    errors.push("ELEVENLABS_API_KEY is not set");
  }

  if (config.modelId && !config.modelId.startsWith("eleven_")) {
    errors.push("Invalid model ID");
  }

  if (config.voiceSettings) {
    if (
      config.voiceSettings.stability < 0 ||
      config.voiceSettings.stability > 1
    ) {
      errors.push("Stability must be between 0 and 1");
    }
    if (
      config.voiceSettings.similarity_boost < 0 ||
      config.voiceSettings.similarity_boost > 1
    ) {
      errors.push("Similarity boost must be between 0 and 1");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
