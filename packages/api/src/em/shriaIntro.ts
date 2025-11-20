/**
 * Shria's Personal Assistant First-Message Generator
 *
 * This module provides context-aware first messages for Shria's ElevenLabs assistant.
 * It dynamically chooses greetings based on:
 * - Time of day (morning, midday, evening)
 * - Interaction context (startup, post-meeting, post-break)
 * - Energy level (neutral, overwhelmed, tired, big-day)
 *
 * The messages are designed to match Shria's voice assistant tone:
 * grounded, calm, supportive, and present.
 */

// ============================================================================
// Core Types
// ============================================================================

export type IntroMoment =
  | "startup"
  | "morning"
  | "midday"
  | "evening"
  | "post-break"
  | "post-meeting";

export type EnergyContext = "neutral" | "overwhelmed" | "tired" | "big-day";

interface IntroOptions {
  moment: IntroMoment;
  energy?: EnergyContext;
}

// ============================================================================
// Core Generator Function
// ============================================================================

/**
 * Returns a first-message string for Shria's Assistant
 * that matches the tone and context of the moment.
 *
 * @param options - The moment and energy context for this interaction
 * @returns A context-aware greeting string
 */
export function generateShriaFirstMessage(
  { moment, energy = "neutral" }: IntroOptions
): string {
  // Handle special "big day" energy first
  if (energy === "big-day") {
    switch (moment) {
      case "morning":
      case "startup":
        return (
          "Good morning, Shria. Today carries a lot of importance, so let's move through it with steadiness and care. " +
          "When you're ready, I can walk you through the anchors for the day so everything feels grounded and manageable."
        );
      case "midday":
        return (
          "Hi Shria. You've already moved through a lot today. " +
          "Let's take a breath, then I can help you re-center and look at what still needs your attention."
        );
      case "evening":
        return (
          "Good evening, Shria. You held a big day with a lot of presence. " +
          "If you'd like, I can help you reflect on what we accomplished and gently set up tomorrow."
        );
      default:
        // Fallback for other moments on a big day
        return (
          "Hi Shria. Today carries weight, but you're holding it well. " +
          "Let's move through this next part with care and presence."
        );
    }
  }

  // Default / neutral intros by moment
  switch (moment) {
    case "startup":
    case "morning":
      if (energy === "tired") {
        return (
          "Good morning, Shria. Let's start gently and choose a pace that supports your energy today. " +
          "Whenever you're ready, I can walk you through what's ahead."
        );
      }
      return (
        "Good morning, Shria. I'm here and ready to help you move through the day with clarity and calm. " +
        "Just let me know when you'd like to see your schedule or ease into your first focus for the morning."
      );

    case "midday":
      if (energy === "overwhelmed") {
        return (
          "Hi Shria. Let's slow things down for a moment. " +
          "When you're ready, I can help you re-center, simplify what's ahead, or offer a gentle transition into your next focus."
        );
      }
      return (
        "Welcome back, Shria. Let's ease into this next part of the day. " +
        "If you'd like, I can walk you through what's coming up or help you settle into a focused block."
      );

    case "evening":
      if (energy === "tired" || energy === "overwhelmed") {
        return (
          "Good evening, Shria. You've carried a lot today. " +
          "If it would be helpful, I can gently recap what we completed and set light, supportive intentions for tomorrow."
        );
      }
      return (
        "Hi Shria. Let's wind the day down at a softer pace. " +
        "I can help you review what we moved through today and tidy up anything that needs attention before tomorrow."
      );

    case "post-break":
      if (energy === "overwhelmed") {
        return (
          "Welcome back, Shria. Take your time easing in. " +
          "Whenever you're ready, I can help you choose one simple next step or offer a short moment to ground before we continue."
        );
      }
      return (
        "Welcome back, Shria. Let's settle in again. " +
        "If you'd like, I can guide us into the next task or help you re-establish your focus."
      );

    case "post-meeting":
      if (energy === "overwhelmed") {
        return (
          "You're back, Shria. Let's take a moment to breathe before we move on. " +
          "When it feels right, I can help capture key points from that meeting or outline only the most important next steps."
        );
      }
      return (
        "Welcome back, Shria. Let's slow the pace just a bit. " +
        "If you'd like, I can help you reflect on the meeting, capture key decisions, or ease into what's next."
      );

    default:
      // Fallback – safe, neutral intro
      return (
        "Welcome, Shria. I'm here to help you move through this moment with clarity and calm. " +
        "Just let me know whether you'd like to see your priorities, take a breath, or ease into your next focus."
      );
  }
}

/**
 * Optional helper: infer a generic IntroMoment based on local time.
 * This does NOT know about post-meeting vs post-break; that is handled by the orchestrator.
 *
 * @param date - The date to infer from (defaults to current time)
 * @returns The inferred moment based on hour of day
 */
export function inferIntroMomentFromDate(date = new Date()): IntroMoment {
  const hour = date.getHours();

  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

// ============================================================================
// Orchestrator Decision Logic
// ============================================================================

interface MomentContext {
  now: Date;
  lastInteractionAt?: Date | null;
  entryContext?: "open_app" | "post_meeting" | "resume" | "voice_wake_word";
}

/**
 * Decides the appropriate IntroMoment based on time, context, and interaction patterns.
 *
 * @param ctx - Context information about the current interaction
 * @returns The determined intro moment
 */
export function decideIntroMoment(ctx: MomentContext): IntroMoment {
  const hour = ctx.now.getHours();
  const msSinceLast =
    ctx.lastInteractionAt
      ? ctx.now.getTime() - ctx.lastInteractionAt.getTime()
      : null;

  const longGap = msSinceLast === null || msSinceLast > 4 * 60 * 60 * 1000; // > 4 hours
  const mediumGap =
    msSinceLast !== null && msSinceLast > 45 * 60 * 1000; // > 45 min

  // 1) Explicit contexts first
  if (ctx.entryContext === "post_meeting") return "post-meeting";
  if (ctx.entryContext === "resume" && mediumGap) return "post-break";

  // 2) First touch in a long while = startup-ish greetings based on time of day
  if (longGap) {
    if (hour < 12) return "morning";
    if (hour < 17) return "midday";
    if (hour < 22) return "evening";
    return "startup";
  }

  // 3) Otherwise, just use time-of-day
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

interface EnergySignals {
  explicitOverwhelmed?: boolean;
  explicitTired?: boolean;
  totalEventHoursToday: number;
  hasHighStakesEvent: boolean;    // e.g., retreat, launch, workshop
  hasBackToBackBlocks: boolean;
  hour: number;
}

/**
 * Decides the appropriate EnergyContext based on calendar load, explicit signals, and time of day.
 *
 * @param signals - Various signals about Shria's current energy and schedule
 * @returns The determined energy context
 */
export function decideEnergyContext(signals: EnergySignals): EnergyContext {
  const {
    explicitOverwhelmed,
    explicitTired,
    totalEventHoursToday,
    hasHighStakesEvent,
    hasBackToBackBlocks,
    hour,
  } = signals;

  // 1) Respect explicit user input first
  if (explicitOverwhelmed) return "overwhelmed";
  if (explicitTired) return "tired";

  // 2) Big day: high-stakes event OR heavy load
  if (
    hasHighStakesEvent ||
    totalEventHoursToday >= 6 ||
    (totalEventHoursToday >= 4 && hasBackToBackBlocks)
  ) {
    return "big-day";
  }

  // 3) Tired: late evening with a long day
  if (hour >= 20 && totalEventHoursToday >= 4) {
    return "tired";
  }

  // 4) Default
  return "neutral";
}

interface FirstMessageContext {
  now: Date;
  lastInteractionAt?: Date | null;
  entryContext?: "open_app" | "post_meeting" | "resume" | "voice_wake_word";

  totalEventHoursToday: number;
  hasHighStakesEvent: boolean;
  hasBackToBackBlocks: boolean;
  explicitOverwhelmed?: boolean;
  explicitTired?: boolean;
}

/**
 * High-level API used by the EM AI orchestrator.
 * Returns the best first message for Shria's assistant for this interaction.
 *
 * This is the main entry point for the first-message generator system.
 * Call this function when initializing a conversation session with Shria's
 * ElevenLabs voice assistant to get a context-aware greeting.
 *
 * @param ctx - Full context for the current interaction
 * @returns A personalized first message string
 *
 * @example
 * ```typescript
 * const firstMessage = getFirstMessageForShria({
 *   now: new Date(),
 *   lastInteractionAt: null,
 *   entryContext: "open_app",
 *   totalEventHoursToday: 5,
 *   hasHighStakesEvent: true,
 *   hasBackToBackBlocks: true,
 * });
 * // Returns: "Good morning, Shria. Today carries a lot of importance..."
 * ```
 */
export function getFirstMessageForShria(ctx: FirstMessageContext): string {
  const moment = decideIntroMoment({
    now: ctx.now,
    lastInteractionAt: ctx.lastInteractionAt,
    entryContext: ctx.entryContext,
  });

  const energy = decideEnergyContext({
    explicitOverwhelmed: ctx.explicitOverwhelmed,
    explicitTired: ctx.explicitTired,
    totalEventHoursToday: ctx.totalEventHoursToday,
    hasHighStakesEvent: ctx.hasHighStakesEvent,
    hasBackToBackBlocks: ctx.hasBackToBackBlocks,
    hour: ctx.now.getHours(),
  });

  return generateShriaFirstMessage({ moment, energy });
}
