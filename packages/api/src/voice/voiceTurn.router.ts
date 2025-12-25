/**
 * Voice Turn Router
 * Single endpoint that chains: audio → transcription → command routing → response
 *
 * This consolidates the voice interaction into one API call:
 * - Handles both audio (multipart) and text (JSON) input
 * - Transcribes audio using existing STT service
 * - Routes commands through hybrid router (deterministic + OpenAI fallback)
 * - Returns unified response with follow-up/confirmation support
 */

import { Router, Response, Request } from 'express';
import multer from 'multer';
import { transcribeAudio, isSTTAvailable, getSTTStatus } from './stt.service';
import { HybridRouterService } from '../services/hybrid-router.service';

const router = Router();

// ============================================================================
// MULTER CONFIGURATION (same as transcribe.router.ts)
// ============================================================================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'audio/webm',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/mp4',
      'video/webm',
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
// TYPES
// ============================================================================

interface VoiceTurnResponse {
  status: 'ok' | 'error';
  transcript?: string;
  assistant: {
    kind: 'result' | 'follow_up' | 'confirmation' | 'error';
    text: string;
    runId?: string;
    artifact?: any; // Main artifact placement for UI consumption (e.g., journal prompts)
    followUp?: {
      suggestions: string[];
      context?: any;
    };
    confirmation?: {
      question: string;
      yesAction: string;
      noAction: string;
      context?: any;
    };
    metadata?: {
      route?: string;
      complexity?: string;
      intent?: string;
      latency?: number;
      cost?: number;
      nextBestAction?: string;
    };
  };
  error?: string;
}

// ============================================================================
// ENDPOINT: POST /api/voice/turn
// ============================================================================

/**
 * Execute a complete voice turn: audio/text → transcription → command → response
 *
 * Accepts two input formats:
 * 1. JSON: { "user": "shria", "text": "block 30 minutes for focus" }
 * 2. Multipart: { "user": "shria", "audio": <audio file> }
 *
 * Response format:
 * {
 *   "status": "ok",
 *   "transcript": "block 30 minutes for focus",
 *   "assistant": {
 *     "kind": "result",
 *     "text": "Blocked 30 minutes for focus starting at 2:00 PM",
 *     "runId": "abc-123",
 *     "metadata": { ... }
 *   }
 * }
 */
router.post('/turn', (req: Request, res: Response) => {
  const contentType = req.get('content-type') || '';

  // ========================================================================
  // HANDLE JSON INPUT (text)
  // ========================================================================
  if (contentType.includes('application/json')) {
    handleTextInput(req, res);
    return;
  }

  // ========================================================================
  // HANDLE MULTIPART INPUT (audio)
  // ========================================================================
  if (contentType.includes('multipart/form-data')) {
    upload.single('audio')(req, res, async (err) => {
      // Handle multer errors
      if (err) {
        if (err.message && err.message.includes('Boundary')) {
          return res.status(400).json({
            status: 'error',
            assistant: {
              kind: 'error',
              text: 'No audio file uploaded. Please include an "audio" field in your form-data.',
            },
            error: 'No audio file uploaded. Please include an "audio" field in your form-data.',
          });
        }

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 'error',
              assistant: {
                kind: 'error',
                text: 'Audio file too large. Maximum size is 25MB.',
              },
              error: 'File too large. Maximum size is 25MB.',
            });
          }
          return res.status(400).json({
            status: 'error',
            assistant: {
              kind: 'error',
              text: `Upload error: ${err.message}`,
            },
            error: `Upload error: ${err.message}`,
          });
        }

        return res.status(400).json({
          status: 'error',
          assistant: {
            kind: 'error',
            text: err.message || 'File upload failed',
          },
          error: err.message || 'File upload failed',
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          assistant: {
            kind: 'error',
            text: 'No audio file uploaded. Please include an "audio" field in your form-data.',
          },
          error: 'No audio file uploaded. Please include an "audio" field in your form-data.',
        });
      }

      // Check if STT is configured
      if (!isSTTAvailable()) {
        const sttStatus = getSTTStatus();
        return res.status(400).json({
          status: 'error',
          assistant: {
            kind: 'error',
            text: 'Speech-to-text is not configured. Please set STT_PROVIDER=openai and STT_OPENAI_API_KEY.',
          },
          error: 'Audio received but STT is not configured.',
          metadata: { sttStatus },
        });
      }

      // Transcribe audio
      try {
        const audioBuffer = req.file.buffer;
        const filename = req.file.originalname || 'audio.webm';

        const transcriptionResult = await transcribeAudio(audioBuffer, filename);

        if (!transcriptionResult.success || !transcriptionResult.text) {
          const failureMessage = transcriptionResult.error
            ? `Transcription failed: ${transcriptionResult.error}`
            : 'Transcription failed';
          return res.status(500).json({
            status: 'error',
            assistant: {
              kind: 'error',
              text: failureMessage,
            },
            error: transcriptionResult.error || 'Transcription failed',
          });
        }

        // Extract user from form field or default to 'shria'
        const user = (req.body.user as string) || 'shria';

        // Process the transcribed text through command router
        await processCommand(user, transcriptionResult.text, res);
      } catch (error: any) {
        console.error('Transcription error:', error);
        return res.status(500).json({
          status: 'error',
          assistant: {
            kind: 'error',
            text: error.message || 'Internal server error during transcription',
          },
          error: error.message || 'Internal server error during transcription',
        });
      }
    });

    return; // Multer middleware handles the response
  }

  // Unsupported content type
  return res.status(400).json({
    status: 'error',
    assistant: {
      kind: 'error',
      text: 'Unsupported Content-Type. Use "application/json" or "multipart/form-data".',
    },
    error: 'Unsupported Content-Type. Use "application/json" or "multipart/form-data".',
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle text-based input (JSON payload)
 */
async function handleTextInput(req: Request, res: Response): Promise<void> {
  const { user, text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      status: 'error',
      assistant: {
        kind: 'error',
        text: 'Missing or invalid "text" field in request body',
      },
      error: 'Missing or invalid "text" field in request body',
    }) as any;
  }

  const username = user || 'shria';
  await processCommand(username, text, res);
}

/**
 * Process command through hybrid router and return response
 */
async function processCommand(user: string, text: string, res: Response): Promise<void> {
  try {
    // Normalize user to founder name
    const founder = user === 'darnell' ? 'darnell' : 'shria';

    // Route through hybrid router service
    const hybridRouter = HybridRouterService.getInstance();
    const routingResult = await hybridRouter.route({
      transcript: text,
      founder,
    });

    // Check if the command was unrecognized (should trigger follow-up)
    const summary = routingResult.humanSummary || '';
    const isUnknown = summary.includes('Unable to') ||
                      summary.includes('not recognized') ||
                      summary.includes('could not understand') ||
                      summary.includes('complex and OpenAI not configured');

    if (isUnknown) {
      // Return follow-up suggestions for unknown commands
      return res.status(200).json({
        status: 'ok',
        transcript: text,
        assistant: {
          kind: 'follow_up',
          text: routingResult.humanSummary,
          followUp: {
            suggestions: [
              'Block focus time',
              'Get daily brief',
              'Start meditation',
              'Schedule meeting',
            ],
            context: {
              originalTranscript: text,
              route: routingResult.route,
              complexity: routingResult.complexity,
            },
          },
        },
      }) as any;
    }

    // Successful command execution
    const response: VoiceTurnResponse = {
      status: 'ok',
      transcript: text,
      assistant: {
        kind: 'result',
        text: summary || 'Command processed successfully',
        runId: routingResult.runId,
        artifact: routingResult.artifact, // Place artifact at top level for easy UI access
        metadata: {
          route: routingResult.route,
          complexity: routingResult.complexity,
          intent: routingResult.intent,
          latency: routingResult.latency,
          cost: routingResult.cost,
          nextBestAction: routingResult.nextBestAction,
        },
      },
    };

    return res.status(200).json(response) as any;
  } catch (error: any) {
    console.error('Command processing error:', error);
    return res.status(500).json({
      status: 'error',
      transcript: text,
      assistant: {
        kind: 'error',
        text: error.message || 'Failed to process command',
      },
      error: error.message || 'Failed to process command',
    }) as any;
  }
}

export default router;
