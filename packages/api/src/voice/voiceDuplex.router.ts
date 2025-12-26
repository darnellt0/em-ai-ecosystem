/**
 * Voice Duplex Router
 *
 * Full-duplex voice API endpoint
 * Audio in → Whisper STT → Dispatcher → ElevenLabs TTS → Audio out
 */

import { Router, Request, Response } from 'express';
import { transcribeAudio } from '../services/whisper.service';
import { generateSpeech } from '../services/elevenlabs.service';
import { dispatchToAgent } from '../services/dispatcher.service';

const voiceDuplexRouter = Router();

interface VoiceDuplexRequest {
  audioUrl?: string;
  audioData?: string;  // base64 encoded
  userId: string;
  sessionId?: string;
  context?: {
    mood?: string;
    timeOfDay?: string;
    location?: string;
  };
}

interface VoiceDuplexResponse {
  success: boolean;
  sessionId: string;
  transcription: string;
  textResponse: string;
  audioUrl?: string;
  audioData?: string;  // base64 encoded
  detectedIntent?: string;
  detectedMood?: string;
  followUpSuggestions?: string[];
  shouldEndSession: boolean;
  sessionContext: any;
  error?: string;
}

/**
 * POST /api/voice/duplex
 *
 * Full duplex voice interaction
 *
 * Request:
 * - audioUrl: URL to audio file OR
 * - audioData: base64 encoded audio data
 * - userId: User identifier
 * - sessionId: Optional session ID (auto-generated if not provided)
 * - context: Optional context (mood, timeOfDay, location)
 *
 * Response:
 * - transcription: Text from STT
 * - textResponse: Agent's text response
 * - audioUrl: URL to generated audio response
 * - audioData: base64 encoded audio response
 * - detectedIntent: Detected user intent
 * - detectedMood: Detected mood
 * - followUpSuggestions: Suggested follow-ups
 * - shouldEndSession: Whether to end the conversation
 * - sessionContext: Session metadata
 */
voiceDuplexRouter.post('/api/voice/duplex', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      audioUrl,
      audioData,
      userId,
      sessionId,
      context,
    }: VoiceDuplexRequest = req.body;

    // Validation
    if (!audioUrl && !audioData) {
      return res.status(400).json({
        success: false,
        error: 'Either audioUrl or audioData is required',
      } as VoiceDuplexResponse);
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      } as VoiceDuplexResponse);
    }

    const generatedSessionId = sessionId || `session_${Date.now()}`;

    // Step 1: Transcribe audio with Whisper
    console.log('[Voice Duplex] Step 1: Transcribing audio...');
    const transcriptionResult = await transcribeAudio(audioUrl || audioData!);

    if (!transcriptionResult.success || !transcriptionResult.text) {
      return res.status(500).json({
        success: false,
        sessionId: generatedSessionId,
        error: `Transcription failed: ${transcriptionResult.error}`,
      } as VoiceDuplexResponse);
    }

    const transcription = transcriptionResult.text;
    console.log(`[Voice Duplex] Transcription: "${transcription}"`);

    // Step 2: Dispatch to voice_companion agent
    console.log('[Voice Duplex] Step 2: Dispatching to voice_companion agent...');
    const dispatchResult = await dispatchToAgent('voice_companion', {
      userId,
      sessionId: generatedSessionId,
      userMessage: transcription,
      context,
    });

    if (!dispatchResult.success || !dispatchResult.data) {
      return res.status(500).json({
        success: false,
        sessionId: generatedSessionId,
        transcription,
        error: `Agent dispatch failed: ${dispatchResult.error}`,
      } as VoiceDuplexResponse);
    }

    const agentResponse = dispatchResult.data;
    const textResponse = agentResponse.response;

    console.log(`[Voice Duplex] Agent response: "${textResponse.substring(0, 100)}..."`);

    // Step 3: Generate audio with ElevenLabs
    console.log('[Voice Duplex] Step 3: Generating speech with ElevenLabs...');
    const speechResult = await generateSpeech(textResponse);

    if (!speechResult.success) {
      return res.status(500).json({
        success: false,
        sessionId: generatedSessionId,
        transcription,
        textResponse,
        error: `Speech generation failed: ${speechResult.error}`,
      } as VoiceDuplexResponse);
    }

    const duration = Date.now() - startTime;
    console.log(`[Voice Duplex] Complete in ${duration}ms`);

    // Return full duplex response
    return res.json({
      success: true,
      sessionId: generatedSessionId,
      transcription,
      textResponse,
      audioUrl: speechResult.audioUrl,
      audioData: speechResult.audioData,
      detectedIntent: agentResponse.detectedIntent,
      detectedMood: agentResponse.detectedMood,
      followUpSuggestions: agentResponse.followUpSuggestions,
      shouldEndSession: agentResponse.shouldEndSession,
      sessionContext: agentResponse.sessionContext,
    } as VoiceDuplexResponse);

  } catch (error) {
    console.error('[Voice Duplex] Error:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    } as VoiceDuplexResponse);
  }
});

export default voiceDuplexRouter;
