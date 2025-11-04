import { Buffer } from 'node:buffer';

/**
 * Streaming text-to-speech adapter stub.
 *
 * TODO: Replace with ElevenLabs streaming integration.
 */
export class TtsAdapter {
  async *start(text: string): AsyncGenerator<Buffer> {
    const sanitized = text.trim() === '' ? 'tts-placeholder' : text;
    const chunkSize = 48;
    for (let index = 0; index < sanitized.length; index += chunkSize) {
      const chunk = sanitized.slice(index, index + chunkSize);
      yield Buffer.from(chunk, 'utf8');
    }

    if (sanitized.length === 0) {
      yield Buffer.alloc(0);
    }
  }
}
