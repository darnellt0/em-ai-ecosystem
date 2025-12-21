/**
 * EmailTool - P1 Integration
 * Provides send_followup action for P1 agents
 *
 * Input/Output Contract:
 * - send_followup: { to, subject, html, text?, cc?, bcc?, from? }
 *
 * Returns: { success, data, error }
 */

import { ToolRequest, ToolResult } from './tool.types';
import { emailService } from '../services/email.service';
import type { SendEmailOptions } from '../services/email.service';

const logger = console;

export async function handleEmailSendFollowup(req: ToolRequest): Promise<ToolResult> {
  const { to, subject, html, text, cc, bcc, from } = req.input || {};

  // Validate required fields
  if (!to || !subject || !html) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Missing required fields: to, subject, html',
        details: req.input,
      },
    };
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recipients = Array.isArray(to) ? to : [to];
  const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
  if (invalidEmails.length > 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: `Invalid email format: ${invalidEmails.join(', ')}`,
        details: { invalidEmails },
      },
    };
  }

  try {
    const options: SendEmailOptions = {};
    if (text) options.text = text;
    if (cc) options.cc = cc;
    if (bcc) options.bcc = bcc;
    if (from) options.from = from;

    const result = await emailService.sendEmail(to, subject, html, options);

    if (!result.success) {
      logger.error('[EmailTool] Send failed', { error: result.error, to, subject });
      return {
        ok: false,
        error: {
          code: 'TOOL_ERROR',
          message: result.error || 'Failed to send email',
          details: result,
        },
      };
    }

    logger.info('[EmailTool] Follow-up sent', {
      messageId: result.messageId,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
    });

    return {
      ok: true,
      output: {
        success: true,
        data: {
          messageId: result.messageId,
          to,
          subject,
        },
      },
    };
  } catch (err: any) {
    logger.error('[EmailTool] Unexpected error', { error: err.message, to, subject });
    return {
      ok: false,
      error: {
        code: 'TOOL_ERROR',
        message: err.message || 'Failed to send email',
        details: err,
      },
    };
  }
}
