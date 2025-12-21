/**
 * Voice API service adapters - PHASE 2 AGENT INTEGRATION
 * Delegates to real agents via AgentFactory (currently with intelligent mocks)
 * Each function returns VoiceResponse with humanSummary and optional nextBestAction.
 *
 * Phase 2 Status: Agent factory integrated, ready for real implementations
 * Next: Wire to actual agent operations and database
 */

import {
  VoiceResponse,
  FocusBlockInput,
  ConfirmMeetingInput,
  RescheduleInput,
  PauseInput,
  LogCompleteInput,
  FollowUpInput,
} from './voice.types';
import { agentFactory } from '../agents/agent-factory';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import { launchGrowthPack } from '../services/emAi.service';

// Helper function to get founder email from ID
function getFounderEmail(founderIdId: string): string {
  const emails: Record<string, string> = {
    darnell: process.env.FOUNDER_DARNELL_EMAIL || 'darnell@elevatedmovements.com',
    shria: process.env.FOUNDER_SHRIA_EMAIL || 'shria@elevatedmovements.com',
  };
  return emails[founderIdId] || founderIdId;
}

// ============================================================================
// SERVICE 1: FOCUS BLOCK
// ============================================================================

/**
 * Block focus time via Calendar Optimizer agent (PHASE 2 INTEGRATED).
 * Creates a calendar block for deep work.
 * Uses AgentFactory to call calendar-optimizer agent operations.
 */
export async function blockFocus(input: FocusBlockInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);
    const startTime = input.startAtISO ? new Date(input.startAtISO) : new Date();

    // PHASE 2: Call real Calendar Optimizer agent
    const result = await agentFactory.blockFocusTime(
      founderEmail,
      input.minutes,
      input.reason || 'Deep work',
      input.bufferMinutes || 10,
      startTime
    );

    return {
      status: 'ok',
      humanSummary: `Blocked ${input.minutes} minutes for focus on ${startTime.toLocaleString()}${
        input.reason ? ` (${input.reason})` : ''
      }. ${result.notifications.join('. ')}`,
      nextBestAction:
        result.conflicts.length > 0
          ? `Note: ${result.conflicts.join('; ')}`
          : 'Notifications silenced. Get to work!',
      data: {
        founderEmail: input.founder,
        blockStart: result.startTime.toISOString(),
        blockEnd: result.endTime.toISOString(),
        eventId: result.eventId,
        reason: input.reason,
        bufferMinutes: input.bufferMinutes,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not block focus time: ${message}`,
      nextBestAction: 'Try again in a moment.',
    };
  }
}

// ============================================================================
// SERVICE 2: CONFIRM MEETING
// ============================================================================

/**
 * Confirm and add a meeting to calendar via Calendar Optimizer (PHASE 2 INTEGRATED).
 * Creates or updates a calendar event.
 */
export async function confirmMeeting(input: ConfirmMeetingInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);
    const startTime = new Date(input.startAtISO);

    // PHASE 2: Call real Calendar Optimizer agent
    const result = await agentFactory.confirmMeeting(
      founderEmail,
      input.title,
      startTime,
      input.durationMinutes,
      input.location
    );

    return {
      status: 'ok',
      humanSummary: `Added "${result.title}" to calendar on ${startTime.toLocaleString()} for ${input.durationMinutes} minutes.`,
      nextBestAction: input.location ? `Meeting created with attendees: ${result.attendees.join(', ')}.` : 'Meeting added to calendar.',
      data: {
        founderEmail: input.founder,
        eventId: result.eventId,
        eventTitle: result.title,
        eventStart: result.startTime.toISOString(),
        eventEnd: result.endTime.toISOString(),
        location: input.location,
        attendees: result.attendees,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not confirm meeting: ${message}`,
      nextBestAction: 'Verify event details and retry.',
    };
  }
}

// ============================================================================
// SERVICE 3: RESCHEDULE MEETING
// ============================================================================

/**
 * Reschedule an existing calendar event via Calendar Optimizer (PHASE 2 INTEGRATED).
 * Updates meeting time and notifies attendees.
 */
export async function rescheduleMeeting(input: RescheduleInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);
    const newStartTime = new Date(input.newStartAtISO);

    // PHASE 2: Call real Calendar Optimizer agent
    const result = await agentFactory.rescheduleMeeting(
      founderEmail,
      input.eventId,
      newStartTime,
      input.newDurationMinutes
    );

    return {
      status: 'ok',
      humanSummary: `Rescheduled "${result.title}" to ${newStartTime.toLocaleString()} for ${input.newDurationMinutes} minutes.`,
      nextBestAction: `Notifying ${result.attendees.length} attendees of the time change.`,
      data: {
        founderEmail: input.founder,
        eventId: result.eventId,
        newStart: result.startTime.toISOString(),
        newEnd: result.endTime.toISOString(),
        attendees: result.attendees,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not reschedule meeting: ${message}`,
      nextBestAction: 'Verify the event ID and try again.',
    };
  }
}

// ============================================================================
// SERVICE 4: START PAUSE / MEDITATION
// ============================================================================

/**
 * Start a guided pause or meditation via Voice Companion + Deep Work Monitor (PHASE 2 INTEGRATED).
 * Synergy: Deep Work Defender manages focus state; Voice Companion provides guidance.
 */
export async function startPause(input: PauseInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);

    // PHASE 2: Call real Voice Companion + Deep Work Defender agents
    const pauseResult = await agentFactory.startPause(
      founderEmail,
      input.style,
      input.seconds
    );

    // Record activity in Deep Work Defender for energy tracking
    await agentFactory.recordActivity(founderEmail, 'pause', Math.floor(input.seconds / 60), {
      style: input.style,
      guidance: pauseResult.guidance,
    });

    return {
      status: 'ok',
      humanSummary: `Starting a ${input.seconds}s ${pauseResult.style} for you now. ${pauseResult.guidance[0]}`,
      nextBestAction: 'Find a quiet space and follow the voice guidance.',
      data: {
        founderEmail: input.founder,
        sessionId: pauseResult.sessionId,
        pauseStyle: pauseResult.style,
        pauseDurationSeconds: pauseResult.duration,
        guidance: pauseResult.guidance,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not start pause: ${message}`,
      nextBestAction: 'Try again when ready.',
    };
  }
}

// ============================================================================
// SERVICE 5: LOG TASK COMPLETE
// ============================================================================

/**
 * Log task completion via Inbox Assistant (PHASE 2 INTEGRATED).
 * Updates task status and records completion note.
 */
export async function logTaskComplete(input: LogCompleteInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);

    // PHASE 2: Call real Inbox Assistant agent
    const result = await agentFactory.logTaskComplete(
      founderEmail,
      input.taskId,
      input.note
    );

    // Send notification of task completion
    await agentFactory.sendNotification(
      founderEmail,
      'Task Completed',
      `Task "${result.title}" marked as complete.`,
      ['email', 'slack']
    );

    return {
      status: 'ok',
      humanSummary: `Marked "${result.title}" as complete.${
        input.note ? ` Noted: "${input.note}"` : ''
      }`,
      nextBestAction: result.nextTask
        ? `Next priority: "${result.nextTask.title}" due ${result.nextTask.dueDate.toLocaleDateString()}.`
        : 'Great work! You cleared a task.',
      data: {
        founderEmail: input.founder,
        taskId: result.taskId,
        completedAt: result.completedAt?.toISOString(),
        note: input.note,
        nextTask: result.nextTask,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not log task completion: ${message}`,
      nextBestAction: 'Verify the task ID and retry.',
    };
  }
}

// ============================================================================
// SERVICE 6: CREATE FOLLOW-UP
// ============================================================================

/**
 * Create a follow-up task or reminder via Task Orchestrator (PHASE 2 INTEGRATED).
 * Adds an action item to the inbox for future reference.
 */
export async function createFollowUp(input: FollowUpInput): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(input.founder);
    const dueDate = input.dueISO ? new Date(input.dueISO) : undefined;

    // PHASE 2: Call real Task Orchestrator agent
    const result = await agentFactory.createFollowUp(
      founderEmail,
      input.subject,
      dueDate,
      input.context
    );

    // Send reminder notification
    if (dueDate) {
      await agentFactory.sendNotification(
        founderEmail,
        'Reminder Set',
        `Follow-up "${input.subject}" scheduled for ${dueDate.toLocaleDateString()}.`,
        ['email', 'slack']
      );
    }

    return {
      status: 'ok',
      humanSummary: `Created follow-up: "${result.title}".${
        dueDate ? ` Due ${dueDate.toLocaleString()}.` : ' No due date set.'
      }`,
      nextBestAction: 'You will be reminded at the scheduled time.',
      data: {
        founderEmail: input.founder,
        taskId: result.taskId,
        followUpSubject: result.title,
        dueAt: dueDate?.toISOString(),
        context: input.context,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not create follow-up: ${message}`,
      nextBestAction: 'Try again with clearer details.',
    };
  }
}

// ============================================================================
// PHASE 2C SERVICES: ANALYTICS & BUSINESS INTELLIGENCE
// ============================================================================

/**
 * Get daily brief from Daily Brief agent (PHASE 2C).
 * Generates comprehensive executive summary with metrics and recommendations.
 */
export async function getDailyBrief(founder: string): Promise<VoiceResponse> {
  try {
    const brief = await runDailyBriefAgent({ user: founder as 'darnell' | 'shria' });
    const briefText =
      brief.text ||
      [brief.topPriorities?.join(', ') || '', brief.sections?.map(s => s.content).join(', ') || ''].join('\n');

    return {
      status: 'ok',
      humanSummary: briefText,
      nextBestAction: 'Review the brief and prioritize your next actions.',
      data: {
        founderEmail: getFounderEmail(founder),
        timestamp: new Date().toISOString(),
        type: 'daily-brief',
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not generate daily brief: ${message}`,
      nextBestAction: 'Try again in a few moments.',
    };
  }
}

/**
 * Get insights from Insight Analyst agent (PHASE 2C).
 * Analyzes activity patterns and provides recommendations.
 */
export async function getInsights(founder: string, timeframe?: 'daily' | 'weekly' | 'monthly'): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Insight Analyst agent
    const insights = await agentFactory.getInsights(founderEmail, timeframe || 'daily');

    return {
      status: 'ok',
      humanSummary: insights.join('\n'),
      nextBestAction: 'Use these insights to optimize your productivity.',
      data: {
        founderEmail: founder,
        timeframe: timeframe || 'daily',
        insights,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not retrieve insights: ${message}`,
      nextBestAction: 'Try again later.',
    };
  }
}

/**
 * Get grant opportunities from Grant Researcher agent (PHASE 2C).
 * Identifies funding opportunities matching your business goals.
 */
export async function getGrantOpportunities(founder: string): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Grant Researcher agent
    const grants = await agentFactory.getGrantOpportunities(founderEmail);

    const summary = grants
      .map(
        (g: any) =>
          `${g.name}: $${g.amount?.toLocaleString() || 'TBD'} (Deadline: ${g.deadline ? new Date(g.deadline).toLocaleDateString() : 'TBD'})`
      )
      .join('\n');

    return {
      status: 'ok',
      humanSummary: summary,
      nextBestAction: 'Review opportunities and consider applying to top matches.',
      data: {
        founderEmail: founder,
        grants,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not retrieve grants: ${message}`,
      nextBestAction: 'Check your internet connection and try again.',
    };
  }
}

/**
 * Track relationship interaction from Relationship Tracker agent (PHASE 2C).
 * Records engagement with a contact.
 */
export async function trackRelationship(founder: string, contactId: string, action: string): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Relationship Tracker agent
    const result = await agentFactory.trackRelationship(founderEmail, contactId, action);

    return {
      status: 'ok',
      humanSummary: `Tracked interaction with ${contactId}. Relationship ID: ${result.relationshipId}`,
      nextBestAction: 'Continue building meaningful relationships.',
      data: {
        founderEmail: founder,
        contactId,
        action,
        relationshipId: result.relationshipId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not track relationship: ${message}`,
      nextBestAction: 'Verify contact ID and try again.',
    };
  }
}

/**
 * Allocate budget from Financial Allocator agent (PHASE 2C).
 * Smart budget allocation based on business goals.
 */
export async function allocateBudget(founder: string, totalBudget: number, goals?: string[]): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Financial Allocator agent
    const result = await agentFactory.allocateBudget(founderEmail, totalBudget, goals || []);

    const allocSummary = Object.entries(result.allocations)
      .map(([category, amount]) => `${category}: $${(amount as number).toLocaleString()}`)
      .join('\n');

    return {
      status: 'ok',
      humanSummary: `Budget allocation for $${totalBudget.toLocaleString()}:\n${allocSummary}`,
      nextBestAction: result.recommendations.join(' '),
      data: {
        founderEmail: founder,
        totalBudget,
        allocations: result.allocations,
        recommendations: result.recommendations,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not allocate budget: ${message}`,
      nextBestAction: 'Check budget amount and try again.',
    };
  }
}

/**
 * Generate content from Content Synthesizer agent (PHASE 2C).
 * Creates content for multiple platforms.
 */
export async function generateContent(
  founder: string,
  platform: 'social' | 'blog' | 'email',
  topic: string
): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Content Synthesizer agent
    const result = await agentFactory.generateContent(founderEmail, platform, topic);

    return {
      status: 'ok',
      humanSummary: result.content,
      nextBestAction: `Content generated for ${platform}. Edit and publish when ready.`,
      data: {
        founderEmail: founder,
        platform,
        topic,
        content: result.content,
        title: result.title,
        hashtags: result.hashtags,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not generate content: ${message}`,
      nextBestAction: 'Try with a different topic or platform.',
    };
  }
}

/**
 * Generate brand story from Brand Storyteller agent (PHASE 2C).
 * Creates brand narratives and value propositions.
 */
export async function generateBrandStory(founder: string, companyName: string, values?: string[]): Promise<VoiceResponse> {
  try {
    const founderEmail = getFounderEmail(founder);

    // PHASE 2C: Call Brand Storyteller agent
    const result = await agentFactory.generateBrandStory(founderEmail, companyName, values || []);

    const summary = `Mission: ${result.missionStatement}\n\nStory: ${result.coreStory}`;

    return {
      status: 'ok',
      humanSummary: summary,
      nextBestAction: 'Use this narrative in your marketing and communications.',
      data: {
        founderEmail: founder,
        companyName,
        missionStatement: result.missionStatement,
        coreStory: result.coreStory,
        valuePropositions: result.valuePropositions,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      status: 'error',
      humanSummary: `Could not generate brand story: ${message}`,
      nextBestAction: 'Provide clearer company details and try again.',
    };
  }
}

// ============================================================================
// VOICE INTENT: GROWTH CHECK-IN (Phase 6 Exec Admin Growth Pack)
// ============================================================================

interface GrowthCheckInInput {
  founderEmail?: string;
  mode?: 'full';
}

export async function handleGrowthCheckInIntent(input: GrowthCheckInInput) {
  const defaultFounder = process.env.FOUNDER_SHRIA_EMAIL || 'shria@elevatedmovements.com';
  const founderEmail = input.founderEmail || defaultFounder;
  const mode: 'full' = input.mode || 'full';

  try {
    const result = await launchGrowthPack({ founderEmail, mode: (mode as 'full') || 'full' });

    return {
      success: true,
      intent: 'growth_check_in',
      message:
        'I have launched your full Growth Pack. I will analyze your journal, niche, mindset, rhythm, and purpose agents and update your dashboard with the latest insights.',
      data: {
        mode: result.mode,
        launchedAgents: result.launchedAgents,
        jobIds: result.jobIds,
        runId: (result as any).runId,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Voice Intent] growth_check_in failed:', error);
    return {
      success: false,
      intent: 'growth_check_in',
      message:
        'I couldn’t start your Growth Pack just now. Please check the server logs or try again in a moment.',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
