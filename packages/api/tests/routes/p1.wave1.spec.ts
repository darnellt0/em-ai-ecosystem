import { runP0QaGate } from '../../src/services/p0QaGate.service';

describe('P1 Wave 1 - Growth Agents (Mindset, Rhythm, Purpose)', () => {

  describe('Mindset Agent QA', () => {

    it('passes valid mindset output', () => {
      const output = {
        userId: 'founder@test.com',
        beliefs: [
          {
            limiting: "I'm not good enough",
            reframe: "I'm learning and growing every day",
            evidence: "Past successes, positive feedback",
            actionStep: "Write down three recent wins"
          }
        ],
        challenge: "Impostor syndrome",
        offline: false,
        generatedAt: '2025-12-24T12:00:00Z'
      };
      const result = runP0QaGate('mindset', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails mindset missing userId', () => {
      const output = {
        beliefs: [],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('mindset', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'userId')).toBe(true);
    });

    it('fails mindset with empty beliefs array', () => {
      const output = {
        userId: 'test@test.com',
        beliefs: [],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('mindset', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'beliefs')).toBe(true);
    });
  });

  describe('Rhythm Agent QA', () => {

    it('passes valid rhythm output', () => {
      const output = {
        userId: 'founder@test.com',
        energyMap: {
          peak: ['8am-11am'],
          low: ['2pm-3pm'],
          moderate: ['11am-2pm']
        },
        recommendations: [
          {
            timeBlock: '8am-10am',
            activity: 'Deep work',
            reason: 'Peak energy'
          }
        ],
        offline: false,
        generatedAt: '2025-12-24T12:00:00Z'
      };
      const result = runP0QaGate('rhythm', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails rhythm missing energyMap', () => {
      const output = {
        userId: 'test@test.com',
        recommendations: [],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('rhythm', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'energyMap')).toBe(true);
    });

    it('fails rhythm with empty recommendations', () => {
      const output = {
        userId: 'test@test.com',
        energyMap: { peak: [], low: [], moderate: [] },
        recommendations: [],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('rhythm', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'recommendations')).toBe(true);
    });
  });

  describe('Purpose Agent QA', () => {

    it('passes valid purpose output', () => {
      const output = {
        userId: 'founder@test.com',
        ikigai: {
          skills: ['Coaching', 'AI'],
          passions: ['Helping founders'],
          values: ['Authenticity', 'Impact'],
          audience: 'Tech founders',
          impact: 'Reduce burnout'
        },
        purposeStatement: 'Help tech founders reduce burnout through AI-powered coaching',
        alignment: {
          skillsMatch: 85,
          passionMatch: 90,
          valuesMatch: 80,
          overall: 85
        },
        recommendations: ['Validate with clients', 'Create content'],
        offline: false,
        generatedAt: '2025-12-24T12:00:00Z'
      };
      const result = runP0QaGate('purpose', output);
      expect(result.qa_pass).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('fails purpose with invalid alignment scores', () => {
      const output = {
        userId: 'test@test.com',
        ikigai: {
          skills: ['Test'],
          passions: ['Test'],
          values: ['Test'],
          audience: 'Test',
          impact: 'Test'
        },
        purposeStatement: 'Test',
        alignment: {
          skillsMatch: 150,  // Invalid: > 100
          passionMatch: 90,
          valuesMatch: 80,
          overall: 85
        },
        recommendations: ['Test'],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('purpose', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'alignment.skillsMatch')).toBe(true);
    });

    it('fails purpose with empty recommendations', () => {
      const output = {
        userId: 'test@test.com',
        ikigai: {
          skills: [],
          passions: [],
          values: [],
          audience: 'Test',
          impact: 'Test'
        },
        purposeStatement: 'Test',
        alignment: {
          skillsMatch: 80,
          passionMatch: 80,
          valuesMatch: 80,
          overall: 80
        },
        recommendations: [],
        offline: false,
        generatedAt: '2025-12-24'
      };
      const result = runP0QaGate('purpose', output);
      expect(result.qa_pass).toBe(false);
      expect(result.issues.some(i => i.field === 'recommendations')).toBe(true);
    });
  });
});
