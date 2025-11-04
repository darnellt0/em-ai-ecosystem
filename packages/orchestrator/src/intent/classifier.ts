import { LLMAdapter, applyLLMFallback } from './llm.adapter';
import { IntentClassification, IntentEntities, VoiceIntent } from './types';

interface RuleDefinition {
  intent: VoiceIntent;
  patterns: RegExp[];
  summary: string;
}

const INTENT_RULES: RuleDefinition[] = [
  {
    intent: 'scheduler.block',
    patterns: [
      /(block|hold|protect)\s+(\d+\s*(?:minute|min|hour|hr)s?)?/i,
      /(focus|deep work|quiet)\s+time/i,
    ],
    summary: 'Block focus time on the calendar',
  },
  {
    intent: 'scheduler.confirm',
    patterns: [
      /(confirm|lock in|keep)\s+(?:the|that|this)?\s*(meeting|call|appointment)/i,
      /sounds good,? confirm/i,
    ],
    summary: 'Confirm a scheduled event',
  },
  {
    intent: 'scheduler.reschedule',
    patterns: [
      /(move|reschedule|push|shift)\s+(the\s+)?(meeting|call|appointment)/i,
      /find\s+a\s+new\s+time/i,
    ],
    summary: 'Reschedule an event',
  },
  {
    intent: 'coach.pause',
    patterns: [
      /(start|kick off|run)\s+(a\s+)?(breath|breathing|meditation|pause)/i,
      /i\s+need\s+(?:a\s+)?(?:quick\s+)?(?:meditation\s+)?break/i,
    ],
    summary: 'Trigger a mindfulness break',
  },
  {
    intent: 'support.logComplete',
    patterns: [
      /(log|mark)\s+(that\s+)?(task|ticket|item)\s+(as\s+)?(done|complete)/i,
      /(i|we)\s+(finished|completed)\s+(it|that)/i,
    ],
    summary: 'Mark a task complete',
  },
  {
    intent: 'support.followUp',
    patterns: [
      /(create|set|schedule)\s+(?:a\s+)?follow(?:[-\s])?up/i,
      /remind\s+me\s+(to|about)/i,
    ],
    summary: 'Create a follow up reminder',
  },
];

const MINUTES_REGEX = /(\d{1,3})\s*(?:minutes?|mins?)/i;
const HOUR_REGEX = /(\d{1,2})\s*(?:hours?|hrs?)/i;
const TIME_COLON_REGEX = /(\d{1,2}:\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/i;
const TIME_SUFFIX_REGEX = /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.|morning|afternoon|evening|noon|midday|midnight)/i;
const DATE_REGEX = /(today|tomorrow|tonight|this\s+afternoon|this\s+morning|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i;
const TITLE_REGEX = /(?:for|about|regarding)\s+(?:the\s+)?([\w\s]+?)(?:\s+(?:meeting|call|session|task|project)|$)/i;

function extractEntities(text: string): IntentEntities {
  const entities: IntentEntities = {};
  const minutesMatch = text.match(MINUTES_REGEX);
  if (minutesMatch) {
    entities.minutes = parseInt(minutesMatch[1], 10);
  } else {
    const hoursMatch = text.match(HOUR_REGEX);
    if (hoursMatch) {
      entities.minutes = parseInt(hoursMatch[1], 10) * 60;
    }
  }

  const timeWithColon = text.match(TIME_COLON_REGEX);
  if (timeWithColon) {
    const [, timeValue, suffixRaw] = timeWithColon;
    let formatted = timeValue;
    if (suffixRaw) {
      const suffix = suffixRaw.replace(/\./g, '').toLowerCase();
      formatted += ` ${suffix}`;
    }
    entities.time = formatted.trim();
  } else {
    const timeWithSuffix = text.match(TIME_SUFFIX_REGEX);
    if (timeWithSuffix) {
      const [, hour, suffixRaw] = timeWithSuffix;
      let suffix = suffixRaw.replace(/\./g, '').toLowerCase();
      if (suffix === 'morning') suffix = 'am';
      if (suffix === 'afternoon' || suffix === 'evening' || suffix === 'midday') suffix = 'pm';
      if (suffix === 'noon') {
        entities.time = '12 pm';
      } else if (suffix === 'midnight') {
        entities.time = '12 am';
      } else {
        entities.time = `${hour} ${suffix}`.trim();
      }
    }
  }

  const dateMatch = text.match(DATE_REGEX);
  if (dateMatch) {
    entities.date = dateMatch[0].toLowerCase();
  }

  const titleMatch = text.match(TITLE_REGEX);
  if (titleMatch) {
    entities.title = titleMatch[1].trim();
  }

  return entities;
}

function buildSummary(intent: VoiceIntent, entities: IntentEntities): string {
  switch (intent) {
    case 'scheduler.block': {
      const duration = entities.minutes ? `${entities.minutes} minutes` : 'time';
      const when = entities.time || entities.date || 'soon';
      return `Block ${duration} for focus ${entities.title ? `on ${entities.title}` : ''} ${when ? `at ${when}` : ''}`.trim();
    }
    case 'scheduler.confirm':
      return `Confirm the meeting${entities.title ? ` about ${entities.title}` : ''}`;
    case 'scheduler.reschedule':
      return `Reschedule the meeting${entities.time ? ` to ${entities.time}` : ''}`;
    case 'coach.pause':
      return `Start a guided pause${entities.minutes ? ` for ${entities.minutes} minutes` : ''}`;
    case 'support.logComplete':
      return `Log the task${entities.title ? ` ${entities.title}` : ''} as complete`;
    case 'support.followUp':
      return `Schedule a follow-up${entities.followUpDate ? ` for ${entities.followUpDate}` : ''}`;
    default:
      return 'Intent unclear';
  }
}

export class IntentClassifier {
  async classify(text: string, baseEntities: IntentEntities = {}): Promise<IntentClassification> {
    const normalized = text.trim();
    if (!normalized) {
      return {
        intent: 'unknown',
        confidence: 0,
        entities: baseEntities,
        reasoning: ['No text provided'],
        usedFallback: false,
        humanSummary: 'No input',
      };
    }

    const matchedRule = INTENT_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(normalized)));

    const extracted = extractEntities(normalized);
    const mergedEntities: IntentEntities = { ...baseEntities, ...extracted };

    if (matchedRule) {
      return {
        intent: matchedRule.intent,
        confidence: 0.9,
        entities: mergedEntities,
        reasoning: [`Matched rule for ${matchedRule.intent}`],
        usedFallback: false,
        humanSummary: buildSummary(matchedRule.intent, mergedEntities),
      };
    }

    const fallback = await LLMAdapter.classify(normalized);
    if (fallback.intent !== 'unknown') {
      const fallbackEntities = { ...mergedEntities, ...fallback.entities };
      return {
        intent: fallback.intent,
        confidence: fallback.confidence,
        entities: fallbackEntities,
        reasoning: ['Used LLM fallback', fallback.reasoning],
        usedFallback: true,
        humanSummary: buildSummary(fallback.intent, fallbackEntities),
      };
    }

    return applyLLMFallback(fallback);
  }
}

export function extractIntentEntities(text: string): IntentEntities {
  return extractEntities(text);
}
