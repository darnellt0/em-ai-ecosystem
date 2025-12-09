/**
 * Voice API types and Zod schemas for all 6 endpoints.
 * Request/response types with strict validation.
 */

import { z } from 'zod';

// ============================================================================
// SHARED TYPES
// ============================================================================

export const FounderSchema = z.enum(['darnell', 'shria']).default('shria');
export type Founder = z.infer<typeof FounderSchema>;

export const ISODateSchema = z
  .string()
  .datetime()
  .describe('ISO 8601 datetime string');
export type ISODate = string;

/**
 * Common response shape for all voice API endpoints.
 */
export interface VoiceResponse {
  status: 'ok' | 'error';
  humanSummary: string;
  nextBestAction?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// ENDPOINT 1: FOCUS BLOCK (Scheduler)
// ============================================================================

export const FocusBlockSchema = z.object({
  minutes: z
    .number()
    .int()
    .min(1, 'Must be at least 1 minute')
    .max(240, 'Cannot exceed 240 minutes'),
  reason: z
    .string()
    .optional()
    .describe('Why the focus block (optional)'),
  bufferMinutes: z
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(60, 'Cannot exceed 60 minutes')
    .default(10)
    .describe('Buffer before block starts'),
  startAtISO: ISODateSchema.optional().describe('When to start block (default: now)'),
  founder: FounderSchema,
});

export type FocusBlockInput = z.infer<typeof FocusBlockSchema>;

// ============================================================================
// ENDPOINT 2: CONFIRM MEETING (Scheduler)
// ============================================================================

export const ConfirmMeetingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  startAtISO: ISODateSchema,
  durationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Cannot exceed 480 minutes (8 hours)'),
  location: z
    .string()
    .optional()
    .describe('Physical or virtual location'),
  founder: FounderSchema,
});

export type ConfirmMeetingInput = z.infer<typeof ConfirmMeetingSchema>;

// ============================================================================
// ENDPOINT 3: RESCHEDULE MEETING (Scheduler)
// ============================================================================

export const RescheduleSchema = z.object({
  eventId: z
    .string()
    .min(3, 'Event ID must be at least 3 characters'),
  newStartAtISO: ISODateSchema,
  newDurationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Cannot exceed 480 minutes'),
  founder: FounderSchema,
});

export type RescheduleInput = z.infer<typeof RescheduleSchema>;

// ============================================================================
// ENDPOINT 4: PAUSE / MEDITATION (Coach)
// ============================================================================

export const PauseStyleSchema = z.enum(
  ['breath', 'box', 'grounding', 'body-scan'],
  {
    description: 'Type of pause exercise',
  }
);

export const PauseSchema = z.object({
  style: PauseStyleSchema.default('grounding'),
  seconds: z
    .number()
    .int()
    .min(1, 'Must be at least 1 second')
    .max(300, 'Cannot exceed 300 seconds (5 minutes)')
    .default(60),
  founder: FounderSchema,
});

export type PauseInput = z.infer<typeof PauseSchema>;
export type PauseStyle = z.infer<typeof PauseStyleSchema>;

// ============================================================================
// ENDPOINT 5: LOG COMPLETE (Support)
// ============================================================================

export const LogCompleteSchema = z.object({
  taskId: z
    .string()
    .min(2, 'Task ID must be at least 2 characters'),
  note: z
    .string()
    .optional()
    .describe('Completion notes or reflection'),
  founder: FounderSchema,
});

export type LogCompleteInput = z.infer<typeof LogCompleteSchema>;

// ============================================================================
// ENDPOINT 6: FOLLOW-UP (Support)
// ============================================================================

export const FollowUpSchema = z.object({
  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters'),
  dueISO: ISODateSchema.optional().describe('When to follow up'),
  context: z
    .string()
    .optional()
    .describe('Additional context for the follow-up'),
  founder: FounderSchema,
});

export type FollowUpInput = z.infer<typeof FollowUpSchema>;

// ============================================================================
// PHASE 2C ENDPOINTS: ANALYTICS & BUSINESS INTELLIGENCE
// ============================================================================

// ENDPOINT 7: DAILY BRIEF (Analytics)
export const DailyBriefSchema = z.object({
  founder: FounderSchema,
});

export type DailyBriefInput = z.infer<typeof DailyBriefSchema>;

// ENDPOINT 8: INSIGHTS (Analytics)
export const InsightsSchema = z.object({
  founder: FounderSchema,
  timeframe: z
    .enum(['daily', 'weekly', 'monthly'])
    .default('daily')
    .describe('Time period for analysis'),
});

export type InsightsInput = z.infer<typeof InsightsSchema>;

// ENDPOINT 9: GRANT OPPORTUNITIES (Business Intelligence)
export const GrantOpportunitiesSchema = z.object({
  founder: FounderSchema,
});

export type GrantOpportunitiesInput = z.infer<typeof GrantOpportunitiesSchema>;

// ENDPOINT 10: TRACK RELATIONSHIP (Business Intelligence)
export const TrackRelationshipSchema = z.object({
  founder: FounderSchema,
  contactId: z
    .string()
    .min(2, 'Contact ID must be at least 2 characters'),
  action: z
    .string()
    .min(2, 'Action must be at least 2 characters')
    .describe('Type of interaction (e.g., email, call, meeting)'),
});

export type TrackRelationshipInput = z.infer<typeof TrackRelationshipSchema>;

// ENDPOINT 11: ALLOCATE BUDGET (Business Intelligence)
export const AllocateBudgetSchema = z.object({
  founder: FounderSchema,
  totalBudget: z
    .number()
    .positive('Budget must be greater than zero')
    .describe('Total budget to allocate'),
  goals: z
    .array(z.string())
    .optional()
    .describe('Business goals to inform allocation'),
});

export type AllocateBudgetInput = z.infer<typeof AllocateBudgetSchema>;

// ENDPOINT 12: GENERATE CONTENT (Business Intelligence)
export const GenerateContentSchema = z.object({
  founder: FounderSchema,
  platform: z
    .enum(['social', 'blog', 'email'])
    .describe('Platform for content'),
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters'),
});

export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

// ENDPOINT 13: GENERATE BRAND STORY (Business Intelligence)
export const GenerateBrandStorySchema = z.object({
  founder: FounderSchema,
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters'),
  values: z
    .array(z.string())
    .optional()
    .describe('Core company values'),
});

export type GenerateBrandStoryInput = z.infer<typeof GenerateBrandStorySchema>;

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { success: true, data } or { success: false, errors, status: 400 }.
 */
export function parseVoiceRequest<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: boolean; data?: T; errors?: string[]; status?: number } {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path || 'body'}: ${issue.message}`;
    });
    return { success: false as const, errors, status: 400 };
  }

  return { success: true, data: result.data };
}
