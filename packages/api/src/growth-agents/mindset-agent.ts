/**
 * MindsetAgent - Mindset Shift Mentor
 * Provides compassionate reframes, affirmations, and micro-practices
 */

import OpenAI from 'openai';
import { google } from 'googleapis';
import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { BeliefReframe } from './types';
import nodemailer from 'nodemailer';

export class MindsetAgent extends BaseAgent {
  private openai: OpenAI;
  private sheets: any;
  private mailer: nodemailer.Transporter;
  private spreadsheetId?: string;

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
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    }

    await this.reportProgress(10, 'Google Sheets API initialized');
  }

  async run(): Promise<AgentResult> {
    const outputs: Record<string, unknown> = {};
    const artifacts: string[] = [];

    try {
      await this.reportProgress(20, 'Creating/verifying mindset sheet');

      // Create or find spreadsheet
      this.spreadsheetId = await this.createOrFindSpreadsheet();
      outputs.spreadsheetId = this.spreadsheetId;

      await this.reportProgress(40, 'Processing limiting beliefs');

      // Add and process beliefs
      const beliefs = await this.processBeliefs();
      outputs.beliefsProcessed = beliefs.length;

      await this.reportProgress(70, 'Generating weekly snapshot');

      // Generate snapshot
      const snapshot = await this.generateSnapshot(beliefs);
      outputs.snapshot = snapshot;

      await this.reportProgress(90, 'Sending snapshot email');

      // Send email
      const emailSent = await this.sendSnapshotEmail(snapshot);
      outputs.emailSent = emailSent;

      await this.emitEvent('mindset_complete', {
        spreadsheetId: this.spreadsheetId,
        beliefsCount: beliefs.length,
      });

      return {
        success: true,
        outputs,
        artifacts: [`https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`],
      };
    } catch (error) {
      this.logger.error('MindsetAgent run failed:', error);
      return {
        success: false,
        outputs,
        artifacts,
        errors: [(error as Error).message],
      };
    }
  }

  async validate(): Promise<boolean> {
    if (!this.spreadsheetId) {
      this.logger.error('Validation failed: No spreadsheet created');
      return false;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'EM_Mindset!A:D',
      });

      const rows = response.data.values || [];
      if (rows.length < 4) {
        // Header + 3 entries
        this.logger.error('Validation failed: Insufficient entries');
        return false;
      }

      this.logger.info(`Validation passed: ${rows.length - 1} mindset entries found`);
      return true;
    } catch (error) {
      this.logger.error('Validation error:', error);
      return false;
    }
  }

  private async createOrFindSpreadsheet(): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: this.sheets.context._options.auth });

    const searchResult = await drive.files.list({
      q: "name='EM_Mindset' and mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id)',
    });

    if (searchResult.data.files && searchResult.data.files.length > 0) {
      return searchResult.data.files[0].id!;
    }

    const createResult = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'EM_Mindset' },
        sheets: [{ properties: { title: 'EM_Mindset' } }],
      },
    });

    const id = createResult.data.spreadsheetId!;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: 'EM_Mindset!A1:D1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['originalBelief', 'reframe', 'affirmation', 'microPractice']],
      },
    });

    return id;
  }

  private async processBeliefs(): Promise<BeliefReframe[]> {
    const limitingBeliefs = [
      "I don't have enough time",
      'I need to do everything myself',
      "I'm not technical enough",
    ];

    const reframes: BeliefReframe[] = [];

    for (const belief of limitingBeliefs) {
      const reframe = await this.generateReframe(belief);
      reframes.push(reframe);

      // Append to sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'EM_Mindset!A:D',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[belief, reframe.reframe, reframe.affirmation, reframe.microPractice]],
        },
      });
    }

    return reframes;
  }

  private async generateReframe(belief: string): Promise<BeliefReframe> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a compassionate mindset coach. For the limiting belief, provide: reframe (positive perspective), affirmation (I am statement), microPractice (tiny action). Return JSON.',
        },
        {
          role: 'user',
          content: belief,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      originalBelief: belief,
      reframe: result.reframe || 'You have more resources than you think',
      affirmation: result.affirmation || 'I am capable and resourceful',
      microPractice: result.microPractice || 'Take one small step today',
    };
  }

  private async generateSnapshot(beliefs: BeliefReframe[]): Promise<string> {
    return `
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #36013f;">Your Weekly Mindset Snapshot</h1>
          <p>This week you transformed ${beliefs.length} limiting beliefs:</p>
          ${beliefs
            .map(
              (b) => `
            <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #176161;">
              <p><strong>Old belief:</strong> ${b.originalBelief}</p>
              <p><strong>New perspective:</strong> ${b.reframe}</p>
              <p><strong>Affirmation:</strong> <em>${b.affirmation}</em></p>
              <p><strong>Try this:</strong> ${b.microPractice}</p>
            </div>
          `
            )
            .join('')}
        </body>
      </html>
    `;
  }

  private async sendSnapshotEmail(html: string): Promise<boolean> {
    try {
      const recipient = process.env.GMAIL_SENDER_ADDRESS || process.env.SMTP_USER || 'test@example.com';

      await this.mailer.sendMail({
        from: process.env.SMTP_USER,
        to: recipient,
        subject: 'Your Weekly Mindset Snapshot',
        html,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send snapshot email:', error);
      return false;
    }
  }
}
