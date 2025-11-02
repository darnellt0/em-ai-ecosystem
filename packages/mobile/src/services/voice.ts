// Voice Service for React Native Voice
import Voice from '@react-native-community/voice';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import api from './api';

export interface VoiceRecordingResult {
  transcript: string;
  audioUri?: string;
  duration: number;
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isListening = false;
  private onResultCallback?: (result: string) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.setupVoiceRecognition();
  }

  private setupVoiceRecognition() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
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
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start voice recognition
      await Voice.start('en-US');
      this.isListening = true;
    } catch (error: any) {
      console.error('Error starting voice recognition:', error);
      onError(error.message || 'Failed to start voice recognition');
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.isListening = false;
    } catch (error: any) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      this.recording = recording;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('Recording started');
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

      await this.recording.stopAndUnloadAsync();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      const duration = status.durationMillis || 0;

      console.log('Recording stopped:', uri, duration);

      // Get transcript using voice recognition
      // For now, return empty transcript - will be filled by backend
      const result: VoiceRecordingResult = {
        transcript: '',
        audioUri: uri || undefined,
        duration: duration / 1000, // Convert to seconds
      };

      this.recording = null;
      return result;
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.recording = null;
      throw error;
    }
  }

  async sendVoiceCommand(audioUri: string, transcript?: string): Promise<any> {
    try {
      // Read audio file
      const response = await fetch(audioUri);
      const blob = await response.blob();

      // Send to API
      const result = await api.sendVoiceCommand(blob, transcript);
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
    return this.recording !== null;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      if (this.isListening) {
        await Voice.stop();
        this.isListening = false;
      }
      await Voice.destroy();
    } catch (error) {
      console.error('Error cleaning up voice service:', error);
    }
  }
}

export default new VoiceService();
