/**
 * Tests for individual growth agents
 */

import { JournalAgent } from '../../src/growth-agents/journal-agent';
import { NicheAgent } from '../../src/growth-agents/niche-agent';
import { MindsetAgent } from '../../src/growth-agents/mindset-agent';
import { RhythmAgent } from '../../src/growth-agents/rhythm-agent';
import { PurposeAgent } from '../../src/growth-agents/purpose-agent';

// Mock dependencies
jest.mock('ioredis');
jest.mock('googleapis');
jest.mock('openai');
jest.mock('nodemailer');
jest.mock('puppeteer');
jest.mock('twilio');

describe('Growth Agents', () => {
  describe('JournalAgent', () => {
    let agent: JournalAgent;

    beforeEach(() => {
      agent = new JournalAgent({ name: 'journal', phase: 'Rooted', priority: 1 });
    });

    it('should initialize correctly', () => {
      expect(agent).toBeDefined();
    });

    it('should have run and validate methods', () => {
      expect(typeof agent.run).toBe('function');
      expect(typeof agent.validate).toBe('function');
    });

    it('should execute full lifecycle', async () => {
      const result = await agent.execute();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('artifacts');
    });
  });

  describe('NicheAgent', () => {
    let agent: NicheAgent;

    beforeEach(() => {
      agent = new NicheAgent({ name: 'niche', phase: 'Grounded', priority: 2 });
    });

    it('should initialize correctly', () => {
      expect(agent).toBeDefined();
    });

    it('should execute full lifecycle', async () => {
      const result = await agent.execute();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('outputs');
    });
  });

  describe('MindsetAgent', () => {
    let agent: MindsetAgent;

    beforeEach(() => {
      agent = new MindsetAgent({ name: 'mindset', phase: 'Grounded', priority: 3 });
    });

    it('should initialize correctly', () => {
      expect(agent).toBeDefined();
    });

    it('should execute full lifecycle', async () => {
      const result = await agent.execute();
      expect(result).toHaveProperty('success');
    });
  });

  describe('RhythmAgent', () => {
    let agent: RhythmAgent;

    beforeEach(() => {
      agent = new RhythmAgent({ name: 'rhythm', phase: 'Rooted', priority: 4 });
    });

    it('should initialize correctly', () => {
      expect(agent).toBeDefined();
    });

    it('should execute full lifecycle', async () => {
      const result = await agent.execute();
      expect(result).toHaveProperty('success');
    });
  });

  describe('PurposeAgent', () => {
    let agent: PurposeAgent;

    beforeEach(() => {
      agent = new PurposeAgent({ name: 'purpose', phase: 'Radiant', priority: 5 });
    });

    it('should initialize correctly', () => {
      expect(agent).toBeDefined();
    });

    it('should execute full lifecycle', async () => {
      const result = await agent.execute();
      expect(result).toHaveProperty('success');
    });
  });
});
