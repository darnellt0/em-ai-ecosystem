/**
 * Voice Transcribe Router
 * Handles speech-to-text transcription for voice commands
 * Supports both JSON text input and multipart audio file uploads
 */

import { Router, Response, Request } from 'express';
import multer from 'multer';
import { transcribeAudio, isSTTAvailable, getSTTStatus } from './stt.service';

const router = Router();

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

// Use memory storage for audio files (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size (Whisper API limit)
    files: 1, // Only accept one file at a time
  },
  fileFilter: (_req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      'audio/webm',
      'video/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/mp4',
      'application/octet-stream',
    ];

    if (
      allowedMimes.includes(file.mimetype) ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload an audio file.`));
    }
  },
});

// ============================================================================
// ENDPOINT: POST /api/voice/transcribe
// ============================================================================

/**
 * Transcribe audio or text to text
 *
 * Accepts two input formats:
 * 1. JSON: { "text": "hello world" } - Echo back text (stub mode)
 * 2. Multipart form-data with "audio" file field - Transcribe audio using STT
 *
 * Response: { "text": "transcribed text", "provider": "openai" }
 */
router.post('/transcribe', (req: Request, res: Response) => {
  const contentType = req.get('content-type') || '';

  // Handle JSON input (text echo / stub mode)
  if (contentType.includes('application/json')) {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'Missing or invalid "text" field in request body',
      });
    }

    // Echo back the text (stub mode for testing without STT)
    return res.status(200).json({
      status: 'ok',
      text: text.trim(),
      provider: 'stub',
    });
  }

  // Handle multipart form-data (audio upload)
  if (contentType.includes('multipart/form-data')) {
    upload.single('audio')(req, res, async (err) => {
      // Handle multer errors
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 'error',
              error: 'File too large. Maximum size is 25MB.',
            });
          }
          return res.status(400).json({
            status: 'error',
            error: `Upload error: ${err.message}`,
          });
        }

        const message = err.message || 'File upload failed';
        if (message.toLowerCase().includes('boundary') || message.toLowerCase().includes('multipart')) {
          return res.status(400).json({
            status: 'error',
            error: 'No audio file uploaded. Please include an "audio" field in your form-data.',
          });
        }
        return res.status(400).json({
          status: 'error',
          error: message,
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          error: 'No audio file uploaded. Please include an "audio" field in your form-data.',
        });
      }

      // Check if STT is configured
      if (!isSTTAvailable()) {
        const status = getSTTStatus();
        return res.status(400).json({
          status: 'error',
          error: 'Audio received but STT is not configured.',
          message:
            'To enable speech-to-text transcription, set STT_PROVIDER=openai and STT_OPENAI_API_KEY in your environment variables.',
          sttStatus: status,
        });
      }

      // Transcribe audio
      try {
        const audioBuffer = req.file.buffer;
        const filename = req.file.originalname || 'audio.webm';

        const result = await transcribeAudio(audioBuffer, filename);

        if (!result.success) {
          return res.status(500).json({
            status: 'error',
            error: result.error || 'Transcription failed',
            provider: result.provider,
          });
        }

        return res.status(200).json({
          status: 'ok',
          text: result.text,
          provider: result.provider,
          duration: result.duration,
        });
      } catch (error: any) {
        console.error('Transcription error:', error);
        return res.status(500).json({
          status: 'error',
          error: error.message || 'Internal server error during transcription',
        });
      }
    });

    return; // Multer middleware handles the response
  }

  // Unsupported content type
  return res.status(400).json({
    status: 'error',
    error: 'Unsupported Content-Type. Use "application/json" or "multipart/form-data".',
  });
});

// ============================================================================
// ENDPOINT: POST /api/voice/command
// ============================================================================

/**
 * Execute a voice command
 *
 * Request: { "user": "shria", "text": "block 45 minutes for focus" }
 * Response: Routes to appropriate handler via intent classification
 */
router.post('/command', async (req: Request, res: Response) => {
  const { user, text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      status: 'error',
      error: 'Missing or invalid "text" field in request body',
    });
  }

  // For now, delegate to the intent router
  // This allows the dashboard to call: transcribe → command → intent → action
  try {
    // Simple stub: just acknowledge the command
    // In production, this would route to the intent classifier
    return res.status(200).json({
      status: 'ok',
      message: 'Command received',
      text: text.trim(),
      user: user || 'unknown',
      nextStep: 'Route this to /api/voice/intent for classification',
    });
  } catch (error: any) {
    console.error('Command processing error:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || 'Failed to process command',
    });
  }
});

// ============================================================================
// ENDPOINT: GET /api/voice/transcribe/status
// ============================================================================

/**
 * Get STT configuration status
 *
 * Response: { "provider": "openai", "available": true }
 */
router.get('/transcribe/status', (_req: Request, res: Response) => {
  const status = getSTTStatus();

  return res.status(200).json({
    status: 'ok',
    ...status,
  });
});

export default router;
