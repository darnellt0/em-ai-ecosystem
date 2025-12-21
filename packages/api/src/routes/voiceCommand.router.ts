import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { JournalIntent } from '../../../agents/journal';
import { listP0ArtifactRuns } from '../services/p0RunHistory.service';
import { executeJournalWithHistory, formatJournalPromptsForVoice } from '../services/journalExecution.service';
import { runP0DailyBriefExecAdmin } from '../exec-admin/flows/p0-daily-brief';
import { runP0DailyFocusExecAdmin } from '../exec-admin/flows/p0-daily-focus';
import { buildVoiceCommand, getHelpCommands } from '../services/voiceCommandRouter.service';
import {
  createPendingConfirmation,
  resolvePendingConfirmation,
  getPendingConfirmation,
} from '../services/voiceCommandConfirmation.service';
import {
  createPendingFollowUp,
  getPendingFollowUp,
  resolvePendingFollowUp,
} from '../services/voiceCommandFollowUp.service';
import {
  recordVoiceCommandHistory,
  listVoiceCommandHistory,
  getVoiceCommandHistoryRecord,
} from '../services/voiceCommandHistory.service';
import { createScheduleRequest } from '../services/scheduleRequest.service';
import { VoiceCommand } from '../types/voiceCommand';

const voiceCommandRouter = Router();

const JOURNAL_KIND = 'p0.journal';
const JOURNAL_ALLOWED_USERS = new Set(['darnell', 'shria']);

interface TranscribeRequest {
  text?: string;
}

interface CommandRequest {
  user: string;
  text: string;
}

interface TurnRequest {
  user: string;
  text: string;
}

interface ConfirmRequest {
  user: string;
  confirmationId: string;
  answer: 'yes' | 'no';
}

interface FollowUpRequest {
  user: string;
  followUpId: string;
  text: string;
}

interface TurnResponse {
  status: 'ok' | 'error';
  transcript: string;
  assistant: {
    kind: string;
    text: string;
    runId?: string;
    metadata?: Record<string, any>;
    artifact?: unknown;
  };
}

async function runJournalCommand(user: 'darnell' | 'shria', intent: JournalIntent, date?: string) {
  return executeJournalWithHistory({ user, intent, date });
}

function filterRunsByDate(items: { createdAt: string }[], date?: string, dateRange?: { start: string; end: string }) {
  if (date) {
    return items.filter((item) => item.createdAt.slice(0, 10) === date);
  }
  if (dateRange) {
    return items.filter((item) => {
      const day = item.createdAt.slice(0, 10);
      return day >= dateRange.start && day <= dateRange.end;
    });
  }
  return items;
}

async function getSystemStatus() {
  const api = {
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  let redisStatus: { status: string } = { status: 'not_configured' };
  if (process.env.REDIS_URL) {
    try {
      const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
      await redis.connect();
      const pong = await redis.ping();
      await redis.quit();
      redisStatus = { status: pong === 'PONG' ? 'ok' : 'error' };
    } catch (error) {
      redisStatus = { status: 'error' };
    }
  }

  let workerStatus: Record<string, any> = {
    status: process.env.ENABLE_GROWTH_AGENTS === 'true' ? 'unknown' : 'disabled',
  };

  if (process.env.ENABLE_GROWTH_AGENTS === 'true') {
    try {
      const { orchestrator } = await import('../growth-agents/orchestrator');
      const health = await orchestrator.getHealth();
      workerStatus = {
        status: health.workers > 0 ? 'active' : 'idle',
        workers: health.workers,
        queue: health.queue,
      };
    } catch (error) {
      workerStatus = { status: 'error' };
    }
  }

  return { api, redis: redisStatus, worker: workerStatus };
}

function buildResultSummary(command: VoiceCommand, result?: any) {
  switch (command.action) {
    case 'run_intent':
      return `Ran ${command.intent || 'intent'}${result?.runId ? ` (${result.runId})` : ''}`;
    case 'show_runs':
      return `Listed ${result?.items?.length || 0} journal runs`;
    case 'help':
      return 'Provided command help';
    case 'status':
      return 'Checked system status';
    case 'schedule':
      return `Created schedule request${result?.requestId ? ` (${result.requestId})` : ''}`;
    case 'unknown':
      return 'Unknown command';
    case 'confirm_required':
      return 'Confirmation requested';
    default:
      return 'Command processed';
  }
}

function buildTurnReply(command: VoiceCommand, payload: { result?: any; confirmationId?: string; followUp?: any }) {
  if (payload.followUp?.prompt) return payload.followUp.prompt;
  if (command.requiresConfirmation && command.confirmationPrompt) return command.confirmationPrompt;
  if (payload.result?.message) return payload.result.message;
  if (command.action === 'show_runs') {
    const count = payload.result?.items?.length ?? 0;
    return `Found ${count} journal run${count === 1 ? '' : 's'}.`;
  }
  if (command.action === 'help' && payload.result?.summary) return payload.result.summary;
  if (command.action === 'status' && payload.result?.api?.status) return `System status: ${payload.result.api.status}.`;
  if (command.action === 'run_intent' && command.intent) return `Ran ${command.intent}.`;
  return 'Done.';
}

async function executeVoiceCommand(command: VoiceCommand) {
  switch (command.action) {
    case 'run_intent': {
      if (command.intent?.startsWith('journal.')) {
        const intent = command.intent as JournalIntent;
        const result = await runJournalCommand(command.user as 'darnell' | 'shria', intent, command.input?.date);
        return { result, runId: result.runId };
      }

      if (command.intent === 'p0.daily_brief') {
        const brief = await runP0DailyBriefExecAdmin({
          user: command.user as 'darnell' | 'shria',
          date: command.input?.date,
        });
        return { result: brief, runId: brief.runId };
      }

      if (command.intent === 'p0.daily_focus') {
        const result = await runP0DailyFocusExecAdmin({
          userId: command.user,
          mode: command.input?.mode,
          force: true,
        });
        return { result, runId: result.runId };
      }

      return {
        result: {
          message: 'Intent not implemented yet',
          intent: command.intent,
          nextStep: 'Add exec-admin integration for this intent.',
        },
      };
    }
    case 'show_runs': {
      const rawItems = listP0ArtifactRuns({ kind: JOURNAL_KIND, limit: 50 });
      const items = filterRunsByDate(rawItems, command.input?.date, command.input?.dateRange);
      return { result: { items, limit: items.length } };
    }
    case 'help': {
      return { result: getHelpCommands() };
    }
    case 'status': {
      const status = await getSystemStatus();
      return { result: status };
    }
    case 'schedule': {
      const request = createScheduleRequest(command);
      return {
        result: {
          requestId: request.id,
          message: 'Schedule request recorded. Import/update workflow manually in n8n.',
          manualStepRequired: true,
        },
      };
    }
    case 'unknown':
    default:
      return {
        result: {
          message: 'Sorry, I did not understand that command.',
          suggestedCommands: command.suggestedCommands,
        },
      };
  }
}

function resolveCommandForExecution(command: VoiceCommand): VoiceCommand {
  if (command.action !== 'confirm_required') return command;
  const requestedAction = command.input?.requestedAction;
  if (requestedAction === 'schedule') {
    return { ...command, action: 'schedule', requiresConfirmation: false, confirmationPrompt: undefined };
  }
  if (requestedAction === 'run_intent') {
    return { ...command, action: 'run_intent', requiresConfirmation: false, confirmationPrompt: undefined };
  }
  return command;
}

async function processCommandRequest(body: CommandRequest) {
  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return { error: 'text is required', status: 400, message: 'Provide { user: \"darnell\", text: \"your command\" }' };
  }

  const user = body.user?.trim();
  if (!user) {
    return { error: 'user is required', status: 400, message: 'Provide { user: \"darnell\" | \"shria\", text: \"your command\" }' };
  }

  if (!JOURNAL_ALLOWED_USERS.has(user)) {
    return { error: 'Invalid user', status: 400, message: 'user must be one of: darnell, shria' };
  }

  const command = buildVoiceCommand({ user, text: body.text.trim() });

  if (command.action === 'confirm_required' && !command.intent) {
    const prompt =
      'Which command should I schedule? Try: daily reflection, midday check in, close my day, daily brief, or action pack.';
    const followUpResponse = await respondWithFollowUp(command, prompt);
    return {
      status: 200,
      command,
      followUp: {
        id: followUpResponse.followUp.id,
        prompt: followUpResponse.followUp.prompt,
        suggestedCommands: followUpResponse.followUp.suggestedCommands,
      },
      historyId: followUpResponse.historyId,
    };
  }

  if (command.action === 'unknown') {
    const prompt = 'I can help with daily reflection, midday check in, close my day, daily brief, or action pack. Which should I run?';
    const followUpResponse = await respondWithFollowUp(command, prompt);
    return {
      status: 200,
      command,
      followUp: {
        id: followUpResponse.followUp.id,
        prompt: followUpResponse.followUp.prompt,
        suggestedCommands: followUpResponse.followUp.suggestedCommands,
      },
      historyId: followUpResponse.historyId,
    };
  }

  if (command.action === 'confirm_required' && command.requiresConfirmation && command.confirmationPrompt) {
    const pending = await createPendingConfirmation({
      user: command.user,
      command,
      confirmationPrompt: command.confirmationPrompt,
    });
    const summary = buildResultSummary(command);
    const history = recordVoiceCommandHistory({
      user: command.user,
      command,
      resultSummary: summary,
    });
    return {
      status: 200,
      command,
      confirmationId: pending.id,
      historyId: history.id,
    };
  }

  const execution = await executeVoiceCommand(command);
  const summary = buildResultSummary(command, execution.result);
  const history = recordVoiceCommandHistory({
    user: command.user,
    command,
    resultSummary: summary,
    runId: execution.runId,
  });

  return {
    status: 200,
    command,
    result: execution.result,
    runId: execution.runId,
    historyId: history.id,
  };
}

function normalizeMatchText(text: string) {
  return text.toLowerCase().replace(/[^\\w\\s]/g, '').replace(/\\s+/g, ' ').trim();
}

function resolveFollowUpText(input: string, suggested: string[]) {
  const trimmed = input.trim();
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= suggested.length) {
    return suggested[numeric - 1];
  }
  const normalized = normalizeMatchText(trimmed);
  const match = suggested.find((cmd) => normalizeMatchText(cmd) === normalized);
  return match || trimmed;
}

async function respondWithFollowUp(command: VoiceCommand, prompt: string) {
  const suggestions = command.suggestedCommands || getHelpCommands().commands;
  const followUp = await createPendingFollowUp({
    user: command.user,
    originalText: command.rawText,
    prompt,
    suggestedCommands: suggestions,
  });
  const summary = 'Follow-up requested';
  const history = recordVoiceCommandHistory({
    user: command.user,
    command,
    resultSummary: summary,
  });
  return { followUp, historyId: history.id };
}

/**
 * POST /api/voice/transcribe
 * Accepts: JSON { text: "..." } (stub mode) or multipart audio (future)
 * Returns: { text, confidence, provider }
 */
voiceCommandRouter.post('/transcribe', async (req: Request, res: Response) => {
  const sttProvider = process.env.STT_PROVIDER || 'none';

  const body = req.body as TranscribeRequest;

  if (body && typeof body.text === 'string' && body.text.trim()) {
    return res.json({
      text: body.text.trim(),
      confidence: 1.0,
      provider: 'stub',
    });
  }

  if (req.is('multipart/form-data')) {
    if (sttProvider === 'none') {
      return res.status(400).json({
        error: 'Audio transcription not configured',
        message: 'Set STT_PROVIDER=openai and STT_OPENAI_API_KEY to enable audio transcription. Use text fallback for now.',
        provider: 'none',
      });
    }

    return res.status(501).json({
      error: 'Audio transcription not implemented',
      message: 'Audio upload is recognized but STT integration is not yet complete.',
      provider: sttProvider,
    });
  }

  return res.status(400).json({
    error: 'Invalid request',
    message: 'Provide JSON with { text: "..." } or multipart audio file.',
  });
});

/**
 * POST /api/voice/command
 * Accepts: JSON { user: string, text: string }
 * Returns: { command, result, confirmationId? }
 */
voiceCommandRouter.post('/command', async (req: Request, res: Response) => {
  const body = req.body as CommandRequest;
  const result = await processCommandRequest(body);
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error, message: result.message });
  }
  return res.json(result);
});

/**
 * POST /api/voice/turn
 * Accepts: JSON { user: string, text: string }
 * Returns: { reply, command, result, confirmationId?, followUp? }
 */
voiceCommandRouter.post('/turn', async (req: Request, res: Response) => {
  const body = req.body as TurnRequest;
  const result = await processCommandRequest(body);
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error, message: result.message });
  }

  const reply = buildTurnReply(result.command, {
    result: result.result,
    confirmationId: result.confirmationId,
    followUp: result.followUp,
  });

  const artifact = result.result?.artifact;
  const assistantText =
    result.command.intent?.startsWith('journal.') && artifact
      ? formatJournalPromptsForVoice(artifact)
      : reply;

  const response: TurnResponse = {
    status: 'ok',
    transcript: body.text.trim(),
    assistant: {
      kind: result.command.intent || result.command.action,
      text: assistantText,
      runId: result.runId,
      metadata: {
        command: result.command,
        confirmationId: result.confirmationId,
        followUp: result.followUp,
        historyId: result.historyId,
      },
      ...(artifact ? { artifact } : {}),
    },
  };

  return res.json(response);
});

/**
 * POST /api/voice/confirm
 */
voiceCommandRouter.post('/confirm', async (req: Request, res: Response) => {
  const body = req.body as ConfirmRequest;

  if (!body?.confirmationId || !body?.answer || !body?.user) {
    return res.status(400).json({
      error: 'confirmationId, user, and answer are required',
    });
  }

  if (!['yes', 'no'].includes(body.answer)) {
    return res.status(400).json({ error: 'answer must be yes or no' });
  }

  const pending = await getPendingConfirmation(body.confirmationId);
  if (!pending) {
    return res.status(404).json({ error: 'confirmation not found or expired' });
  }

  if (pending.user !== body.user) {
    return res.status(403).json({ error: 'confirmation does not belong to this user' });
  }

  await resolvePendingConfirmation(body.confirmationId);

  if (body.answer === 'no') {
    const summary = 'Confirmation declined by user';
    const history = recordVoiceCommandHistory({
      user: pending.user,
      command: pending.command,
      resultSummary: summary,
    });
    return res.json({
      reply: summary,
      command: pending.command,
      result: { message: summary },
      historyId: history.id,
    });
  }

  const resolvedCommand = resolveCommandForExecution(pending.command);
  const execution = await executeVoiceCommand(resolvedCommand);
  const summary = buildResultSummary(resolvedCommand, execution.result);
  const history = recordVoiceCommandHistory({
    user: pending.user,
    command: resolvedCommand,
    resultSummary: summary,
    runId: execution.runId,
  });

  return res.json({
    reply: buildTurnReply(resolvedCommand, { result: execution.result }),
    command: resolvedCommand,
    result: execution.result,
    runId: execution.runId,
    historyId: history.id,
  });
});

/**
 * POST /api/voice/follow-up
 */
voiceCommandRouter.post('/follow-up', async (req: Request, res: Response) => {
  const body = req.body as FollowUpRequest;

  if (!body?.followUpId || !body?.user || !body?.text) {
    return res.status(400).json({ error: 'followUpId, user, and text are required' });
  }

  const pending = await getPendingFollowUp(body.followUpId);
  if (!pending) {
    return res.status(404).json({ error: 'follow-up not found or expired' });
  }

  if (pending.user !== body.user) {
    return res.status(403).json({ error: 'follow-up does not belong to this user' });
  }

  await resolvePendingFollowUp(body.followUpId);

  const resolvedText = resolveFollowUpText(body.text, pending.suggestedCommands || []);
  const command = buildVoiceCommand({ user: body.user, text: resolvedText });

  if (command.action === 'unknown') {
    const prompt = 'I can help with daily reflection, midday check in, close my day, daily brief, or action pack. Which should I run?';
    const followUpResponse = await respondWithFollowUp(command, prompt);
    return res.json({
      reply: followUpResponse.followUp.prompt,
      command,
      followUp: {
        id: followUpResponse.followUp.id,
        prompt: followUpResponse.followUp.prompt,
        suggestedCommands: followUpResponse.followUp.suggestedCommands,
      },
      historyId: followUpResponse.historyId,
    });
  }

  if (command.action === 'confirm_required' && command.requiresConfirmation && command.confirmationPrompt) {
    const pendingConfirmation = await createPendingConfirmation({
      user: command.user,
      command,
      confirmationPrompt: command.confirmationPrompt,
    });
    const summary = buildResultSummary(command);
    const history = recordVoiceCommandHistory({
      user: command.user,
      command,
      resultSummary: summary,
    });
    return res.json({
      reply: command.confirmationPrompt,
      command,
      confirmationId: pendingConfirmation.id,
      historyId: history.id,
    });
  }

  const execution = await executeVoiceCommand(command);
  const summary = buildResultSummary(command, execution.result);
  const history = recordVoiceCommandHistory({
    user: command.user,
    command,
    resultSummary: summary,
    runId: execution.runId,
  });

  return res.json({
    reply: buildTurnReply(command, { result: execution.result }),
    command,
    result: execution.result,
    runId: execution.runId,
    historyId: history.id,
  });
});

/**
 * GET /api/voice/commands?user=darnell&limit=20
 */
voiceCommandRouter.get('/commands', async (req: Request, res: Response) => {
  const user = (req.query.user as string) || 'darnell';
  const limit = Number(req.query.limit || 20);
  const items = listVoiceCommandHistory({ user, limit });
  return res.json({ items, limit });
});

/**
 * POST /api/voice/commands/:id/replay
 */
voiceCommandRouter.post('/commands/:id/replay', async (req: Request, res: Response) => {
  const record = getVoiceCommandHistoryRecord(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'command not found' });
  }

  if (record.command.action !== 'run_intent') {
    return res.status(400).json({ error: 'only run_intent commands can be replayed' });
  }

  const execution = await executeVoiceCommand(record.command);
  const summary = buildResultSummary(record.command, execution.result);
  const history = recordVoiceCommandHistory({
    user: record.user,
    command: record.command,
    resultSummary: summary,
    runId: execution.runId,
  });

  return res.json({
    reply: buildTurnReply(record.command, { result: execution.result }),
    command: record.command,
    result: execution.result,
    runId: execution.runId,
    historyId: history.id,
  });
});

/**
 * GET /api/voice/help
 */
voiceCommandRouter.get('/help', (_req: Request, res: Response) => {
  return res.json(getHelpCommands());
});

export default voiceCommandRouter;
