import { URL } from 'node:url';

export interface IntentResponse {
  readonly humanSummary: string;
}

export interface VoiceIntentClientOptions {
  readonly baseUrl?: string;
  readonly authorizationToken?: string;
}

export interface IntentClientContract {
  postIntent(text: string): Promise<IntentResponse>;
}

export class VoiceIntentClient implements IntentClientContract {
  private readonly baseUrl: string;

  private readonly authorizationToken?: string;

  constructor(options: VoiceIntentClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.VOICE_INTENT_URL ?? 'http://127.0.0.1:3000';
    this.authorizationToken = options.authorizationToken;
  }

  async postIntent(text: string): Promise<IntentResponse> {
    const endpoint = new URL('/api/voice/intent', this.baseUrl).toString();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authorizationToken ? { Authorization: `Bearer ${this.authorizationToken}` } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Intent service responded with status ${response.status}`);
    }

    const payload = (await response.json()) as Partial<IntentResponse>;
    if (typeof payload.humanSummary !== 'string') {
      throw new Error('Intent service returned an invalid payload');
    }

    return { humanSummary: payload.humanSummary };
  }
}

export interface VoiceRealtimeDependencies {
  readonly createSttAdapter?: () => import('./adapters/stt.adapter').SttAdapterContract;
  readonly createTtsAdapter?: () => import('./adapters/tts.adapter').TtsAdapterContract;
  readonly intentClient?: IntentClientContract;
  readonly now?: () => number;
}
