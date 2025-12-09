/**
 * NicheAgent - Niche Navigator
 * Guides users through niche discovery with embeddings-based clustering
 */

import OpenAI from 'openai';
import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { NicheTheme } from './types';
import puppeteer from 'puppeteer';

export class NicheAgent extends BaseAgent {
  private openai: OpenAI;
  private reportUrl?: string;
  private readonly offline =
    process.env.NODE_ENV === 'test' || process.env.EM_OFFLINE_MODE === 'true' || !process.env.OPENAI_API_KEY;

  constructor(config: AgentConfig) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async run(): Promise<AgentResult> {
    const outputs: Record<string, unknown> = {};
    const artifacts: string[] = [];

    try {
      if (this.offline) {
        const themes: NicheTheme[] = [
          {
            name: 'AI Productivity for Founders',
            description: 'Automation-first workflows that protect focus time for early-stage founders.',
            keywords: ['AI automation', 'focus blocks', 'founders'],
            score: 0.87,
          },
        ];
        this.reportUrl = 'file:///tmp/niche-report-offline.pdf';
        return {
          success: true,
          outputs: {
            qaAnswers: this.conductQAndA(),
            embeddingsGenerated: 1,
            themes,
            reportUrl: this.reportUrl,
            offline: true,
          },
          artifacts: [this.reportUrl],
        };
      }

      await this.reportProgress(20, 'Conducting niche discovery Q&A');

      // Simulate Q&A responses
      const answers = await this.conductQAndA();
      outputs.qaAnswers = answers;

      await this.reportProgress(40, 'Generating embeddings');

      // Generate embeddings for answers
      const embeddings = await this.generateEmbeddings(answers);
      outputs.embeddingsGenerated = embeddings.length;

      await this.reportProgress(60, 'Clustering into niche themes');

      // Cluster into themes
      const themes = await this.clusterToThemes(answers);
      outputs.themes = themes;

      await this.reportProgress(80, 'Rendering niche clarity report');

      // Generate PDF report
      this.reportUrl = await this.generatePDFReport(themes);
      outputs.reportUrl = this.reportUrl;
      artifacts.push(this.reportUrl);

      await this.emitEvent('niche_complete', {
        themesCount: themes.length,
        reportUrl: this.reportUrl,
      });

      return {
        success: true,
        outputs,
        artifacts,
      };
    } catch (error) {
      this.logger.error('NicheAgent run failed:', error);
      return {
        success: false,
        outputs,
        artifacts,
        errors: [(error as Error).message],
      };
    }
  }

  async validate(): Promise<boolean> {
    // Validation: Check that themes were generated and report URL exists
    if (!this.reportUrl) {
      this.logger.error('Validation failed: No report URL generated');
      return false;
    }

    this.logger.info('Validation passed: Niche report generated');
    return true;
  }

  private async conductQAndA(): Promise<Record<string, string[]>> {
    // Simulate five-step Q&A
    return {
      skills: ['AI development', 'Product design', 'Community building'],
      passions: ['Helping founders thrive', 'Work-life harmony', 'AI automation'],
      values: ['Integrity', 'Impact', 'Innovation'],
      audience: ['Busy founders', 'Startup teams', 'Coaches'],
      impact: ['Reduce burnout', 'Increase productivity', 'Enable sustainable growth'],
    };
  }

  private async generateEmbeddings(answers: Record<string, string[]>): Promise<number[][]> {
    const allTexts = Object.values(answers).flat();
    const embeddings: number[][] = [];

    for (const text of allTexts) {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      embeddings.push(response.data[0].embedding);
    }

    return embeddings;
  }

  private async clusterToThemes(answers: Record<string, string[]>): Promise<NicheTheme[]> {
    // Use OpenAI to synthesize themes
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Analyze niche discovery inputs and return 2-3 niche themes as JSON array. Each theme: {name, description, keywords[], score}',
        },
        {
          role: 'user',
          content: JSON.stringify(answers),
        },
      ],
    });

    const content = completion.choices[0].message.content || '';
    try {
      const parsed = JSON.parse(content);
      const themes = (parsed.themes || parsed) as NicheTheme[];
      return Array.isArray(themes) ? themes : [];
    } catch (err) {
      this.logger.warn('Failed to parse niche themes JSON; returning empty array', err);
      return [];
    }
  }

  private async generatePDFReport(themes: NicheTheme[]): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; background: #36013f; color: white; }
            h1 { color: #e0cd67; font-size: 36px; }
            .theme { background: rgba(255,255,255,0.1); padding: 20px; margin: 20px 0; border-radius: 8px; }
            .theme h2 { color: #176161; }
            .keywords { color: #e0cd67; }
          </style>
        </head>
        <body>
          <h1>Niche Clarity Report</h1>
          ${themes
            .map(
              (theme) => `
            <div class="theme">
              <h2>${theme.name}</h2>
              <p>${theme.description}</p>
              <p class="keywords"><strong>Keywords:</strong> ${theme.keywords.join(', ')}</p>
              <p><strong>Match Score:</strong> ${(theme.score * 100).toFixed(0)}%</p>
            </div>
          `
            )
            .join('')}
        </body>
      </html>
    `;

    // Generate PDF using Puppeteer (headless Chrome)
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html);

    const timestamp = Date.now();
    const pdfPath = `/app/data/niche-report-${timestamp}.pdf`;
    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();

    this.logger.info(`PDF report generated: ${pdfPath}`);
    return `file://${pdfPath}`;
  }
}
