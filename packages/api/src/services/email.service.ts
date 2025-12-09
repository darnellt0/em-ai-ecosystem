/**
 * Email Delivery Service - Phase 2B Issue 5
 * Handles outbound email via SMTP (HTML-first, with plain text fallback)
 */

import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailTemplate {
  taskTitle?: string;
  nextTaskTitle?: string;
  meetingTitle?: string;
  newTime?: string;
  dueDate?: string;
  subject?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private logger = console;
  private isConfigured = false;
  private provider?: string;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        this.isConfigured = false;
        this.logger.error(
          '[Email Service] Missing SMTP configuration. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS'
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.isConfigured = true;
      this.provider = smtpHost;
      this.logger.info('[Email Service] Configured with SMTP server');
    } catch (error) {
      this.logger.error('[Email Service] Initialization error:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email (HTML first, with optional cc/bcc)
   * @example
   * await emailService.sendEmail('user@example.com', 'Subject', '<p>Hello</p>', { cc: ['team@example.com'] });
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    options: SendEmailOptions = {}
  ): Promise<SendResult> {
    if (!this.isConfigured || !this.transporter) {
      const errorMessage =
        '[Email Service] Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS';
      this.logger.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      this.logger.info(`[Email Service] Sending email to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);

      const info = await this.transporter.sendMail({
        from:
          options.from ||
          process.env.EMAIL_FROM ||
          `noreply@${(process.env.SMTP_HOST || 'elevatedmovements.com').replace(/:.*/, '')}`,
        to,
        cc: options.cc,
        bcc: options.bcc,
        subject,
        text: options.text || this.stripHtml(html),
        html,
      });

      this.logger.info(`[Email Service] Email sent successfully: ${info.messageId}`);

      return {
        messageId: info.messageId || '',
        success: true,
      };
    } catch (error) {
      this.logger.error('[Email Service] Send error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Backwards-compatible helper used by agents (delegates to sendEmail)
   */
  async sendNotification(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<SendResult> {
    return this.sendEmail(to, subject, html, { text });
  }

  /**
   * Task completion template
   */
  getTaskCompleteTemplate(data: EmailTemplate): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
            .task-item { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0; }
            .next-task { background-color: white; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Task Completed!</h2>
            </div>
            <div class="content">
              <p>Great work! You have successfully completed:</p>
              <div class="task-item">
                <strong>${data.taskTitle || 'Task'}</strong>
              </div>

              ${data.nextTaskTitle ? `
                <p style="margin-top: 20px;">Your next priority is:</p>
                <div class="next-task">
                  <strong>${data.nextTaskTitle}</strong>
                </div>
              ` : ''}

              <p style="margin-top: 20px; font-style: italic; color: #666;">
                This notification was sent by Elevated Movements Voice Assistant.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Elevated Movements. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Follow-up reminder template
   */
  getReminderTemplate(data: EmailTemplate): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
            .reminder-item { background-color: white; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⏰ Reminder</h2>
            </div>
            <div class="content">
              <p>You have a follow-up reminder:</p>
              <div class="reminder-item">
                <strong>${data.subject || 'Follow-up'}</strong>
                ${data.dueDate ? `<p>Due: ${data.dueDate}</p>` : ''}
              </div>

              <p style="margin-top: 20px; font-style: italic; color: #666;">
                This notification was sent by Elevated Movements Voice Assistant.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Elevated Movements. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Meeting update template
   */
  getMeetingTemplate(data: EmailTemplate): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
            .meeting-item { background-color: white; padding: 15px; border-left: 4px solid #FF9800; margin: 10px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📅 Meeting Updated</h2>
            </div>
            <div class="content">
              <p>Your meeting has been rescheduled:</p>
              <div class="meeting-item">
                <strong>${data.meetingTitle || 'Meeting'}</strong>
                ${data.newTime ? `<p>New time: ${data.newTime}</p>` : ''}
              </div>

              <p style="margin-top: 20px; font-style: italic; color: #666;">
                This notification was sent by Elevated Movements Voice Assistant.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Elevated Movements. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Focus block confirmation template
   */
  getFocusBlockTemplate(data: { reason: string; duration: number; startTime: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C27B0; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-top: 20px; }
            .block-item { background-color: white; padding: 15px; border-left: 4px solid #9C27B0; margin: 10px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎯 Focus Block Confirmed</h2>
            </div>
            <div class="content">
              <p>Your focus block has been created:</p>
              <div class="block-item">
                <strong>Duration:</strong> ${data.duration} minutes<br/>
                <strong>Reason:</strong> ${data.reason}<br/>
                <strong>Start Time:</strong> ${data.startTime}
              </div>

              <p style="margin-top: 20px;">
                All notifications have been silenced. Focus on your work!
              </p>

              <p style="margin-top: 20px; font-style: italic; color: #666;">
                This notification was sent by Elevated Movements Voice Assistant.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Elevated Movements. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Verify transporter connectivity
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.info('[Email Service] Connection verified');
      return true;
    } catch (error) {
      this.logger.error('[Email Service] Connection verification failed:', error);
      return false;
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    provider?: string;
    warning?: string;
  } {
    return {
      configured: this.isConfigured,
      provider: this.provider,
      warning: !this.isConfigured
        ? 'Email service not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to .env'
        : undefined,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
