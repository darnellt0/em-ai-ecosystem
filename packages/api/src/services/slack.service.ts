/**
 * Slack Notification Service - Phase 2B Integration
 * Handles Slack notifications via Web API
 */

import { WebClient, ChatPostMessageArguments } from "@slack/web-api";

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: any[];
  [key: string]: any;
}

export class SlackService {
  private client: WebClient | null = null;
  private logger = console;
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const botToken = process.env.SLACK_BOT_TOKEN;

      if (!botToken) {
        this.logger.warn(
          "[Slack Service] No SLACK_BOT_TOKEN found in environment",
        );
        return;
      }

      this.client = new WebClient(botToken);
      this.isConfigured = true;

      this.logger.info("[Slack Service] Slack client initialized successfully");
    } catch (error) {
      this.logger.error("[Slack Service] Initialization error:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Send a message to a Slack user
   */
  async sendMessage(
    userId: string,
    text: string,
    blocks?: SlackBlock[],
  ): Promise<{ ts: string; success: boolean }> {
    if (!this.isConfigured || !this.client) {
      this.logger.warn(
        `[Slack Service] Slack not configured. Would send to ${userId}: ${text}`,
      );
      return {
        ts: `${Date.now()}`,
        success: true,
      };
    }

    try {
      this.logger.info(`[Slack Service] Sending message to user ${userId}`);

      const messageArgs: any = {
        channel: userId,
        text,
      };

      if (blocks && blocks.length > 0) {
        messageArgs.blocks = blocks;
      }

      const result = await this.client.chat.postMessage(messageArgs);

      if (!result.ok || !result.ts) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      this.logger.info(
        `[Slack Service] Message sent successfully: ${result.ts}`,
      );

      return {
        ts: result.ts,
        success: true,
      };
    } catch (error) {
      this.logger.error("[Slack Service] Send error:", error);
      return {
        ts: "",
        success: false,
      };
    }
  }

  /**
   * Lookup Slack user by email
   */
  async getUserByEmail(email: string): Promise<string | null> {
    if (!this.isConfigured || !this.client) {
      this.logger.warn(
        `[Slack Service] Slack not configured. Would lookup ${email}`,
      );
      return null;
    }

    try {
      this.logger.info(`[Slack Service] Looking up user by email: ${email}`);

      const result = await this.client.users.lookupByEmail({
        email,
      });

      if (!result.ok || !result.user?.id) {
        this.logger.warn(`[Slack Service] User not found for email: ${email}`);
        return null;
      }

      this.logger.info(`[Slack Service] Found user: ${result.user.id}`);

      return result.user.id;
    } catch (error) {
      this.logger.error("[Slack Service] Lookup error:", error);
      return null;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(
    userId: string,
  ): Promise<{ name: string; email?: string } | null> {
    if (!this.isConfigured || !this.client) {
      this.logger.warn(
        `[Slack Service] Slack not configured. Would get info for ${userId}`,
      );
      return null;
    }

    try {
      const result = await this.client.users.info({
        user: userId,
      });

      if (!result.ok || !result.user) {
        return null;
      }

      return {
        name: result.user.real_name || result.user.name || "",
        email: result.user.profile?.email,
      };
    } catch (error) {
      this.logger.error("[Slack Service] User info error:", error);
      return null;
    }
  }

  /**
   * Task completion block template
   */
  getTaskCompleteBlocks(
    taskTitle: string,
    nextTaskTitle?: string,
  ): SlackBlock[] {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✅ Task Completed!",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Completed:*\n${taskTitle}`,
          },
        ],
      },
    ];

    if (nextTaskTitle) {
      blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Next Priority:*\n${nextTaskTitle}`,
          },
        ],
      });
    }

    blocks.push({
      type: "divider",
    });

    return blocks;
  }

  /**
   * Follow-up reminder block template
   */
  getReminderBlocks(subject: string, dueDate?: string): SlackBlock[] {
    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⏰ Reminder",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Follow-up:*\n${subject}`,
          },
          ...(dueDate
            ? [
                {
                  type: "mrkdwn",
                  text: `*Due:*\n${dueDate}`,
                },
              ]
            : []),
        ],
      },
      {
        type: "divider",
      },
    ];
  }

  /**
   * Meeting update block template
   */
  getMeetingBlocks(
    meetingTitle: string,
    newTime?: string,
    attendees?: string[],
  ): SlackBlock[] {
    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📅 Meeting Updated",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Meeting:*\n${meetingTitle}`,
          },
          ...(newTime
            ? [
                {
                  type: "mrkdwn",
                  text: `*New Time:*\n${newTime}`,
                },
              ]
            : []),
        ],
      },
    ];

    if (attendees && attendees.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Attendees:*\n${attendees.join(", ")}`,
        },
      });
    }

    blocks.push({
      type: "divider",
    });

    return blocks;
  }

  /**
   * Focus block confirmation block template
   */
  getFocusBlockBlocks(
    reason: string,
    duration: number,
    startTime: string,
  ): SlackBlock[] {
    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎯 Focus Block Confirmed",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Duration:*\n${duration} minutes`,
          },
          {
            type: "mrkdwn",
            text: `*Reason:*\n${reason}`,
          },
          {
            type: "mrkdwn",
            text: `*Start Time:*\n${startTime}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "All notifications have been silenced. Focus on your work! 💪",
        },
      },
      {
        type: "divider",
      },
    ];
  }

  /**
   * Pause/Meditation session block template
   */
  getPauseSessionBlocks(style: string, duration: number): SlackBlock[] {
    const styleEmoji: Record<string, string> = {
      breath: "🌬️",
      box: "📦",
      grounding: "🌍",
      "body-scan": "🧘",
    };

    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${styleEmoji[style] || "🧘"} Pause Session Started`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Style:*\n${style}`,
          },
          {
            type: "mrkdwn",
            text: `*Duration:*\n${duration} seconds`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Take a few moments to breathe and reset. You've got this! ✨",
        },
      },
      {
        type: "divider",
      },
    ];
  }

  /**
   * Send blocks with fallback text
   */
  async sendBlockMessage(
    userId: string,
    blocks: SlackBlock[],
    fallbackText: string,
  ): Promise<{ ts: string; success: boolean }> {
    return this.sendMessage(userId, fallbackText, blocks);
  }

  /**
   * Verify bot credentials
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.auth.test();
      if (result.ok) {
        this.logger.info(
          `[Slack Service] Connection verified. Bot: ${result.user_id}`,
        );
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(
        "[Slack Service] Connection verification failed:",
        error,
      );
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    botUserId?: string;
    warning?: string;
  } {
    return {
      configured: this.isConfigured,
      warning: !this.isConfigured
        ? "Slack service not configured. Add SLACK_BOT_TOKEN to .env"
        : undefined,
    };
  }
}

// Export singleton instance
export const slackService = new SlackService();
