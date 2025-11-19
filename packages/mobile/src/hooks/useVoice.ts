// useVoice Hook - Voice recording and commands
import { useState, useCallback } from 'react';
import voiceService from '../services/voice';
import offlineSyncService from '../services/offlineSync';
import mlPredictionService from '../services/mlPrediction';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { VoiceCommand } from '../types';

export const useVoice = () => {
  const { user } = useAuth();
  const { addVoiceCommand, updateVoiceCommand, setVoiceRecording } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await voiceService.startRecording();
      setIsRecording(true);
      setVoiceRecording(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      console.error('Error starting recording:', err);
    }
  }, [setVoiceRecording]);

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setVoiceRecording(false);
      setIsProcessing(true);

      const result = await voiceService.stopRecording();

      // Create voice command object
      const command: VoiceCommand = {
        id: generateId(),
        userId: user?.id || 'unknown',
        transcript: result.transcript || 'Processing...',
        audioUrl: result.audioUri,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      // Add to app state
      addVoiceCommand(command);

      // Send to backend or queue for offline
      try {
        if (result.audioUri) {
          // Don't send transcript - let backend transcribe with Whisper
          const response = await voiceService.sendVoiceCommand(result.audioUri);

          // Update command with response
          updateVoiceCommand(command.id, {
            status: 'completed',
            transcript: response.transcript || result.transcript,
            response: response,
          });

          // Learn from this command for ML
          await mlPredictionService.learnFromActivity(command);
        }
      } catch (apiError: any) {
        console.error('API error, adding to offline queue:', apiError);

        // Add to offline queue (without transcript - backend will transcribe)
        await offlineSyncService.addToQueue('voice_command', {
          commandId: command.id,
          audioUri: result.audioUri,
        });

        updateVoiceCommand(command.id, { status: 'pending' });
      }

      setIsProcessing(false);
      return command;
    } catch (err: any) {
      setError(err.message || 'Failed to process recording');
      setIsProcessing(false);
      console.error('Error stopping recording:', err);
      throw err;
    }
  }, [user, addVoiceCommand, updateVoiceCommand, setVoiceRecording]);

  const cancelRecording = useCallback(async () => {
    try {
      if (isRecording) {
        await voiceService.stopRecording();
        setIsRecording(false);
        setVoiceRecording(false);
      }
    } catch (err) {
      console.error('Error canceling recording:', err);
    }
  }, [isRecording, setVoiceRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
