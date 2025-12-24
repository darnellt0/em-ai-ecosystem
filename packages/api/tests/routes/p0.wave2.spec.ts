import { runP0QaGate } from '../../src/services/p0QaGate.service';

describe('P0 Wave 2 - Calendar Optimizer & Financial Allocator', () => {

  describe('Calendar Optimizer QA', () => {

    it('passes valid calendar_optimize output', () => {
      const output = {
        userId: 'founder@test.com',
        calendarId: 'primary',
        analyzedPeriod: { start: '2025-12-24', end: '2025-12-31' },
        currentLoad: { totalEvents: 10, meetingHours: 15, focusBlocksFound: 3 },
        suggestedBlocks: [
          { start: '2025-12-25T09:00:00Z', end: '2025-12-25T10:30:00Z', type: 'deep_focus', reason: 'Prime time' }
        ],
        conflicts: [],
        recommendations: ['Calendar looks balanced'],
        optimizationScore: 75
      };
      const result = runP0QaGate('calendarOptimize', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails calendar_optimize missing userId', () => {
      const output = {
        calendarId: 'primary',
        analyzedPeriod: { start: '2025-12-24', end: '2025-12-31' },
        currentLoad: { totalEvents: 10 },
        suggestedBlocks: [],
        conflicts: [],
        recommendations: ['Test'],
        optimizationScore: 50
      };
      const result = runP0QaGate('calendarOptimize', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'userId')).toBe(true);
    });

    it('fails calendar_optimize with empty recommendations', () => {
      const output = {
        userId: 'test@test.com',
        calendarId: 'primary',
        analyzedPeriod: {},
        currentLoad: {},
        suggestedBlocks: [],
        conflicts: [],
        recommendations: [],
        optimizationScore: 50
      };
      const result = runP0QaGate('calendarOptimize', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'recommendations')).toBe(true);
    });

    it('fails calendar_optimize with invalid score', () => {
      const output = {
        userId: 'test@test.com',
        calendarId: 'primary',
        analyzedPeriod: {},
        currentLoad: {},
        suggestedBlocks: [],
        conflicts: [],
        recommendations: ['Test'],
        optimizationScore: 150  // Invalid: > 100
      };
      const result = runP0QaGate('calendarOptimize', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'optimizationScore')).toBe(true);
    });
  });

  describe('Financial Allocator QA', () => {

    it('passes valid financial_allocate output', () => {
      const output = {
        userId: 'founder@test.com',
        inputAmount: 10000,
        currency: 'USD',
        allocations: {
          ownerPay: { amount: 5000, percentage: 50 },
          taxes: { amount: 1500, percentage: 15 },
          expenses: { amount: 1500, percentage: 15 },
          rndGrowth: { amount: 1000, percentage: 10 },
          savings: { amount: 500, percentage: 5 },
          btc: { amount: 500, percentage: 5 }
        },
        totalAllocated: 10000,
        ratiosUsed: { ownerPay: 0.5, taxes: 0.15, expenses: 0.15, rndGrowth: 0.1, savings: 0.05, btc: 0.05 },
        recommendations: ['Total allocated: USD 10,000'],
        allocationDate: '2025-12-24T00:00:00Z'
      };
      const result = runP0QaGate('financialAllocate', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails financial_allocate missing inputAmount', () => {
      const output = {
        userId: 'test@test.com',
        currency: 'USD',
        allocations: {
          ownerPay: { amount: 0, percentage: 0 },
          taxes: { amount: 0, percentage: 0 },
          expenses: { amount: 0, percentage: 0 },
          rndGrowth: { amount: 0, percentage: 0 },
          savings: { amount: 0, percentage: 0 },
          btc: { amount: 0, percentage: 0 }
        },
        totalAllocated: 0,
        ratiosUsed: {},
        recommendations: [],
        allocationDate: '2025-12-24'
      };
      const result = runP0QaGate('financialAllocate', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'inputAmount')).toBe(true);
    });

    it('fails financial_allocate with wrong type for allocations', () => {
      const output = {
        userId: 'test@test.com',
        inputAmount: 1000,
        currency: 'USD',
        allocations: 'not an object',  // Wrong type
        totalAllocated: 1000,
        ratiosUsed: {},
        recommendations: ['Test'],
        allocationDate: '2025-12-24'
      };
      const result = runP0QaGate('financialAllocate', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'allocations')).toBe(true);
    });

    it('fails financial_allocate with missing allocation categories', () => {
      const output = {
        userId: 'test@test.com',
        inputAmount: 1000,
        currency: 'USD',
        allocations: {
          ownerPay: { amount: 1000, percentage: 100 }
          // Missing other categories
        },
        totalAllocated: 1000,
        ratiosUsed: {},
        recommendations: ['Test'],
        allocationDate: '2025-12-24'
      };
      const result = runP0QaGate('financialAllocate', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field.startsWith('allocations.'))).toBe(true);
    });
  });
});
