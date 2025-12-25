# P1 Wave 4 Status

## Intents Added
- brand_story
- membership_guardian

## Payload Examples
Brand Storyteller:
```json
{
  "intent": "brand_story",
  "payload": {
    "userId": "founder@elevatedmovements.com",
    "mode": "offline",
    "context": "post",
    "audience": "community",
    "content": "Im hosting a session next week. Pull up.",
    "toneHint": "warm, direct"
  }
}
```

Membership Guardian:
```json
{
  "intent": "membership_guardian",
  "payload": {
    "memberId": "m_123",
    "mode": "offline",
    "timeframe": "30d",
    "signals": {
      "engagement": 2,
      "missedTouchpoints": 4,
      "sentiment": "negative"
    }
  }
}
```

## Sample Responses
Brand Storyteller (offline):
```json
{
  "runId": "brand_1735060000000_abcd1234",
  "userId": "founder@elevatedmovements.com",
  "context": "post",
  "audience": "community",
  "alignedContent": "Quick clarity: Im hosting a session next week. Pull up. Reply if you want the next step.",
  "voiceNotes": [
    "Simplified phrasing to prioritize clarity and action.",
    "Aligned tone for community in a post context."
  ],
  "confidenceScore": 0.75,
  "recommendedNextAction": "Approve this draft or share any tone tweaks."
}
```

Membership Guardian (offline):
```json
{
  "runId": "member_1735060000000_wxyz9876",
  "memberId": "m_123",
  "timeframe": "30d",
  "status": "at_risk",
  "signalsDetected": ["low_engagement", "missed_touchpoints", "negative_sentiment"],
  "recommendedIntervention": {
    "type": "escalate",
    "messageDraft": "We noticed some missed touchpoints and want to support you. Open to a short check-in?"
  },
  "confidenceScore": 0.8
}
```

## Degradation Behavior
- Missing content (brand_story): returns a placeholder alignedContent, low confidence, and requests source copy.
- Missing context/audience (brand_story): defaults to community/post, lowers confidence, asks for confirmation.
- Missing signals (membership_guardian): status = watch, signalsDetected includes "missing_signals", confidence reduced, asks for inputs.
- Low confidence: safe default output that still passes QA, with a clear recommended next action.
- Offline services: deterministic offline output with a manual workaround prompt.

## Tests
Unit tests:
```
npm -w packages/api test
```

Integration tests (optional):
```
npm -w packages/api test:integration
```
