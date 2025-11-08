/**
 * Hybrid Router Service
 *
 * Smart routing that tries deterministic agents first,
 * falls back to OpenAI for complex reasoning tasks
 */

import OpenAI from "openai";
import { agentFactory } from "../agents/agent-factory";

interface HybridRequest {
  transcript: string;
  founder: "darnell" | "shria";
  sessionId?: string;
  userId?: string;
}

interface HybridResponse {
  route: "deterministic" | "openai";
  complexity: "simple" | "moderate" | "complex";
  intent?: string;
  humanSummary: string;
  nextBestAction?: string;
  data?: any;
  cost?: number;
  latency?: number;
}

export class HybridRouterService {
  private static instance: HybridRouterService;
  private openai: OpenAI;

  // Keywords for simple intent detection
  private simpleIntents = {
    "block-focus": {
      keywords: [
        "block",
        "focus",
        "deep work",
        "heads down",
        "no interruptions",
      ],
      confidence: 0.95,
    },
    "schedule-meeting": {
      keywords: [
        "schedule",
        "meeting",
        "call",
        "appointment",
        "calendar",
        "book",
      ],
      confidence: 0.95,
    },
    "complete-task": {
      keywords: ["complete", "done", "finished", "check off", "mark done"],
      confidence: 0.95,
    },
    "daily-brief": {
      keywords: [
        "brief",
        "summary",
        "today",
        "how am i doing",
        "productivity",
        "stats",
      ],
      confidence: 0.9,
    },
    "pause-meditation": {
      keywords: ["pause", "break", "meditate", "breathe", "calm", "rest"],
      confidence: 0.9,
    },
    "follow-up": {
      keywords: ["follow up", "remind", "reminder", "remember", "task", "todo"],
      confidence: 0.9,
    },
  };

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "⚠️ OPENAI_API_KEY not configured. OpenAI fallback disabled.",
      );
      this.openai = null as any;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  static getInstance(): HybridRouterService {
    if (!HybridRouterService.instance) {
      HybridRouterService.instance = new HybridRouterService();
    }
    return HybridRouterService.instance;
  }

  /**
   * Main entry point for hybrid routing
   */
  async route(request: HybridRequest): Promise<HybridResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Detect complexity
      const { complexity, intent } = this.detectComplexity(request.transcript);

      // Step 2: Try deterministic agents first for simple/moderate tasks
      if (complexity === "simple" || (complexity === "moderate" && intent)) {
        try {
          const result = await this.tryDeterministicAgent(
            intent || "",
            request,
          );
          if (result) {
            const latency = Date.now() - startTime;
            return {
              route: "deterministic",
              complexity,
              intent,
              humanSummary: result.humanSummary,
              nextBestAction: result.nextBestAction,
              data: result.data,
              cost: 0,
              latency,
            };
          }
        } catch (error) {
          console.error("❌ Deterministic agent failed:", error);
          // Fall through to OpenAI
        }
      }

      // Step 3: Fall back to OpenAI for complex or unmatched requests
      if (!this.openai) {
        return {
          route: "deterministic",
          complexity,
          humanSummary:
            '❌ Request too complex and OpenAI not configured. Try a simpler command like "block focus for 30 minutes"',
          nextBestAction: "Use simple commands or configure OPENAI_API_KEY",
        };
      }

      const result = await this.tryOpenAI(request);
      const latency = Date.now() - startTime;

      return {
        route: "openai",
        complexity,
        humanSummary: result.humanSummary,
        nextBestAction: result.nextBestAction,
        data: result.data,
        cost: result.cost,
        latency,
      };
    } catch (error) {
      console.error("❌ Hybrid routing error:", error);
      const latency = Date.now() - startTime;

      return {
        route: "deterministic",
        complexity: "complex",
        humanSummary:
          "❌ An error occurred processing your request. Please try again.",
        nextBestAction: "Try a simpler command or check your connection",
        latency,
      };
    }
  }

  /**
   * Detect request complexity to decide routing strategy
   */
  private detectComplexity(transcript: string): {
    complexity: "simple" | "moderate" | "complex";
    intent?: string;
  } {
    const lowerTranscript = transcript.toLowerCase().trim();

    // Check for exact intent matches (simple)
    for (const [intent, config] of Object.entries(this.simpleIntents)) {
      const isMatch = config.keywords.some((keyword) =>
        lowerTranscript.includes(keyword),
      );

      if (isMatch) {
        return { complexity: "simple", intent };
      }
    }

    // Check for moderate complexity (identifiable intent but complex parameters)
    if (
      lowerTranscript.includes("how can i") ||
      lowerTranscript.includes("help me") ||
      lowerTranscript.includes("what should i") ||
      lowerTranscript.includes("analyze") ||
      lowerTranscript.includes("suggest")
    ) {
      return { complexity: "moderate" };
    }

    // Open-ended or ambiguous (complex - needs reasoning)
    if (
      lowerTranscript.length > 100 ||
      lowerTranscript.split(" ").length > 20 ||
      lowerTranscript.includes("?") ||
      lowerTranscript.includes("strategy") ||
      lowerTranscript.includes("plan") ||
      lowerTranscript.includes("decide")
    ) {
      return { complexity: "complex" };
    }

    // Default to moderate
    return { complexity: "moderate" };
  }

  /**
   * Try to handle with deterministic agent
   */
  private async tryDeterministicAgent(
    intent: string,
    request: HybridRequest,
  ): Promise<any> {
    // Convert founder name to email
    const founderEmail =
      request.founder === "darnell"
        ? "darnell@elevatedmovements.com"
        : "shria@elevatedmovements.com";

    const intentMap: Record<string, () => Promise<any>> = {
      "block-focus": () =>
        agentFactory.blockFocusTime(
          founderEmail,
          this.extractNumber(request.transcript, 30),
          request.transcript,
        ),

      "schedule-meeting": () =>
        agentFactory.confirmMeeting(
          founderEmail,
          this.extractTitle(request.transcript),
          new Date(),
          this.extractNumber(request.transcript, 30),
        ),

      "complete-task": () =>
        agentFactory.logTaskComplete(
          founderEmail,
          "task-1",
          request.transcript,
        ),

      "daily-brief": () => agentFactory.getDailyBrief(founderEmail),

      "pause-meditation": () =>
        agentFactory.startPause(
          founderEmail,
          "grounding",
          this.extractNumber(request.transcript, 60),
        ),

      "follow-up": () =>
        agentFactory.createFollowUp(
          founderEmail,
          this.extractTitle(request.transcript),
          undefined,
          request.transcript,
        ),
    };

    const handler = intentMap[intent];
    if (!handler) {
      return null;
    }

    return await handler();
  }

  /**
   * Fall back to OpenAI for complex reasoning
   */
  private async tryOpenAI(request: HybridRequest): Promise<{
    humanSummary: string;
    nextBestAction?: string;
    data?: any;
    cost: number;
  }> {
    const systemPrompt = `You are an AI Executive Assistant helping founders and executives with productivity, scheduling, and strategic decisions.

You have access to the following capabilities:
- Block focus time on calendar (30 min - 4 hours)
- Schedule meetings
- Complete tasks and create follow-ups
- Get daily productivity briefs
- Start guided meditation pauses
- Analyze productivity patterns
- Suggest productivity improvements

When the user asks for help, provide:
1. A brief, actionable response (1-2 sentences max)
2. A specific "next best action" they should take
3. Any strategic insights or recommendations

Be concise, professional, and results-oriented. Assume the user is busy.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: request.transcript,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content =
      response.choices[0]?.message?.content || "Unable to process request";

    // Calculate cost (GPT-4: $0.03/1K input, $0.06/1K output)
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = inputTokens * 0.00003 + outputTokens * 0.00006;

    // Split response into summary and next action
    const parts = content.split("\n\n");
    const humanSummary = parts[0] || content;
    const nextBestAction = parts[1] || "Continue with your work";

    return {
      humanSummary: "🤔 " + humanSummary,
      nextBestAction,
      data: {
        model: "gpt-4",
        tokens: { input: inputTokens, output: outputTokens },
      },
      cost,
    };
  }

  /**
   * Extract number from transcript
   */
  private extractNumber(text: string, defaultNum: number = 0): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : defaultNum;
  }

  /**
   * Extract title from transcript
   */
  private extractTitle(text: string): string {
    return text.split(" ").slice(0, 3).join(" ").trim() || "Action Item";
  }
}
