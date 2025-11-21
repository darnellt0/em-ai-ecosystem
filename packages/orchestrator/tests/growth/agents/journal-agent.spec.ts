/**
 * Journal Agent Tests
 */

import { runJournalAgent } from '../../../src/growth/agents/journal-agent';
import { OrchestratorRunContext } from '../../../src/growth/types';

describe('JournalAgent', () => {
  it('should create journal entries successfully', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
      email: 'test@example.com',
    };

    const result = await runJournalAgent(ctx);

    expect(result.success).toBe(true);
    expect(result.artifacts).toBeDefined();
    expect(result.artifacts?.entriesCreated).toBeGreaterThan(0);
    expect(result.artifacts?.entries).toBeDefined();
    expect(Array.isArray(result.artifacts?.entries)).toBe(true);
  });

  it('should generate sentiment and topics for entries', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runJournalAgent(ctx);

    expect(result.success).toBe(true);
    const entries = result.artifacts?.entries as any[];
    expect(entries.length).toBeGreaterThan(0);

    const firstEntry = entries[0];
    expect(firstEntry.sentiment).toBeDefined();
    expect(typeof firstEntry.sentiment).toBe('number');
    expect(firstEntry.sentiment).toBeGreaterThanOrEqual(0);
    expect(firstEntry.sentiment).toBeLessThanOrEqual(1);
    expect(Array.isArray(firstEntry.topics)).toBe(true);
  });

  it('should include config information in artifacts', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runJournalAgent(ctx);

    expect(result.artifacts?.config).toBeDefined();
    expect(result.artifacts?.config.googleSheetsEnabled).toBeDefined();
    expect(result.artifacts?.config.sheetName).toBe('EM_Journal');
  });

  it('should record start and completion times', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runJournalAgent(ctx);

    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(new Date(result.completedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(result.startedAt).getTime()
    );
  });

  it('should handle errors gracefully', async () => {
    // This test verifies that the agent doesn't crash on error
    const ctx: OrchestratorRunContext = {
      userId: '',
    };

    const result = await runJournalAgent(ctx);

    // Should still return a result
    expect(result).toBeDefined();
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });
});
