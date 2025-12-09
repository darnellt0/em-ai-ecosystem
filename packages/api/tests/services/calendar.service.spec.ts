/**
 * Tests for Calendar Service - Phase 2B Issue 2
 * Tests listUpcomingEvents, insertEvent, deleteEvent functionality
 */

import {
  CalendarService,
  CalendarError,
  ConflictResult,
} from '../../src/services/calendar.service';

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

  describe('hasConflict (pure)', () => {
    const baseEvent = {
      id: 'evt1',
      summary: 'Existing',
      description: null,
      start: '2025-12-10T10:00:00Z',
      end: '2025-12-10T11:00:00Z',
      timeZone: 'UTC',
      isAllDay: false,
      status: 'confirmed' as const,
      htmlLink: '',
      attendees: [],
      location: null,
      created: null,
      updated: null,
    };

    it('no overlap => no conflict', () => {
      const result: ConflictResult = service.hasConflict(
        [baseEvent],
        { summary: 'Proposed', start: '2025-12-10T11:00:00Z', end: '2025-12-10T12:00:00Z' }
      );
      expect(result.hasConflict).toBe(false);
    });

    it('partial overlap => conflict', () => {
      const result: ConflictResult = service.hasConflict(
        [baseEvent],
        { summary: 'Proposed', start: '2025-12-10T10:30:00Z', end: '2025-12-10T11:30:00Z' }
      );
      expect(result.hasConflict).toBe(true);
    });

    it('full overlap => conflict', () => {
      const result: ConflictResult = service.hasConflict(
        [baseEvent],
        { summary: 'Proposed', start: '2025-12-10T10:05:00Z', end: '2025-12-10T10:55:00Z' }
      );
      expect(result.hasConflict).toBe(true);
    });

    it('back-to-back not conflict by default', () => {
      const result: ConflictResult = service.hasConflict(
        [baseEvent],
        { summary: 'Proposed', start: '2025-12-10T09:00:00Z', end: '2025-12-10T10:00:00Z' }
      );
      expect(result.hasConflict).toBe(false);
    });

    it('back-to-back conflicts when option enabled', () => {
      const result: ConflictResult = service.hasConflict(
        [baseEvent],
        {
          summary: 'Proposed',
          start: '2025-12-10T09:00:00Z',
          end: '2025-12-10T10:00:00Z',
        },
        { treatBackToBackAsConflict: true }
      );
      expect(result.hasConflict).toBe(true);
    });
  });

  describe('checkEventConflicts (integration)', () => {
    it('detects conflicts from calendar data', async () => {
      const mockEvents = [
        {
          id: 'existing',
          summary: 'Existing Meeting',
          start: { dateTime: '2025-12-10T10:00:00Z' },
          end: { dateTime: '2025-12-10T11:00:00Z' },
          status: 'confirmed',
          htmlLink: '',
        },
      ];

      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: mockEvents },
      });

      const result = await service.checkEventConflicts('primary', {
        summary: 'Proposed',
        start: '2025-12-10T10:30:00Z',
        end: '2025-12-10T11:30:00Z',
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEvents).toHaveLength(1);
    });

    it('returns no conflict when window is free', async () => {
      const { google } = require('googleapis');
      google.calendar().events.list.mockResolvedValue({
        data: { items: [] },
      });

      const result = await service.checkEventConflicts('primary', {
        summary: 'Proposed',
        start: '2025-12-10T12:00:00Z',
        end: '2025-12-10T13:00:00Z',
      });

      expect(result.hasConflict).toBe(false);
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
});
