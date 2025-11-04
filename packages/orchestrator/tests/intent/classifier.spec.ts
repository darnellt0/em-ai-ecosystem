import { IntentClassifier } from '../../src/intent/classifier';
import { VoiceIntent } from '../../src/intent/types';

describe('IntentClassifier', () => {
  const classifier = new IntentClassifier();

  const cases: Array<{ text: string; intent: VoiceIntent }> = [
    { text: 'Block 30 minutes for focus time this afternoon', intent: 'scheduler.block' },
    { text: 'Please confirm the meeting with the investor', intent: 'scheduler.confirm' },
    { text: 'Can you reschedule the call to tomorrow at 3pm?', intent: 'scheduler.reschedule' },
    { text: 'I need a meditation break for 5 minutes', intent: 'coach.pause' },
    { text: 'Log that task as complete', intent: 'support.logComplete' },
    { text: 'Set a follow up reminder for Friday', intent: 'support.followUp' },
  ];

  it.each(cases)('detects %s as %s', async ({ text, intent }) => {
    const result = await classifier.classify(text);
    expect(result.intent).toBe(intent);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('extracts entities like minutes, time and date', async () => {
    const text = 'Block 2 hours tomorrow at 4:30pm for the product review meeting';
    const result = await classifier.classify(text);
    expect(result.entities.minutes).toBe(120);
    expect(result.entities.date).toBe('tomorrow');
    expect(result.entities.time).toBe('4:30 pm');
    expect(result.entities.title).toContain('product review');
  });

  it('uses fallback when no rule matches', async () => {
    const text = 'Sing me a song';
    const result = await classifier.classify(text);
    expect(result.usedFallback).toBe(true);
    expect(result.intent).toBe('unknown');
  });
});
