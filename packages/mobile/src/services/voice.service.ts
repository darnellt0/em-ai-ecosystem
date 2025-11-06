/**
 * Voice Service - Mobile App (Phase 3 - Agent 6)
 * Speech-to-text and voice command processing
 */

import Voice from '@react-native-voice/voice';

export interface VoiceResult {
  transcript: string;
  confidence: number;
}

export interface VoiceCommand {
  action: 'block_focus' | 'log_task' | 'create_task' | 'start_pause';
  parameters: Record<string, any>;
}

class VoiceService {
  private isListening: boolean = false;

  constructor() {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    try {
      await Voice.start('en-US');
      this.isListening = true;
      console.log('[Voice Service] Started listening');
    } catch (error) {
      console.error('[Voice Service] Start error:', error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
      console.log('[Voice Service] Stopped listening');
    } catch (error) {
      console.error('[Voice Service] Stop error:', error);
    }
  }

  /**
   * Cancel voice recognition
   */
  async cancel(): Promise<void> {
    try {
      await Voice.cancel();
      this.isListening = false;
    } catch (error) {
      console.error('[Voice Service] Cancel error:', error);
    }
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Parse voice command from transcript
   */
  parseCommand(transcript: string): VoiceCommand | null {
    const lower = transcript.toLowerCase();

    // Block focus time
    if (lower.includes('block') && (lower.includes('time') || lower.includes('focus'))) {
      const minutesMatch = lower.match(/(\d+)\s*(minute|min|hour)/);
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 60;
      const reason = this.extractReason(lower);

      return {
        action: 'block_focus',
        parameters: { minutes, reason },
      };
    }

    // Log task completion
    if (lower.includes('complete') || lower.includes('done') || lower.includes('finished')) {
      return {
        action: 'log_task',
        parameters: { note: transcript },
      };
    }

    // Create follow-up task
    if (lower.includes('remind') || lower.includes('follow up') || lower.includes('create task')) {
      return {
        action: 'create_task',
        parameters: { subject: transcript },
      };
    }

    // Start pause/meditation
    if (lower.includes('pause') || lower.includes('meditate') || lower.includes('breathe')) {
      const style = this.extractPauseStyle(lower);
      return {
        action: 'start_pause',
        parameters: { style, durationSeconds: 60 },
      };
    }

    return null;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private onSpeechResults(event: any): void {
    const results = event.value || [];
    if (results.length > 0) {
      console.log('[Voice Service] Speech results:', results);
    }
  }

  private onSpeechError(event: any): void {
    console.error('[Voice Service] Speech error:', event);
  }

  private extractReason(text: string): string {
    const forMatch = text.match(/for\s+(.+)/);
    if (forMatch) {
      return forMatch[1].trim();
    }
    return 'Deep work';
  }

  private extractPauseStyle(text: string): string {
    if (text.includes('box')) return 'box';
    if (text.includes('ground')) return 'grounding';
    if (text.includes('scan')) return 'body-scan';
    return 'breath';
  }
}

export const voiceService = new VoiceService();
