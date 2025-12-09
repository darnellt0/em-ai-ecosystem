/**
 * JournalAgent - Daily Alignment Journal
 * Creates/manages Google Sheet for journal entries with AI summarization
 */

import { google } from 'googleapis';
import OpenAI from 'openai';
import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { JournalEntry } from './types';
import nodemailer from 'nodemailer';

export class JournalAgent extends BaseAgent {
  private sheets: any;
  private openai: OpenAI;
  private spreadsheetId?: string;
  private mailer: nodemailer.Transporter;
  private readonly offline =
    process.env.NODE_ENV === 'test' ||
    process.env.EM_OFFLINE_MODE === 'true' ||
    !process.env.OPENAI_API_KEY;

  constructor(config: AgentConfig) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async setup(): Promise<void> {
    await super.setup();

    // Initialize Google Sheets API
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
      ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, 'base64').toString())
      : null;

    if (serviceAccountJson) {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient as any });
    } else {
      this.logger.warn('JournalAgent offline: GOOGLE_SERVICE_ACCOUNT_JSON_B64 not set; using stubbed run');
    }

    await this.reportProgress(10, 'Google Sheets API initialized');
  }

  async run(): Promise<AgentResult> {
    const outputs: Record<string, unknown> = {};
    const artifacts: string[] = [];

    try {
      if (this.offline || !this.sheets) {
        this.logger.warn('JournalAgent running in offline/test mode; returning stub data');
        const stubEntries = this.addSyntheticEntries();
        return {
          success: true,
          outputs: {
            spreadsheetId: 'offline-journal',
            entriesAdded: stubEntries.length,
            processedEntries: stubEntries.length,
            digest: 'Offline digest',
            emailSent: false,
            offline: true,
          },
          artifacts: [],
        };
      }

      await this.reportProgress(20, 'Creating/verifying journal spreadsheet');

      // Create or find spreadsheet
      this.spreadsheetId = await this.createOrFindSpreadsheet();
      outputs.spreadsheetId = this.spreadsheetId;
      artifacts.push(`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`);

      await this.reportProgress(40, 'Adding sample reflections');

      // Add synthetic entries for testing
      const entries = await this.addSyntheticEntries();
      outputs.entriesAdded = entries.length;

      await this.reportProgress(60, 'Generating AI summaries');

      // Process entries with AI
      const processedEntries = await this.processEntriesWithAI(entries);
      outputs.processedEntries = processedEntries.length;

      await this.reportProgress(80, 'Generating weekly digest');

      // Generate weekly digest
      const digest = await this.generateWeeklyDigest(processedEntries);
      outputs.digest = digest;

      await this.reportProgress(90, 'Sending digest email');

      // Send digest email
      const emailResult = await this.sendDigestEmail(digest);
      outputs.emailSent = emailResult;

      await this.emitEvent('journal_complete', {
        spreadsheetId: this.spreadsheetId,
        entriesCount: entries.length,
        digestGenerated: true,
      });

      return {
        success: true,
        outputs,
        artifacts,
      };
    } catch (error) {
      this.logger.error('JournalAgent run failed:', error);
      return {
        success: false,
        outputs,
        artifacts,
        errors: [(error as Error).message],
      };
    }
  }

  async validate(): Promise<boolean> {
    if (this.offline || !this.sheets) {
      this.logger.warn('JournalAgent validate skipped (offline/test mode)');
      return true;
    }

    // Validation: Check spreadsheet has entries and digest was generated
    if (!this.spreadsheetId) {
      this.logger.error('Validation failed: No spreadsheet created');
      return false;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EM_Journal!A:G',
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        // At least header + 1 entry
        this.logger.error('Validation failed: No entries found');
        return false;
      }

      this.logger.info(`Validation passed: ${rows.length - 1} entries found`);
      return true;
    } catch (error) {
      this.logger.error('Validation error:', error);
      return false;
    }
  }

  private async createOrFindSpreadsheet(): Promise<string> {
    return this.retry(async () => {
      const drive = google.drive({ version: 'v3', auth: this.sheets.context._options.auth });

      // Search for existing sheet
      const searchResult = await drive.files.list({
        q: "name='EM_Journal' and mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)',
      });

      if (searchResult.data.files && searchResult.data.files.length > 0) {
        const id = searchResult.data.files[0].id!;
        this.logger.info(`Found existing spreadsheet: ${id}`);
        return id;
      }

      // Create new spreadsheet
      const createResult = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: 'EM_Journal',
          },
          sheets: [
            {
              properties: {
                title: 'EM_Journal',
              },
            },
          ],
        },
      });

      const id = createResult.data.spreadsheetId!;

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: id,
        range: 'EM_Journal!A1:G1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['timestamp', 'email', 'text', 'transcript', 'sentiment', 'topics', 'summary']],
        },
      });

      this.logger.info(`Created new spreadsheet: ${id}`);
      return id;
    });
  }

  private addSyntheticEntries(): JournalEntry[] {
    const entries: JournalEntry[] = [
      {
        timestamp: new Date().toISOString(),
        email: process.env.FOUNDER_DARNELL_EMAIL || 'test@example.com',
        text: 'Today I felt energized working on the growth agent project. The architecture is coming together nicely.',
        transcript: '',
      },
      {
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        email: process.env.FOUNDER_DARNELL_EMAIL || 'test@example.com',
        text: 'Grateful for the progress we made this week. Feeling aligned with our mission.',
        transcript: '',
      },
      {
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        email: process.env.FOUNDER_DARNELL_EMAIL || 'test@example.com',
        text: 'Reflecting on work-life balance. Need more pause blocks in my schedule.',
        transcript: '',
      },
    ];

    return entries;
  }

  private async processEntriesWithAI(entries: JournalEntry[]): Promise<JournalEntry[]> {
    const processed: JournalEntry[] = [];

    for (const entry of entries) {
      try {
        // Generate summary, sentiment, and topics
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'Analyze journal entries. Return JSON with: summary (1 sentence), sentiment (0-1 score), topics (3 keywords)',
            },
            {
              role: 'user',
              content: entry.text,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const analysis = JSON.parse(completion.choices[0].message.content || '{}');

        const processedEntry: JournalEntry = {
          ...entry,
          summary: analysis.summary || entry.text.substring(0, 100),
          sentiment: analysis.sentiment || 0.7,
          topics: analysis.topics || ['reflection'],
        };

        processed.push(processedEntry);

        // Append to spreadsheet
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'EM_Journal!A:G',
          valueInputOption: 'RAW',
          requestBody: {
            values: [
              [
                processedEntry.timestamp,
                processedEntry.email,
                processedEntry.text,
                processedEntry.transcript || '',
                processedEntry.sentiment,
                processedEntry.topics?.join(', ') || '',
                processedEntry.summary || '',
              ],
            ],
          },
        });
      } catch (error) {
        this.logger.error('Failed to process entry:', error);
        processed.push(entry);
      }
    }

    return processed;
  }

  private async generateWeeklyDigest(entries: JournalEntry[]): Promise<string> {
    const avgSentiment = entries.reduce((sum, e) => sum + (e.sentiment || 0), 0) / entries.length;
    const allTopics = entries.flatMap((e) => e.topics || []);
    const topicCounts: Record<string, number> = {};
    allTopics.forEach((t) => (topicCounts[t] = (topicCounts[t] || 0) + 1));
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    const html = `
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #36013f;">Weekly Journal Digest</h1>
          <p><strong>Entries this week:</strong> ${entries.length}</p>
          <p><strong>Average sentiment:</strong> ${(avgSentiment * 100).toFixed(0)}%</p>
          <p><strong>Top topics:</strong> ${topTopics.join(', ')}</p>
          <h2 style="color: #176161;">Recent Reflections</h2>
          ${entries.map((e) => `<p><em>${e.timestamp}</em><br/>${e.summary || e.text}</p>`).join('')}
        </body>
      </html>
    `;

    return html;
  }

  private async sendDigestEmail(html: string): Promise<boolean> {
    try {
      const recipient = process.env.GMAIL_SENDER_ADDRESS || process.env.SMTP_USER || 'test@example.com';

      await this.mailer.sendMail({
        from: process.env.SMTP_USER,
        to: recipient,
        subject: 'Your Weekly Journal Digest',
        html,
      });

      this.logger.info(`Digest email sent to ${recipient}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send digest email:', error);
      return false;
    }
  }
}
