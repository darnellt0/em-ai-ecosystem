/**
 * Voice Command Router
 * Handles voice commands from mobile app with audio transcription
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { HybridRouterService } from '../services/hybrid-router.service';
import OpenAI from 'openai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI for Whisper transcription
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/voice/command
 * Main voice command endpoint for mobile app
 * Accepts: multipart/form-data with audio file and optional transcript
 * Returns: VoiceResponse with transcription and command result
 */
// New path to bypass caching issues with old /command endpoint
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    console.log('[VoiceCommand] Received request');
    console.log('[VoiceCommand] Has audio file:', !!req.file);
    console.log('[VoiceCommand] Body:', req.body);

    // Get transcript from request or transcribe audio
    let transcript = req.body.transcript || '';
    let transcriptionMeta = {
      attempted: false,
      success: false,
      source: 'none' as 'none' | 'client' | 'whisper'
    };

    // If transcript provided by client, use it
    if (transcript) {
      transcriptionMeta.source = 'client';
      transcriptionMeta.success = true;
      console.log('[VoiceCommand] Using client-provided transcript:', transcript);
    }
    // If audio file provided and no transcript, transcribe it
    else if (req.file && openai) {
      try {
        transcriptionMeta.attempted = true;
        console.log('[VoiceCommand] Transcribing audio with Whisper...');

        // Convert buffer to File using OpenAI's toFile helper
        const audioFile = await OpenAI.toFile(
          req.file.buffer,
          req.file.originalname || 'audio.m4a'
        );

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en'
        });

        transcript = transcription.text;
        transcriptionMeta.success = true;
        transcriptionMeta.source = 'whisper';
        console.log('[VoiceCommand] Whisper transcription:', transcript);
      } catch (error: any) {
        console.error('[VoiceCommand] Transcription error:', error);
        return res.status(500).json({
          status: 'error',
          humanSummary: 'Failed to transcribe audio',
          nextBestAction: 'Please try again or provide a text transcript',
          transcriptionMeta,
          error: error.message
        });
      }
    }

    // If still no transcript, return error
    if (!transcript) {
      return res.status(400).json({
        status: 'error',
        humanSummary: 'No audio or transcript provided',
        nextBestAction: 'Please provide either an audio file or a text transcript',
        transcriptionMeta
      });
    }

    // Route the command through hybrid router
    const hybridRouter = HybridRouterService.getInstance();
    const result = await hybridRouter.route({
      transcript,
      founder: 'darnell', // TODO: Get from auth context
      userId: req.body.userId
    });

    // Return response with transcription metadata
    res.json({
      status: 'ok',
      transcript,
      humanSummary: result.humanSummary,
      nextBestAction: result.nextBestAction,
      data: result.data,
      route: result.route,
      transcriptionMeta
    });

  } catch (error: any) {
    console.error('[VoiceCommand] Error:', error);
    res.status(500).json({
      status: 'error',
      humanSummary: 'An error occurred processing your voice command',
      nextBestAction: 'Please try again',
      error: error.message
    });
  }
});

export default router;
