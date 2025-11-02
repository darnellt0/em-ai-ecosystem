/**
 * Voice Audio Router
 * Extends Voice API with audio generation endpoints
 * Converts voice API responses to ElevenLabs TTS audio
 *
 * Production routes for audio streaming and generation
 */

import { Router, Response, RequestHandler } from 'express';
import { z } from 'zod';
import { authBearer, AuthenticatedRequest } from '../middleware/authBearer';
import { rateLimitSimple } from '../middleware/rateLimitSimple';
import { generateAudio, VOICE_PRESETS, ElevenLabsConfig } from './voice.elevenlabs';

const router = Router();

// Middleware stack
const middleware = [authBearer, rateLimitSimple];

// Helper to wrap async handlers
const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response) => Promise<void>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
};

// ============================================================================
// SCHEMAS
// ============================================================================

const GenerateAudioSchema = z.object({
  text: z.string().min(1).max(1000).describe('Text to generate audio from'),
  voiceId: z.string().optional().describe('ElevenLabs voice ID (default: Shria)'),
  modelId: z.string().optional().describe('ElevenLabs model ID (default: eleven_turbo_v2_5)'),
  stability: z.number().min(0).max(1).optional().describe('Voice stability (0-1)'),
  similarity_boost: z.number().min(0).max(1).optional().describe('Similarity boost (0-1)'),
  returnFormat: z.enum(['buffer', 'base64', 'url']).optional().default('buffer'),
});

type GenerateAudioInput = z.infer<typeof GenerateAudioSchema>;

// ============================================================================
// ENDPOINT 1: POST /api/voice/audio/generate
// ============================================================================

/**
 * Generate audio from text using Shria voice.
 * Returns MP3 audio stream or base64-encoded audio.
 *
 * Request body:
 * {
 *   "text": "Blocked 45 minutes for focus",
 *   "voiceId": "DoEstgRs2aKZVhKhJhnx",  // optional
 *   "modelId": "eleven_turbo_v2_5",     // optional
 *   "returnFormat": "buffer"             // optional: buffer | base64 | url
 * }
 *
 * Response:
 * - If returnFormat=buffer: MP3 audio stream (application/mpeg)
 * - If returnFormat=base64: JSON with audioBase64 and metadata
 * - If returnFormat=url: Would integrate with S3/storage (future)
 */
router.post(
  '/audio/generate',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate request
    let input: GenerateAudioInput;
    try {
      input = GenerateAudioSchema.parse(req.body);
    } catch (err) {
      const zodErr = err as z.ZodError;
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: zodErr.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
      return;
    }

    // Build ElevenLabs config
    const config: Partial<ElevenLabsConfig> = {};
    if (input.voiceId) config.voiceId = input.voiceId;
    if (input.modelId) config.modelId = input.modelId;
    if (input.stability !== undefined || input.similarity_boost !== undefined) {
      config.voiceSettings = {
        stability: input.stability ?? 0.5,
        similarity_boost: input.similarity_boost ?? 0.75,
      };
    }

    // Generate audio
    const result = await generateAudio(input.text, config, input.returnFormat === 'base64');

    if (!result.success) {
      res.status(500).json({
        status: 'error',
        message: 'Audio generation failed',
        error: result.error,
      });
      return;
    }

    // Return based on format
    if (input.returnFormat === 'base64') {
      res.json({
        status: 'ok',
        audioBase64: result.audioBase64,
        size: result.size,
        format: 'mp3',
        voiceId: config.voiceId || 'DoEstgRs2aKZVhKhJhnx',
      });
      return;
    }

    // Default: return as audio stream
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', result.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(result.audioBuffer);
  })
);

// ============================================================================
// ENDPOINT 2: GET /api/voice/audio/voices
// ============================================================================

/**
 * List available voice presets
 *
 * Response:
 * {
 *   "voices": {
 *     "shria": { "voiceId": "...", "name": "...", "description": "..." },
 *     "josh": { ... },
 *     ...
 *   }
 * }
 */
router.get('/audio/voices', middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'ok',
    voices: Object.entries(VOICE_PRESETS).map(([key, voice]) => ({
      key,
      ...voice,
    })),
    default: 'shria',
  });
}));

// ============================================================================
// ENDPOINT 3: POST /api/voice/audio/batch
// ============================================================================

/**
 * Generate audio for multiple texts in batch
 * Useful for generating audio for multiple API responses
 *
 * Request:
 * {
 *   "texts": [
 *     "Blocked 45 minutes for focus",
 *     "Added meeting to calendar",
 *     "Starting meditation"
 *   ],
 *   "voiceId": "DoEstgRs2aKZVhKhJhnx"
 * }
 *
 * Response:
 * {
 *   "status": "ok",
 *   "audios": [
 *     { "success": true, "audioBase64": "...", "size": 100000 },
 *     { "success": true, "audioBase64": "...", "size": 95000 },
 *     { "success": false, "error": "..." }
 *   ]
 * }
 */
const BatchAudioSchema = z.object({
  texts: z.array(z.string().min(1).max(1000)).min(1).max(20),
  voiceId: z.string().optional(),
  modelId: z.string().optional(),
});

type BatchAudioInput = z.infer<typeof BatchAudioSchema>;

router.post(
  '/audio/batch',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate
    let input: BatchAudioInput;
    try {
      input = BatchAudioSchema.parse(req.body);
    } catch (err) {
      const zodErr = err as z.ZodError;
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: zodErr.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
      return;
    }

    // Build config
    const config: Partial<ElevenLabsConfig> = {};
    if (input.voiceId) config.voiceId = input.voiceId;
    if (input.modelId) config.modelId = input.modelId;

    // Generate all in parallel
    const results = await Promise.all(
      input.texts.map((text) => generateAudio(text, config, true)) // Always return base64 for batch
    );

    res.json({
      status: 'ok',
      count: results.length,
      audios: results.map((result) => ({
        success: result.success,
        ...(result.success ? { audioBase64: result.audioBase64, size: result.size } : { error: result.error }),
      })),
    });
  })
);

export default router;
