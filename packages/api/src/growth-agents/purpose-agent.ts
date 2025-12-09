/**
 * PurposeAgent - Purpose Pathfinder
 * Ikigai-based purpose discovery with branded purpose cards
 */

import OpenAI from 'openai';
import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { PurposeDeclaration, EM_COLORS } from './types';
import puppeteer from 'puppeteer';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

export class PurposeAgent extends BaseAgent {
  private openai: OpenAI;
  private twilioClient?: twilio.Twilio;
  private mailer: nodemailer.Transporter;
  private purposeDeclaration?: PurposeDeclaration;
  private readonly offline =
    process.env.NODE_ENV === 'test' || process.env.EM_OFFLINE_MODE === 'true' || !process.env.OPENAI_API_KEY;

  constructor(config: AgentConfig) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }

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

  async run(): Promise<AgentResult> {
    const outputs: Record<string, unknown> = {};
    const artifacts: string[] = [];

    try {
      if (this.offline) {
        this.logger.warn('PurposeAgent running in offline/test mode; returning stub data');
        this.purposeDeclaration = {
          statement: 'I empower founders to build sustainable, purpose-driven companies.',
          ikigaiInputs: {
            skills: [],
            passions: [],
            values: [],
            audience: [],
            impact: [],
          },
          cardUrl: 'file:///tmp/purpose-card-offline.pdf',
        };
        return {
          success: true,
          outputs: {
            purposeDeclaration: this.purposeDeclaration.statement,
            affirmationsQueued: 0,
            offline: true,
          },
          artifacts: [this.purposeDeclaration.cardUrl],
        };
      }

      await this.reportProgress(20, 'Conducting Ikigai Q&A');

      // Conduct Ikigai questions
      const ikigaiInputs = await this.conductIkigaiQA();
      outputs.ikigaiInputs = ikigaiInputs;

      await this.reportProgress(40, 'Synthesizing purpose declaration');

      // Generate purpose declaration
      this.purposeDeclaration = await this.synthesizePurpose(ikigaiInputs);
      outputs.purposeDeclaration = this.purposeDeclaration.statement;

      await this.reportProgress(60, 'Rendering purpose card');

      // Generate purpose card PDF
      const cardUrl = await this.renderPurposeCard(this.purposeDeclaration);
      this.purposeDeclaration.cardUrl = cardUrl;
      artifacts.push(cardUrl);

      await this.reportProgress(80, 'Queueing daily affirmations');

      // Queue 7 daily affirmations
      const messagesQueued = await this.queueAffirmations(this.purposeDeclaration.statement);
      outputs.affirmationsQueued = messagesQueued;

      await this.emitEvent('purpose_complete', {
        purposeStatement: this.purposeDeclaration.statement,
        cardUrl,
        affirmationsQueued: messagesQueued,
      });

      return {
        success: true,
        outputs,
        artifacts,
      };
    } catch (error) {
      this.logger.error('PurposeAgent run failed:', error);
      return {
        success: false,
        outputs,
        artifacts,
        errors: [(error as Error).message],
      };
    }
  }

  async validate(): Promise<boolean> {
    if (!this.purposeDeclaration || !this.purposeDeclaration.statement) {
      this.logger.error('Validation failed: No purpose declaration generated');
      return false;
    }

    if (!this.purposeDeclaration.cardUrl) {
      this.logger.error('Validation failed: No purpose card generated');
      return false;
    }

    this.logger.info('Validation passed: Purpose declaration and card generated');
    return true;
  }

  private async conductIkigaiQA(): Promise<{
    skills: string[];
    passions: string[];
    values: string[];
    audience: string[];
    impact: string[];
  }> {
    // Simulated Ikigai inputs
    return {
      skills: ['AI development', 'Strategic thinking', 'Community building'],
      passions: ['Empowering founders', 'Sustainable productivity', 'Mindful leadership'],
      values: ['Integrity', 'Impact', 'Innovation', 'Harmony'],
      audience: ['Conscious founders', 'Purpose-driven leaders', 'Change-makers'],
      impact: ['Reduce burnout', 'Enable sustainable growth', 'Foster well-being'],
    };
  }

  private async synthesizePurpose(inputs: {
    skills: string[];
    passions: string[];
    values: string[];
    audience: string[];
    impact: string[];
  }): Promise<PurposeDeclaration> {
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Based on Ikigai inputs, craft a single-sentence purpose declaration. It should be inspiring, clear, and actionable. Return JSON with: statement (the declaration).',
        },
        {
          role: 'user',
          content: JSON.stringify(inputs),
        },
      ],
    });

    const content = completion.choices[0].message.content || '{}';
    let result: any = {};
    try {
      result = JSON.parse(content);
    } catch (error) {
      this.logger.warn('Failed to parse purpose declaration JSON; using fallback', error);
    }

    return {
      statement:
        result.statement ||
        'I empower conscious founders to build sustainable businesses that create meaningful impact.',
      ikigaiInputs: inputs,
    };
  }

  private async renderPurposeCard(declaration: PurposeDeclaration): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, ${EM_COLORS.primary}, ${EM_COLORS.secondary});
              font-family: 'Georgia', serif;
            }
            .card {
              background: white;
              padding: 60px;
              border-radius: 20px;
              max-width: 600px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
            }
            h1 {
              color: ${EM_COLORS.primary};
              font-size: 24px;
              margin-bottom: 30px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .statement {
              font-size: 32px;
              line-height: 1.5;
              color: ${EM_COLORS.dark};
              font-style: italic;
            }
            .footer {
              margin-top: 40px;
              color: ${EM_COLORS.neutral};
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>My Purpose</h1>
            <p class="statement">"${declaration.statement}"</p>
            <div class="footer">Elevated Movements</div>
          </div>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html);

    const timestamp = Date.now();
    const pdfPath = `/app/data/purpose-card-${timestamp}.pdf`;
    await page.pdf({
      path: pdfPath,
      width: '8.5in',
      height: '11in',
      printBackground: true,
    });
    await browser.close();

    this.logger.info(`Purpose card generated: ${pdfPath}`);
    return `file://${pdfPath}`;
  }

  private async queueAffirmations(statement: string): Promise<number> {
    const affirmations = [
      `Day 1: ${statement}`,
      `Day 2: I am aligned with my purpose.`,
      `Day 3: My work creates meaningful impact.`,
      `Day 4: I lead with integrity and vision.`,
      `Day 5: I build sustainable, purpose-driven ventures.`,
      `Day 6: My purpose guides every decision.`,
      `Day 7: I am a conscious, empowered founder.`,
    ];

    let queued = 0;

    for (const affirmation of affirmations) {
      try {
        // Try email first
        await this.mailer.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.GMAIL_SENDER_ADDRESS || process.env.SMTP_USER,
          subject: 'Your Daily Purpose Affirmation',
          text: affirmation,
        });

        queued++;
        this.logger.info(`Queued affirmation via email: ${affirmation.substring(0, 30)}...`);
      } catch (error) {
        this.logger.warn('Failed to queue affirmation via email:', error);
      }

      // If Twilio is configured, send SMS (commented out to avoid costs in testing)
      // if (this.twilioClient && process.env.TWILIO_FROM_NUMBER) {
      //   try {
      //     await this.twilioClient.messages.create({
      //       from: process.env.TWILIO_FROM_NUMBER,
      //       to: process.env.FOUNDER_PHONE_NUMBER || '',
      //       body: affirmation,
      //     });
      //     this.logger.info(`Queued affirmation via SMS`);
      //   } catch (error) {
      //     this.logger.warn('Failed to queue affirmation via SMS:', error);
      //   }
      // }
    }

    return queued;
  }
}
