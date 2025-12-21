/**
 * P1 Tools Integration Test
 * Minimal test to verify calendar and email tools can be invoked
 */

import { runTool } from '../tool.registry';
import { ensureToolHandlersRegistered } from '../registerTools';

describe('P1 Tools Integration', () => {
  beforeAll(() => {
    ensureToolHandlersRegistered();
  });

  describe('CalendarTool', () => {
    it('should reject schedule without required fields', async () => {
      const result = await runTool({
        tool: 'calendar',
        action: 'schedule',
        input: {},
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('Missing required fields');
    });

    it('should reject reschedule without eventId', async () => {
      const result = await runTool({
        tool: 'calendar',
        action: 'reschedule',
        input: { summary: 'Updated title' },
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('Missing required field: eventId');
    });
  });

  describe('EmailTool', () => {
    it('should reject send_followup without required fields', async () => {
      const result = await runTool({
        tool: 'email',
        action: 'send_followup',
        input: {},
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('Missing required fields');
    });

    it('should reject invalid email format', async () => {
      const result = await runTool({
        tool: 'email',
        action: 'send_followup',
        input: {
          to: 'invalid-email',
          subject: 'Test',
          html: '<p>Test</p>',
        },
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.message).toContain('Invalid email format');
    });
  });

  describe('Tool Registry', () => {
    it('should return error for unknown tool', async () => {
      const result = await runTool({
        tool: 'unknown',
        action: 'action',
        input: {},
      });

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('NOT_IMPLEMENTED');
    });
  });
});
