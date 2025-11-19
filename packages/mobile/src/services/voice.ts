// Voice Service - Cross-Platform Voice Recognition & Recording
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import api from './api';

export interface VoiceRecordingResult {
  transcript: string;
  audioUri?: string;
  duration: number;
}

class VoiceService {
  private isListening = false;
  private isRecording = false;
  private recording: Audio.Recording | null = null;
  private startTime = 0;
  private currentTranscript = '';
  private onResultCallback?: (result: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // Initialize speech recognition event listeners
    this.setupSpeechRecognition();
  }

  private setupSpeechRecognition() {
    // Listen for speech recognition results
    ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
      if (event.results && event.results.length > 0) {
        const result = event.results[0];
        if (result.transcript) {
          this.currentTranscript = result.transcript;
          console.log('Speech recognized:', result.transcript);
        }
      }
    });

    // Listen for errors
    ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
      console.error('Speech recognition error:', event);
    });
  }

  private onSpeechStart = () => {
    console.log('Speech recognition started');
    this.isListening = true;
  };

  private onSpeechEnd = () => {
    console.log('Speech recognition ended');
    this.isListening = false;
  };

  private onSpeechResults = (event: any) => {
    const result = event.value?.[0] || '';
    console.log('Speech result:', result);
    if (this.onResultCallback) {
      this.onResultCallback(result);
    }
  };

  private onSpeechError = (event: any) => {
    console.error('Speech error:', event.error);
    this.isListening = false;
    if (this.onErrorCallback) {
      this.onErrorCallback(event.error?.message || 'Speech recognition error');
    }
  };

  async startListening(
    onResult: (result: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      // Try to use Web Speech API if available
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error('Speech Recognition API not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      recognition.language = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = this.onSpeechStart;
      recognition.onend = this.onSpeechEnd;
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }
      };
      recognition.onerror = (event: any) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      recognition.start();
      this.isListening = true;
    } catch (error: any) {
      console.error('Error starting voice recognition:', error);
      onError(error.message || 'Failed to start voice recognition');
    }
  }

  async stopListening(): Promise<void> {
    try {
      this.isListening = false;
      console.log('Stopped listening');
    } catch (error: any) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Request permissions for audio recording
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Request speech recognition permission
      const speechPermission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!speechPermission.granted) {
        throw new Error('Speech recognition permission not granted');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.startTime = Date.now();
      this.isRecording = true;
      this.currentTranscript = '';

      // Speech recognition disabled - using backend Whisper transcription instead
      // ExpoSpeechRecognitionModule.start({
      //   lang: "en-US",
      //   interimResults: true,
      //   maxAlternatives: 1,
      //   continuous: true,
      //   requiresOnDeviceRecognition: false,
      //   addsPunctuation: true,
      //   contextualStrings: ["Elevated Movements", "AI assistant", "calendar", "schedule"],
      // });

      console.log('Recording started (backend transcription mode)');

      // Haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Haptics not available
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<VoiceRecordingResult> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      // Speech recognition disabled - backend will transcribe
      // ExpoSpeechRecognitionModule.stop();
      // await new Promise(resolve => setTimeout(resolve, 300));

      // Stop the audio recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const duration = (Date.now() - this.startTime) / 1000;

      // Don't send transcript - let backend transcribe with Whisper
      const result: VoiceRecordingResult = {
        transcript: '', // Empty - backend will transcribe
        audioUri: uri || undefined,
        duration,
      };

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      this.recording = null;
      this.isRecording = false;

      console.log('Recording stopped:', duration, 'Transcript:', this.currentTranscript, 'URI:', uri);

      // Haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Haptics not available
      }

      return result;
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async sendVoiceCommand(audioUri: string, transcript?: string): Promise<any> {
    try {
      console.log('[VoiceService] Sending command with transcript:', transcript);
      console.log('[VoiceService] Audio URI:', audioUri);

      // Send to API - the api service handles file upload
      const result = await api.sendVoiceCommand(audioUri, transcript);

      console.log('[VoiceService] API response:', result);
      return result;
    } catch (error: any) {
      console.error('Error sending voice command:', error);
      throw error;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    try {
      // Stop speech recognition
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        // Already stopped
      }

      // Stop audio recording
      if (this.recording && this.isRecording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      this.isListening = false;
      this.isRecording = false;
      this.currentTranscript = '';
    } catch (error) {
      console.error('Error cleaning up voice service:', error);
    }
  }
}

export default new VoiceService();
