import { Buffer } from 'node:buffer';

export type SttPartialCallback = (text: string) => void;
export type SttFinalCallback = (text: string) => void;

export interface SttAdapterOptions {
  /**
   * Number of PCM chunks that should be accumulated before emitting a final transcript.
   */
  readonly chunksPerFinal?: number;
}

/**
 * Streaming speech-to-text adapter stub.
 *
 * TODO: Replace the stubbed implementation with Whisper or a realtime provider.
 */
export class SttAdapter {
  private readonly partialCallbacks = new Set<SttPartialCallback>();

  private readonly finalCallbacks = new Set<SttFinalCallback>();

  private readonly chunksPerFinal: number;

  private chunkCount = 0;

  private transcriptParts: string[] = [];

  constructor(options: SttAdapterOptions = {}) {
    const desired = options.chunksPerFinal ?? 3;
    this.chunksPerFinal = desired > 0 ? desired : 1;
  }

  async pushPcm(buffer: Buffer): Promise<void> {
    if (buffer.length === 0) {
      return;
    }

    this.chunkCount += 1;
    const partialText = `stub-partial-${this.chunkCount}`;
    this.transcriptParts.push(partialText);
    this.emitPartial(partialText);

    if (this.chunkCount >= this.chunksPerFinal) {
      const finalText = this.transcriptParts.join(' ');
      this.emitFinal(finalText);
      this.chunkCount = 0;
      this.transcriptParts = [];
    }
  }

  onPartial(callback: SttPartialCallback): () => void {
    this.partialCallbacks.add(callback);
    return () => this.partialCallbacks.delete(callback);
  }

  onFinal(callback: SttFinalCallback): () => void {
    this.finalCallbacks.add(callback);
    return () => this.finalCallbacks.delete(callback);
  }

  protected emitPartial(text: string): void {
    for (const callback of this.partialCallbacks) {
      callback(text);
    }
  }

  protected emitFinal(text: string): void {
    for (const callback of this.finalCallbacks) {
      callback(text);
    }
  }
}
