export interface InboxEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  labels?: string[];
  receivedAt?: string;
}

export interface InboxListOptions {
  userId: string;
  query?: string;
  maxResults?: number;
}

const DEFAULT_MAX_RESULTS = 10;

export class InboxService {
  private configured: boolean;

  constructor() {
    this.configured = this.hasConfig();
  }

  private hasConfig(): boolean {
    return Boolean(
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    );
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async listEmails(options: InboxListOptions): Promise<InboxEmail[]> {
    if (!this.configured) {
      return [];
    }

    void options;

    // Placeholder for future Gmail API integration.
    return [];
  }
}

export const inboxService = new InboxService();
