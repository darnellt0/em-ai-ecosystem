import { mcpManager } from '../../src/services/mcp/mcpClientManager';
import { CalendarMCPService } from '../../src/services/mcp/calendarMcp.service';
import { GmailMCPService } from '../../src/services/mcp/gmailMcp.service';

describe('MCP Client Manager', () => {
  afterAll(async () => {
    await mcpManager.disconnectAll();
  });

  describe('when MCP is disabled', () => {
    beforeAll(() => {
      process.env.USE_MCP = 'false';
    });

    it('should not initialize servers', async () => {
      await mcpManager.initialize();
      expect(mcpManager.listServers()).toHaveLength(0);
    });
  });

  describe('isAvailable checks', () => {
    it('CalendarMCPService.isAvailable returns false when not connected', () => {
      expect(CalendarMCPService.isAvailable()).toBe(false);
    });

    it('GmailMCPService.isAvailable returns false when not connected', () => {
      expect(GmailMCPService.isAvailable()).toBe(false);
    });
  });
});

describe('Hybrid Services (Fallback Mode)', () => {
  beforeAll(() => {
    process.env.USE_MCP = 'false';
  });

  it('HybridCalendarService uses direct mode when MCP disabled', async () => {
    const { HybridCalendarService } = await import('../../src/services/calendar.hybrid.service');
    expect(HybridCalendarService.getMode()).toBe('direct');
  });

  it('HybridInboxService uses direct mode when MCP disabled', async () => {
    const { HybridInboxService } = await import('../../src/services/inbox.hybrid.service');
    expect(HybridInboxService.getMode()).toBe('direct');
  });
});
