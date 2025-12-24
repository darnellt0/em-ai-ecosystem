import { runP0QaGate } from '../../src/services/p0QaGate.service';

describe('P0 Wave 3 - Insight Analyst & Niche Discovery', () => {

  describe('Insight Analyst QA', () => {

    it('passes valid insights output', () => {
      const output = {
        userId: 'founder@test.com',
        timeframe: 'daily',
        period: { start: '2025-12-24T00:00:00Z', end: '2025-12-24T23:59:59Z' },
        insights: [
          { type: 'focus', title: 'Focus', description: '120 mins', trend: 'up', recommendation: 'Keep it up' }
        ],
        energyScore: { current: 75, trend: 'stable', factors: ['Good focus'] },
        burnoutRisk: { level: 'low', indicators: ['Balanced'], recommendations: ['Maintain'] },
        summary: 'Energy score: 75/100. 1 insights generated.',
        generatedAt: '2025-12-24T12:00:00Z'
      };
      const result = runP0QaGate('insights', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails insights missing userId', () => {
      const output = {
        timeframe: 'daily',
        period: {},
        insights: ['test'],
        summary: 'Test',
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('insights', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'userId')).toBe(true);
    });

    it('fails insights with empty insights array', () => {
      const output = {
        userId: 'test@test.com',
        timeframe: 'daily',
        period: {},
        insights: [],
        summary: 'Test',
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('insights', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'insights')).toBe(true);
    });
  });

  describe('Niche Discovery QA', () => {

    it('passes valid niche_discover output', () => {
      const output = {
        userId: 'founder@test.com',
        stage: 'skills',
        nextStage: 'passions',
        progress: 20,
        prompt: 'What are your top skills?',
        previousResponses: { start: ['AI', 'Coaching'] },
        isComplete: false
      };
      const result = runP0QaGate('nicheDiscover', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('passes complete niche discovery with themes', () => {
      const output = {
        userId: 'founder@test.com',
        stage: 'synthesize',
        nextStage: null,
        progress: 100,
        prompt: 'Your niche discovery is complete!',
        previousResponses: {
          skills: ['AI', 'Coaching'],
          passions: ['Helping founders'],
          audience: ['Tech founders'],
          impact: ['Reduce burnout']
        },
        themes: [
          { name: 'AI for Coaching', description: 'Test', keywords: ['AI'], matchScore: 0.85 }
        ],
        suggestedNiche: {
          statement: 'Help tech founders reduce burnout',
          audience: 'Tech founders',
          uniqueValue: 'AI-powered coaching',
          keywords: ['AI', 'coaching']
        },
        isComplete: true
      };
      const result = runP0QaGate('nicheDiscover', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails niche_discover missing prompt', () => {
      const output = {
        userId: 'test@test.com',
        stage: 'start',
        progress: 0,
        previousResponses: {},
        isComplete: false
      };
      const result = runP0QaGate('nicheDiscover', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'prompt')).toBe(true);
    });

    it('fails niche_discover with invalid progress', () => {
      const output = {
        userId: 'test@test.com',
        stage: 'start',
        progress: 150,  // Invalid: > 100
        prompt: 'Test prompt',
        previousResponses: {},
        isComplete: false
      };
      const result = runP0QaGate('nicheDiscover', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'progress')).toBe(true);
    });
  });
});
