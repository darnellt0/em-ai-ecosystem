import { slackService } from '../services/slack.service';
import { ToolHandler } from './tool.types';

export const postCaptureNoteHandler: ToolHandler = async (req) => {
  const channelId = req.input?.channelId || process.env.CAPTURE_CHANNEL_ID;
  const summary = req.input?.summary || req.input?.text;

  if (!summary) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'summary is required' } };
  }

  if (!process.env.SLACK_BOT_TOKEN || !channelId) {
    return {
      ok: true,
      output: { noop: true, reason: 'Slack not configured', summary },
    };
  }

  const result = await slackService.sendMessage(channelId, summary);
  if (!result.success) {
    return { ok: false, error: { code: 'SLACK_ERROR', message: 'Slack post failed' } };
  }

  return { ok: true, output: { ts: result.ts, channelId } };
};
