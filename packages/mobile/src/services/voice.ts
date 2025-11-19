// Voice Service - Cross-Platform Voice Recognition & Recording
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
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
  private onResultCallback?: (result: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // Initialize - no native setup needed on web
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

      console.log('Recording started');

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

      // Stop the recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const duration = (Date.now() - this.startTime) / 1000;

      const result: VoiceRecordingResult = {
        transcript: '',
        audioUri: uri || undefined,
        duration,
      };

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      this.recording = null;
      this.isRecording = false;

      console.log('Recording stopped:', duration, 'URI:', uri);

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
      // In React Native, we need to create a file object from the URI
      // The API expects a blob/file, but for now we'll send the URI and transcript
      // The actual audio upload can be implemented later with proper file handling
      console.log('Sending voice command - URI:', audioUri, 'Transcript:', transcript);

      // For now, just return a mock response since the backend might not be set up
      // This allows the UI to work without backend errors
      return {
        success: true,
        transcript: transcript || 'Voice command recorded',
        message: 'Command captured successfully (backend integration pending)'
      };
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
      if (this.recording && this.isRecording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      this.isListening = false;
      this.isRecording = false;
    } catch (error) {
      console.error('Error cleaning up voice service:', error);
    }
  }
}

export default new VoiceService();
