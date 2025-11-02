// Voice Service - Cross-Platform Voice Recognition & Recording
import * as Haptics from 'expo-haptics';
import api from './api';

export interface VoiceRecordingResult {
  transcript: string;
  audioUri?: string;
  duration: number;
}

class VoiceService {
  private isListening = false;
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      console.log('Recording started');

      // Haptic feedback if available
      if (Haptics) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          // Haptics not available on web
        }
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<VoiceRecordingResult> {
    try {
      if (!this.mediaRecorder) {
        throw new Error('No active recording');
      }

      return new Promise((resolve, reject) => {
        this.mediaRecorder!.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const duration = (Date.now() - this.startTime) / 1000;

          const result: VoiceRecordingResult = {
            transcript: '',
            duration,
          };

          // Stop all tracks
          this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
          this.mediaRecorder = null;
          this.isRecording = false;

          console.log('Recording stopped:', duration);

          resolve(result);
        };

        this.mediaRecorder!.stop();

        // Haptic feedback if available
        if (Haptics) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          } catch (e) {
            // Haptics not available
          }
        }
      });
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async sendVoiceCommand(audioUri: string, transcript?: string): Promise<any> {
    try {
      // Send to API
      const result = await api.sendVoiceCommand(new Blob(), transcript);
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
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
      }
      this.isListening = false;
      this.isRecording = false;
    } catch (error) {
      console.error('Error cleaning up voice service:', error);
    }
  }
}

export default new VoiceService();
