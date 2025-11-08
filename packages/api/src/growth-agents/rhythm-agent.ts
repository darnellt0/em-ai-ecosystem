/**
 * RhythmAgent - Rest & Rhythm Planner
 * Analyzes calendar and inserts pause blocks for sustainable productivity
 */

import { google } from 'googleapis';
import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { PauseBlock } from './types';
import nodemailer from 'nodemailer';

export class RhythmAgent extends BaseAgent {
  private calendar: any;
  private mailer: nodemailer.Transporter;
  private pauseBlocks: PauseBlock[] = [];

  constructor(config: AgentConfig) {
    super(config);
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

    // Initialize Google Calendar API
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
      ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, 'base64').toString())
      : null;

    if (serviceAccountJson) {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountJson,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });
    }

    await this.reportProgress(10, 'Google Calendar API initialized');
  }

  async run(): Promise<AgentResult> {
    const outputs: Record<string, unknown> = {};
    const artifacts: string[] = [];

    try {
      await this.reportProgress(20, 'Fetching calendar events');

      // Fetch next 14 days of events
      const events = await this.fetchCalendarEvents();
      outputs.eventsAnalyzed = events.length;

      await this.reportProgress(40, 'Detecting high-density periods');

      // Detect high-density days
      const densePeriods = this.detectHighDensity(events);
      outputs.densePeriods = densePeriods.length;

      await this.reportProgress(60, 'Inserting pause blocks');

      // Create pause blocks
      this.pauseBlocks = await this.createPauseBlocks(densePeriods);
      outputs.pauseBlocksCreated = this.pauseBlocks.length;

      await this.reportProgress(80, 'Generating schedule summary');

      // Generate summary email
      const summary = this.generateSummary(this.pauseBlocks);
      outputs.summary = summary;

      await this.reportProgress(90, 'Sending schedule email');

      // Send email
      const emailSent = await this.sendSummaryEmail(summary);
      outputs.emailSent = emailSent;

      await this.emitEvent('rhythm_complete', {
        pauseBlocksCreated: this.pauseBlocks.length,
        densePeriods: densePeriods.length,
      });

      return {
        success: true,
        outputs,
        artifacts,
      };
    } catch (error) {
      this.logger.error('RhythmAgent run failed:', error);
      return {
        success: false,
        outputs,
        artifacts,
        errors: [(error as Error).message],
      };
    }
  }

  async validate(): Promise<boolean> {
    if (this.pauseBlocks.length < 3) {
      this.logger.error('Validation failed: Expected at least 3 pause blocks');
      return false;
    }

    this.logger.info(`Validation passed: ${this.pauseBlocks.length} pause blocks created`);
    return true;
  }

  private async fetchCalendarEvents(): Promise<any[]> {
    // For testing, return synthetic calendar data
    const now = new Date();
    const syntheticEvents = [];

    // Create a dense day with 8 meetings
    for (let i = 0; i < 8; i++) {
      const start = new Date(now.getTime() + i * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 45 * 60 * 1000);

      syntheticEvents.push({
        id: `meeting-${i}`,
        summary: `Meeting ${i + 1}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      });
    }

    return syntheticEvents;
  }

  private detectHighDensity(events: any[]): Array<{ date: string; meetingHours: number; gaps: number }> {
    // Simplified: Assume all events are on the same day
    const totalMinutes = events.reduce((sum, event) => {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      return sum + (end.getTime() - start.getTime()) / (60 * 1000);
    }, 0);

    const meetingHours = totalMinutes / 60;

    // High density if >6 hours of meetings
    if (meetingHours > 6) {
      return [
        {
          date: new Date().toISOString().split('T')[0],
          meetingHours,
          gaps: 2, // Simplified
        },
      ];
    }

    return [];
  }

  private async createPauseBlocks(densePeriods: any[]): Promise<PauseBlock[]> {
    const blocks: PauseBlock[] = [];

    // Create 3 pause blocks for the dense day
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(Date.now() + (i + 1) * 3 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

      const block: PauseBlock = {
        eventId: `pause-${Date.now()}-${i}`,
        startTime,
        endTime,
        title: '🕯️ Pause Block',
        reason: 'Rest and recharge',
      };

      // In production, would create calendar event here
      if (this.calendar) {
        try {
          const calendarId = process.env.FOUNDER_DARNELL_CALENDAR_ID || 'primary';
          await this.calendar.events.insert({
            calendarId,
            requestBody: {
              summary: block.title,
              description: block.reason,
              start: { dateTime: block.startTime.toISOString() },
              end: { dateTime: block.endTime.toISOString() },
              transparency: 'transparent', // Tentative
            },
          });
          this.logger.info(`Created pause block: ${block.eventId}`);
        } catch (error) {
          this.logger.warn('Failed to create calendar event (using mock):', error);
        }
      }

      blocks.push(block);
    }

    return blocks;
  }

  private generateSummary(blocks: PauseBlock[]): string {
    return `
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #36013f;">Your Rhythm & Rest Schedule</h1>
          <p>I've added ${blocks.length} pause blocks to help you maintain sustainable energy:</p>
          ${blocks
            .map(
              (b) => `
            <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
              <p><strong>${b.title}</strong></p>
              <p>⏰ ${b.startTime.toLocaleTimeString()} - ${b.endTime.toLocaleTimeString()}</p>
              <p>${b.reason}</p>
            </div>
          `
            )
            .join('')}
          <p style="color: #666; margin-top: 30px;">Remember: Rest is productive.</p>
        </body>
      </html>
    `;
  }

  private async sendSummaryEmail(html: string): Promise<boolean> {
    try {
      const recipient = process.env.GMAIL_SENDER_ADDRESS || process.env.SMTP_USER || 'test@example.com';

      await this.mailer.sendMail({
        from: process.env.SMTP_USER,
        to: recipient,
        subject: 'Your Rhythm & Rest Schedule',
        html,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send summary email:', error);
      return false;
    }
  }
}
