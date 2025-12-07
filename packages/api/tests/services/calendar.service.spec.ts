/**
 * Tests for Calendar Service - Phase 2B Issues 2 & 3
 * Tests listUpcomingEvents, insertEvent, deleteEvent, and conflict detection
 */

import { CalendarService, CalendarError, CalendarEvent } from '../../src/services/calendar.service';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    calendar: jest.fn().mockReturnValue({
      events: {
        list: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        patch: jest.fn(),
      },
      freebusy: {
        query: jest.fn(),
      },
    }),
  },
}));

// Mock fs to simulate credentials file
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalendarService();
  });

  describe('initialization', () => {
    it('should initialize correctly', () => {
      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(true);
    });

    it('should return status information', () => {
      const status = service.getStatus();
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('credentialsPath');
      expect(status).toHaveProperty('defaultCalendarId');
    });
  });

  describe('listUpcomingEvents', () => {
    it('should list events with default options', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Test Meeting',
          start: { dateTime: '2025-12-10T10:00:00Z' },
          end: { dateTime: '2025-12-10T11:00:00Z' },
          status: 'confirmed',
          htmlLink: 'https://calendar.google.com/event1',
        },
      ];

      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: mockEvents },
      });

      const events = await service.listUpcomingEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('id', 'event1');
      expect(events[0]).toHaveProperty('summary', 'Test Meeting');
      expect(events[0]).toHaveProperty('isAllDay', false);
    });

    it('should handle empty event list', async () => {
      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: [] },
      });

      const events = await service.listUpcomingEvents();
      expect(events).toHaveLength(0);
    });

    it('should accept custom options', async () => {
      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: [] },
      });

      await service.listUpcomingEvents({
        calendarId: 'custom@calendar.com',
        maxResults: 5,
        timeMin: new Date('2025-12-01'),
        timeMax: new Date('2025-12-31'),
      });

      expect(google.calendar().events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'custom@calendar.com',
          maxResults: 5,
        })
      );
    });
  });

  describe('insertEvent', () => {
    it('should create a new event', async () => {
      const mockResponse = {
        id: 'new-event-123',
        summary: 'New Meeting',
        start: { dateTime: '2025-12-10T14:00:00Z' },
        end: { dateTime: '2025-12-10T15:00:00Z' },
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/new-event-123',
      };

      const { google } = require('googleapis');
      google.calendar().events.insert.mockResolvedValue({
        data: mockResponse,
      });

      const result = await service.insertEvent('primary', {
        summary: 'New Meeting',
        startTime: new Date('2025-12-10T14:00:00Z'),
        endTime: new Date('2025-12-10T15:00:00Z'),
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('new-event-123');
      expect(result.event).toHaveProperty('summary', 'New Meeting');
    });

    it('should handle event creation with attendees', async () => {
      const mockResponse = {
        id: 'event-with-attendees',
        summary: 'Team Sync',
        start: { dateTime: '2025-12-10T14:00:00Z' },
        end: { dateTime: '2025-12-10T15:00:00Z' },
        status: 'confirmed',
        attendees: [{ email: 'team@example.com' }],
        htmlLink: 'https://calendar.google.com/event-with-attendees',
      };

      const { google } = require('googleapis');
      google.calendar().events.insert.mockResolvedValue({
        data: mockResponse,
      });

      const result = await service.insertEvent('primary', {
        summary: 'Team Sync',
        startTime: new Date('2025-12-10T14:00:00Z'),
        endTime: new Date('2025-12-10T15:00:00Z'),
        attendees: ['team@example.com'],
      });

      expect(result.success).toBe(true);
      expect(result.event.attendees).toContain('team@example.com');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an existing event', async () => {
      const { google } = require('googleapis');
      google.calendar().events.delete.mockResolvedValue({});

      const result = await service.deleteEvent('primary', 'event-to-delete');

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-to-delete');
    });

    it('should handle already deleted events gracefully', async () => {
      const { google } = require('googleapis');
      google.calendar().events.delete.mockRejectedValue({ code: 404 });

      const result = await service.deleteEvent('primary', 'already-deleted');

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('already-deleted');
    });

    it('should handle delete errors', async () => {
      const { google } = require('googleapis');
      google.calendar().events.delete.mockRejectedValue({
        code: 500,
        message: 'Internal error',
      });

      const result = await service.deleteEvent('primary', 'error-event');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getEvent', () => {
    it('should fetch a single event', async () => {
      const mockEvent = {
        id: 'single-event',
        summary: 'Single Event',
        start: { dateTime: '2025-12-10T10:00:00Z' },
        end: { dateTime: '2025-12-10T11:00:00Z' },
        status: 'confirmed',
      };

      const { google } = require('googleapis');
      google.calendar().events.get.mockResolvedValue({
        data: mockEvent,
      });

      const event = await service.getEvent('primary', 'single-event');

      expect(event.id).toBe('single-event');
      expect(event.summary).toBe('Single Event');
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const mockResponse = {
        id: 'updated-event',
        summary: 'Updated Title',
        start: { dateTime: '2025-12-10T14:00:00Z' },
        end: { dateTime: '2025-12-10T15:00:00Z' },
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/updated-event',
      };

      const { google } = require('googleapis');
      google.calendar().events.patch.mockResolvedValue({
        data: mockResponse,
      });

      const result = await service.updateEvent('primary', 'updated-event', {
        summary: 'Updated Title',
      });

      expect(result.success).toBe(true);
      expect(result.event.summary).toBe('Updated Title');
    });
  });

  describe('checkConflicts', () => {
    it('should detect conflicting events', async () => {
      const mockEvents = [
        { summary: 'Existing Meeting 1' },
        { summary: 'Existing Meeting 2' },
      ];

      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: mockEvents },
      });

      const conflicts = await service.checkConflicts(
        'primary',
        new Date('2025-12-10T10:00:00Z'),
        new Date('2025-12-10T11:00:00Z')
      );

      expect(conflicts).toHaveLength(2);
      expect(conflicts).toContain('Existing Meeting 1');
      expect(conflicts).toContain('Existing Meeting 2');
    });

    it('should return empty array when no conflicts', async () => {
      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: [] },
      });

      const conflicts = await service.checkConflicts(
        'primary',
        new Date('2025-12-10T10:00:00Z'),
        new Date('2025-12-10T11:00:00Z')
      );

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('CalendarError', () => {
    it('should create proper error instances', () => {
      const error = new CalendarError('Test error', 'ACCESS_DENIED');

      expect(error.name).toBe('CalendarError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('ACCESS_DENIED');
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original');
      const error = new CalendarError('Wrapped error', 'API_ERROR', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  // ============================================================================
  // CONFLICT DETECTION TESTS (Phase 2B Issue 3)
  // ============================================================================

  describe('hasConflict', () => {
    // Helper to create mock CalendarEvent objects
    const createMockEvent = (
      id: string,
      summary: string,
      start: string,
      end: string,
      status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed'
    ): CalendarEvent => ({
      id,
      summary,
      start,
      end,
      status,
      description: null,
      timeZone: 'America/Los_Angeles',
      isAllDay: false,
      htmlLink: '',
      attendees: [],
      location: null,
      created: null,
      updated: null,
    });

    it('should detect overlapping events as conflicts', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting 1', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
      ];

      const proposedEvent = {
        start: new Date('2025-12-10T10:30:00Z'),
        end: new Date('2025-12-10T11:30:00Z'),
        summary: 'New Meeting',
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
      expect(result.conflictingEvents[0].summary).toBe('Meeting 1');
    });

    it('should NOT treat back-to-back events as conflicts by default', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting 1', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
      ];

      // Proposed event starts exactly when Meeting 1 ends
      const proposedEvent = {
        start: new Date('2025-12-10T11:00:00Z'),
        end: new Date('2025-12-10T12:00:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingEvents).toHaveLength(0);
    });

    it('should treat back-to-back as conflict when option is set', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting 1', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
      ];

      const proposedEvent = {
        start: new Date('2025-12-10T11:00:00Z'),
        end: new Date('2025-12-10T12:00:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent, {
        treatBackToBackAsConflict: true,
      });

      expect(result.hasConflict).toBe(true);
    });

    it('should return no conflict for non-overlapping events', () => {
      const existingEvents = [
        createMockEvent('1', 'Morning Meeting', '2025-12-10T09:00:00Z', '2025-12-10T10:00:00Z'),
        createMockEvent('2', 'Afternoon Meeting', '2025-12-10T14:00:00Z', '2025-12-10T15:00:00Z'),
      ];

      // Proposed event is in the gap
      const proposedEvent = {
        start: new Date('2025-12-10T11:00:00Z'),
        end: new Date('2025-12-10T12:00:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(false);
      expect(result.summary).toBe('No conflicts detected');
    });

    it('should detect multiple conflicts', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting 1', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
        createMockEvent('2', 'Meeting 2', '2025-12-10T10:30:00Z', '2025-12-10T11:30:00Z'),
      ];

      // Proposed event overlaps both
      const proposedEvent = {
        start: new Date('2025-12-10T10:15:00Z'),
        end: new Date('2025-12-10T11:15:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(2);
      expect(result.summary).toContain('2 events');
    });

    it('should ignore cancelled events by default', () => {
      const existingEvents = [
        createMockEvent('1', 'Cancelled Meeting', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z', 'cancelled'),
      ];

      const proposedEvent = {
        start: new Date('2025-12-10T10:30:00Z'),
        end: new Date('2025-12-10T11:30:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(false);
    });

    it('should respect buffer time', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting 1', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
      ];

      // Proposed event starts 30 min after Meeting 1 ends
      const proposedEvent = {
        start: new Date('2025-12-10T11:30:00Z'),
        end: new Date('2025-12-10T12:30:00Z'),
      };

      // Without buffer - no conflict
      const resultNoBuffer = service.hasConflict(existingEvents, proposedEvent);
      expect(resultNoBuffer.hasConflict).toBe(false);

      // With 30-minute buffer - conflict (buffer extends proposed event to 11:00)
      const resultWithBuffer = service.hasConflict(existingEvents, proposedEvent, {
        bufferMinutes: 30,
      });
      expect(resultWithBuffer.hasConflict).toBe(true);
    });

    it('should handle events spanning proposed event', () => {
      const existingEvents = [
        createMockEvent('1', 'All Day Block', '2025-12-10T08:00:00Z', '2025-12-10T18:00:00Z'),
      ];

      // Proposed event is within the existing event
      const proposedEvent = {
        start: new Date('2025-12-10T10:00:00Z'),
        end: new Date('2025-12-10T11:00:00Z'),
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(true);
    });

    it('should handle ISO string times', () => {
      const existingEvents = [
        createMockEvent('1', 'Meeting', '2025-12-10T10:00:00Z', '2025-12-10T11:00:00Z'),
      ];

      // Use ISO strings instead of Date objects
      const proposedEvent = {
        start: '2025-12-10T10:30:00Z',
        end: '2025-12-10T11:30:00Z',
      };

      const result = service.hasConflict(existingEvents, proposedEvent);

      expect(result.hasConflict).toBe(true);
    });

    it('should return empty array for empty existing events', () => {
      const proposedEvent = {
        start: new Date('2025-12-10T10:00:00Z'),
        end: new Date('2025-12-10T11:00:00Z'),
      };

      const result = service.hasConflict([], proposedEvent);

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingEvents).toHaveLength(0);
    });
  });

  describe('findAvailableSlots', () => {
    it('should find gaps between events', async () => {
      const mockEvents = [
        {
          id: '1',
          summary: 'Morning Meeting',
          start: { dateTime: '2025-12-10T09:00:00Z' },
          end: { dateTime: '2025-12-10T10:00:00Z' },
          status: 'confirmed',
        },
        {
          id: '2',
          summary: 'Lunch Meeting',
          start: { dateTime: '2025-12-10T12:00:00Z' },
          end: { dateTime: '2025-12-10T13:00:00Z' },
          status: 'confirmed',
        },
      ];

      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: mockEvents },
      });

      const slots = await service.findAvailableSlots(
        'primary',
        new Date('2025-12-10T08:00:00Z'),
        new Date('2025-12-10T17:00:00Z'),
        60 // 60-minute slots
      );

      // Should find slots: 8-9, 10-12, 13-17
      expect(slots.length).toBeGreaterThan(0);
    });
  });
});
