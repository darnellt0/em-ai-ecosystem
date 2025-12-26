/**
 * P1 Wave 5 Tests - Relationship Tracker, Voice Companion, Creative Director
 *
 * Tests for the three P1 Wave 5 agents:
 * - relationship_track
 * - voice_companion
 * - creative_direct
 */

import { runP1RelationshipTracker } from '../../src/exec-admin/flows/p1-relationship-tracker';
import { runP1VoiceCompanion } from '../../src/exec-admin/flows/p1-voice-companion';
import { runP1CreativeDirector } from '../../src/exec-admin/flows/p1-creative-director';
import { runP0QaGate } from '../../src/services/p0QaGate.service';

describe('P1 Wave 5 - Relationship Tracker', () => {
  test('should list contacts with default action', async () => {
    const result = await runP1RelationshipTracker({
      userId: 'test@example.com',
    });

    expect(result).toHaveProperty('runId');
    expect(result).toHaveProperty('userId', 'test@example.com');
    expect(result).toHaveProperty('action', 'list');
    expect(result).toHaveProperty('contacts');
    expect(result).toHaveProperty('stats');
    expect(result.stats).toHaveProperty('totalContacts');
    expect(result.stats).toHaveProperty('overdue');
    expect(result.stats).toHaveProperty('dueSoon');
    expect(result.stats).toHaveProperty('ok');
    expect(result).toHaveProperty('confidenceScore');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(1);
  });

  test('should get specific contact', async () => {
    const result = await runP1RelationshipTracker({
      userId: 'test@example.com',
      action: 'get',
      contactId: 'contact_001',
    });

    expect(result).toHaveProperty('action', 'get');
    expect(result).toHaveProperty('contact');
    if (result.contact) {
      expect(result.contact).toHaveProperty('contactId');
      expect(result.contact).toHaveProperty('name');
      expect(result.contact).toHaveProperty('relationship');
      expect(result.contact).toHaveProperty('daysSinceContact');
      expect(result.contact).toHaveProperty('touchpointStatus');
    }
  });

  test('should suggest touchpoints', async () => {
    const result = await runP1RelationshipTracker({
      userId: 'test@example.com',
      action: 'suggest_touchpoints',
    });

    expect(result).toHaveProperty('action', 'suggest_touchpoints');
    expect(result).toHaveProperty('touchpointSuggestions');
    expect(Array.isArray(result.touchpointSuggestions)).toBe(true);
  });

  test('should filter contacts by status', async () => {
    const result = await runP1RelationshipTracker({
      userId: 'test@example.com',
      action: 'list',
      filters: {
        status: 'overdue',
      },
    });

    expect(result).toHaveProperty('contacts');
    if (Array.isArray(result.contacts)) {
      result.contacts.forEach((contact) => {
        expect(contact.touchpointStatus).toBe('overdue');
      });
    }
  });

  test('should pass QA gate validation', async () => {
    const result = await runP1RelationshipTracker({
      userId: 'test@example.com',
      action: 'list',
    });

    const qaResult = runP0QaGate('relationshipTracker', result);
    expect(qaResult.qa_pass).toBe(true);
    expect(qaResult.issues).toHaveLength(0);
  });

  test('should degrade gracefully without userId', async () => {
    const result = await runP1RelationshipTracker({
      userId: '',
      action: 'list',
    });

    expect(result.confidenceScore).toBeLessThan(1);
    expect(result).toHaveProperty('insight');
  });
});

describe('P1 Wave 5 - Voice Companion', () => {
  test('should handle basic conversation', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'Hello, how are you?',
    });

    expect(result).toHaveProperty('runId');
    expect(result).toHaveProperty('userId', 'test@example.com');
    expect(result).toHaveProperty('sessionId');
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('detectedIntent');
    expect(result).toHaveProperty('detectedMood');
    expect(result).toHaveProperty('sessionContext');
    expect(result.sessionContext).toHaveProperty('turnCount');
    expect(result.sessionContext.turnCount).toBeGreaterThan(0);
    expect(result).toHaveProperty('confidenceScore');
  });

  test('should detect question intent', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'What is my schedule today?',
    });

    expect(result.detectedIntent).toBe('question');
  });

  test('should detect task intent', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'Remind me to call Sarah tomorrow',
    });

    expect(result.detectedIntent).toBe('task');
  });

  test('should detect reflection intent', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'I feel like I need to refocus my energy',
    });

    expect(result.detectedIntent).toBe('reflection');
  });

  test('should detect social intent and goodbye', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'Goodbye, see you later!',
    });

    expect(result.detectedIntent).toBe('social');
    expect(result.shouldEndSession).toBe(true);
  });

  test('should provide follow-up suggestions', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'I want to plan my week',
    });

    expect(result).toHaveProperty('followUpSuggestions');
    expect(Array.isArray(result.followUpSuggestions)).toBe(true);
    expect(result.followUpSuggestions!.length).toBeGreaterThan(0);
  });

  test('should pass QA gate validation', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: 'How can you help me today?',
    });

    const qaResult = runP0QaGate('voiceCompanion', result);
    expect(qaResult.qa_pass).toBe(true);
    expect(qaResult.issues).toHaveLength(0);
  });

  test('should degrade gracefully with empty message', async () => {
    const result = await runP1VoiceCompanion({
      userId: 'test@example.com',
      userMessage: '',
    });

    expect(result.confidenceScore).toBeLessThan(1);
  });
});

describe('P1 Wave 5 - Creative Director', () => {
  test('should generate visual concepts', async () => {
    const result = await runP1CreativeDirector({
      userId: 'test@example.com',
      requestType: 'concept',
      project: {
        platform: 'instagram',
        goal: 'engagement',
      },
    });

    expect(result).toHaveProperty('runId');
    expect(result).toHaveProperty('userId', 'test@example.com');
    expect(result).toHaveProperty('requestType', 'concept');
    expect(result).toHaveProperty('concepts');
    expect(Array.isArray(result.concepts)).toBe(true);
    expect(result.concepts!.length).toBeGreaterThan(0);

    const concept = result.concepts![0];
    expect(concept).toHaveProperty('conceptId');
    expect(concept).toHaveProperty('title');
    expect(concept).toHaveProperty('description');
    expect(concept).toHaveProperty('visualElements');
    expect(concept).toHaveProperty('colorPalette');
    expect(concept).toHaveProperty('typography');
    expect(concept).toHaveProperty('brandAlignment');
  });

  test('should check brand alignment', async () => {
    const result = await runP1CreativeDirector({
      userId: 'test@example.com',
      requestType: 'brand_check',
      brandContext: {
        business: 'em',
        tone: 'inspirational',
      },
      existingAsset: {
        colors: ['#1A1A2E', '#E94560'],
      },
    });

    expect(result).toHaveProperty('requestType', 'brand_check');
    expect(result).toHaveProperty('brandCheck');
    expect(result.brandCheck).toHaveProperty('aligned');
    expect(result.brandCheck).toHaveProperty('score');
    expect(result.brandCheck).toHaveProperty('strengths');
    expect(result.brandCheck).toHaveProperty('improvements');
    expect(result.brandCheck!.score).toBeGreaterThanOrEqual(0);
    expect(result.brandCheck!.score).toBeLessThanOrEqual(100);
  });

  test('should suggest assets', async () => {
    const result = await runP1CreativeDirector({
      userId: 'test@example.com',
      requestType: 'asset_suggest',
      project: {
        platform: 'email',
        goal: 'conversion',
      },
    });

    expect(result).toHaveProperty('requestType', 'asset_suggest');
    expect(result).toHaveProperty('assetRecommendations');
    expect(Array.isArray(result.assetRecommendations)).toBe(true);
    expect(result.assetRecommendations!.length).toBeGreaterThan(0);

    const recommendation = result.assetRecommendations![0];
    expect(recommendation).toHaveProperty('assetType');
    expect(recommendation).toHaveProperty('platform');
    expect(recommendation).toHaveProperty('purpose');
    expect(recommendation).toHaveProperty('specs');
    expect(recommendation).toHaveProperty('priority');
  });

  test('should generate campaign theme', async () => {
    const result = await runP1CreativeDirector({
      userId: 'test@example.com',
      requestType: 'campaign_theme',
      brandContext: {
        business: 'quicklist',
      },
    });

    expect(result).toHaveProperty('requestType', 'campaign_theme');
    expect(result).toHaveProperty('campaignTheme');
    expect(result.campaignTheme).toHaveProperty('name');
    expect(result.campaignTheme).toHaveProperty('tagline');
    expect(result.campaignTheme).toHaveProperty('coreMessage');
    expect(result.campaignTheme).toHaveProperty('visualDirection');
    expect(result.campaignTheme).toHaveProperty('contentPillars');
    expect(Array.isArray(result.campaignTheme!.contentPillars)).toBe(true);
  });

  test('should pass QA gate validation', async () => {
    const result = await runP1CreativeDirector({
      userId: 'test@example.com',
      requestType: 'concept',
    });

    const qaResult = runP0QaGate('creativeDirector', result);
    expect(qaResult.qa_pass).toBe(true);
    expect(qaResult.issues).toHaveLength(0);
  });

  test('should degrade gracefully without userId', async () => {
    const result = await runP1CreativeDirector({
      userId: '',
      requestType: 'concept',
    });

    expect(result.confidenceScore).toBeLessThan(1);
    expect(result).toHaveProperty('insight');
    expect(result).toHaveProperty('recommendedNextAction');
  });
});

describe('P1 Wave 5 - Integration Tests', () => {
  test('all Wave 5 agents should return offline mode by default', async () => {
    const relationshipResult = await runP1RelationshipTracker({ userId: 'test@example.com' });
    const voiceResult = await runP1VoiceCompanion({ userId: 'test@example.com', userMessage: 'Hello' });
    const creativeResult = await runP1CreativeDirector({ userId: 'test@example.com', requestType: 'concept' });

    expect(relationshipResult.offline).toBe(true);
    expect(voiceResult.offline).toBe(true);
    expect(creativeResult.offline).toBe(true);
  });

  test('all Wave 5 agents should have valid runIds', async () => {
    const relationshipResult = await runP1RelationshipTracker({ userId: 'test@example.com' });
    const voiceResult = await runP1VoiceCompanion({ userId: 'test@example.com', userMessage: 'Hello' });
    const creativeResult = await runP1CreativeDirector({ userId: 'test@example.com', requestType: 'concept' });

    expect(relationshipResult.runId).toMatch(/^relationship_track_\d+$/);
    expect(voiceResult.runId).toMatch(/^voice_companion_\d+$/);
    expect(creativeResult.runId).toMatch(/^creative_direct_\d+$/);
  });

  test('all Wave 5 agents should pass QA gate', async () => {
    const relationshipResult = await runP1RelationshipTracker({ userId: 'test@example.com' });
    const voiceResult = await runP1VoiceCompanion({ userId: 'test@example.com', userMessage: 'Hello' });
    const creativeResult = await runP1CreativeDirector({ userId: 'test@example.com', requestType: 'concept' });

    const relationshipQa = runP0QaGate('relationshipTracker', relationshipResult);
    const voiceQa = runP0QaGate('voiceCompanion', voiceResult);
    const creativeQa = runP0QaGate('creativeDirector', creativeResult);

    expect(relationshipQa.qa_pass).toBe(true);
    expect(voiceQa.qa_pass).toBe(true);
    expect(creativeQa.qa_pass).toBe(true);
  });
});
