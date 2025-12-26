# n8n Workflows for EM AI Ecosystem

This directory contains n8n workflow definitions that integrate with the EM AI Ecosystem dispatcher.

## Overview

**Total Workflows**: 4
**Integration Type**: Dispatcher-routed
**Purpose**: Automated agent execution via scheduled triggers and webhooks

---

## Workflows

### 1. Daily Brief (`daily-brief.json`)

**Trigger**: Schedule (Cron)
**Frequency**: Daily at 6:00 AM PT
**Agent**: `daily_brief`

**Flow**:
1. Cron trigger fires at 6 AM PT (14:00 UTC)
2. Calls dispatcher with intent `daily_brief`
3. Checks if response was successful
4. On success:
   - Sends Slack notification with brief summary
   - Creates Google Calendar event for brief review (6:00-6:15 AM)
5. On failure:
   - Sends Slack error notification

**Output**: Daily brief with top priority, focus blocks, energy forecast, and recommendations

**Configuration Required**:
- `DISPATCHER_URL`
- `FOUNDER_EMAIL`
- `SLACK_WEBHOOK_URL`
- `GOOGLE_CALENDAR_ID`
- Google Calendar OAuth2 credentials

---

### 2. Inbox Triage (`inbox-triage.json`)

**Trigger**: Schedule (Interval)
**Frequency**: Every 2 hours (8 AM - 6 PM PT only)
**Agent**: `inbox_assistant`

**Flow**:
1. Interval trigger fires every 2 hours
2. Checks if current time is within work hours (8 AM - 6 PM PT)
3. If yes:
   - Calls dispatcher with intent `inbox_assistant`
   - Processes email results (filters high priority, urgent, action-required)
   - Checks if there are urgent emails
   - Sends appropriate Slack notification (detailed for urgent, brief for normal)
4. If no (outside work hours): No-op, workflow ends

**Output**: Email triage summary with priorities, action items, and recommendations

**Configuration Required**:
- `DISPATCHER_URL`
- `FOUNDER_EMAIL`
- `SLACK_WEBHOOK_URL`

---

### 3. Voice Capture (`voice-capture.json`)

**Trigger**: Webhook (POST)
**Frequency**: On-demand (triggered by mobile app or voice interface)
**Agents**: `voice_companion` (via dispatcher)
**External Services**: Whisper (STT), ElevenLabs (TTS)

**Flow**:
1. Webhook receives POST with `audioUrl`, `userId`, `sessionId`
2. Parses payload
3. Calls Whisper API to transcribe audio to text
4. Sends transcription to dispatcher with intent `voice_companion`
5. Receives text response from voice companion agent
6. Calls ElevenLabs API to generate audio from text response
7. Prepares response with both text and audio
8. Responds to webhook caller with full data
9. Logs interaction to Slack

**Webhook URL**: `https://your-n8n-instance.com/webhook/voice-capture`

**Payload Format**:
```json
{
  "audioUrl": "https://storage.yourdomain.com/audio/recording.mp3",
  "userId": "founder@elevatedmovements.com",
  "sessionId": "session_12345" // optional, auto-generated if not provided
}
```

**Response Format**:
```json
{
  "success": true,
  "sessionId": "session_12345",
  "transcription": "Hey, I need help planning my day",
  "textResponse": "I'm here to help. What's your top priority today?",
  "audioUrl": "https://storage.yourdomain.com/voice-responses/session_12345.mp3",
  "detectedIntent": "task",
  "detectedMood": "focused",
  "followUpSuggestions": ["What's the first step?", "What resources do you need?"],
  "shouldEndSession": false,
  "sessionContext": {
    "turnCount": 1,
    "startedAt": "2025-12-26T14:30:00Z",
    "lastUpdatedAt": "2025-12-26T14:30:00Z",
    "topics": ["productivity"]
  }
}
```

**Configuration Required**:
- `DISPATCHER_URL`
- `FOUNDER_EMAIL`
- `OPENAI_API_KEY` (for Whisper)
- `WHISPER_API_URL`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_API_URL`
- `ELEVENLABS_VOICE_ID`
- `STORAGE_BASE_URL`
- `SLACK_WEBHOOK_URL`

---

### 4. Weekly Strategy (`weekly-strategy.json`)

**Trigger**: Schedule (Cron)
**Frequency**: Weekly on Sunday at 7:00 PM PT
**Agents**: `strategy_sync`, `insights`

**Flow**:
1. Cron trigger fires every Sunday at 7 PM PT
2. Calls dispatcher with intent `strategy_sync` (all systems, 30-day horizon)
3. Calls dispatcher with intent `insights` (7-day timeframe, energy & burnout)
4. Merges both responses into combined strategy review
5. Posts formatted summary to Slack
6. Logs full report to Notion database
7. Sends HTML email report to founder

**Output**: Comprehensive weekly review with:
- Strategic alignment score
- Cross-system gaps and synergies
- Prioritized recommendations
- Burnout risk assessment
- Energy trend analysis
- Key insights from past week

**Configuration Required**:
- `DISPATCHER_URL`
- `FOUNDER_EMAIL`
- `SENDER_EMAIL`
- `SLACK_WEBHOOK_URL`
- `NOTION_API_KEY`
- `NOTION_WEEKLY_STRATEGY_DB_ID`
- SMTP credentials for email sending

---

## Setup Instructions

### 1. Install n8n

```bash
npm install -g n8n

# Or use Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Set up Credentials in n8n

1. **Dispatcher API Key** (HTTP Header Auth):
   - Name: `Dispatcher API Key`
   - Header Name: `Authorization`
   - Header Value: `Bearer ${DISPATCHER_API_KEY}`

2. **Google Calendar** (OAuth2):
   - Name: `Google Calendar`
   - Follow OAuth2 setup in n8n UI

3. **OpenAI API** (HTTP Header Auth):
   - Name: `OpenAI API`
   - Header Name: `Authorization`
   - Header Value: `Bearer ${OPENAI_API_KEY}`

4. **ElevenLabs API** (HTTP Header Auth):
   - Name: `ElevenLabs API`
   - Header Name: `xi-api-key`
   - Header Value: `${ELEVENLABS_API_KEY}`

5. **Notion API** (API Key):
   - Name: `Notion API`
   - API Key: `${NOTION_API_KEY}`

6. **SMTP** (Email Send):
   - Configure your SMTP server details

### 4. Import Workflows

1. Open n8n UI (http://localhost:5678)
2. Click "Workflows" → "Import from File"
3. Import each JSON file from `workflows/` directory
4. For each workflow:
   - Update credential references if needed
   - Verify environment variable mappings
   - Test with manual execution

### 5. Activate Workflows

1. **daily-brief.json**: Activate (will run daily at 6 AM PT)
2. **inbox-triage.json**: Activate (will run every 2 hours during work hours)
3. **voice-capture.json**: Activate (webhook available immediately)
4. **weekly-strategy.json**: Activate (will run every Sunday at 7 PM PT)

---

## Testing Workflows

### Test Daily Brief

```bash
# Manually trigger via n8n UI or use this curl command
# (Note: This only works if you've exposed the workflow as a webhook)
curl -X POST http://localhost:5001/api/exec-admin/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "daily_brief",
    "payload": {
      "userId": "founder@elevatedmovements.com",
      "date": "2025-12-26"
    }
  }'
```

### Test Inbox Triage

```bash
curl -X POST http://localhost:5001/api/exec-admin/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "inbox_assistant",
    "payload": {
      "userId": "founder@elevatedmovements.com",
      "mode": "scan",
      "maxResults": 20
    }
  }'
```

### Test Voice Capture

```bash
curl -X POST https://your-n8n-instance.com/webhook/voice-capture \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/test-audio.mp3",
    "userId": "founder@elevatedmovements.com",
    "sessionId": "test_session_001"
  }'
```

### Test Weekly Strategy

```bash
# Trigger strategy_sync
curl -X POST http://localhost:5001/api/exec-admin/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "strategy_sync",
    "payload": {
      "userId": "founder@elevatedmovements.com",
      "systems": ["em", "quicklist", "grants", "meal-vision"],
      "timeHorizon": "30d",
      "focusArea": "all"
    }
  }'

# Trigger insights
curl -X POST http://localhost:5001/api/exec-admin/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "insights",
    "payload": {
      "userId": "founder@elevatedmovements.com",
      "timeframe": "7d",
      "includeEnergy": true,
      "includeBurnoutRisk": true
    }
  }'
```

---

## Workflow Diagrams

### Daily Brief Flow
```
Cron (6 AM PT)
  → Call Dispatcher (daily_brief)
    → Check Success
      → ✅ Slack Notification → Create Calendar Event
      → ❌ Slack Error Notification
```

### Inbox Triage Flow
```
Interval (Every 2hrs)
  → Check Work Hours (8 AM - 6 PM)
    → ✅ Call Dispatcher (inbox_assistant)
          → Process Results
            → Check Urgent
              → ⚠️ Detailed Slack Notification
              → ℹ️ Brief Slack Notification
    → ❌ No-op (End)
```

### Voice Capture Flow
```
Webhook (POST /voice-capture)
  → Parse Payload
    → Transcribe (Whisper STT)
      → Call Dispatcher (voice_companion)
        → Generate Audio (ElevenLabs TTS)
          → Prepare Response
            → Respond to Webhook
            → Log to Slack
```

### Weekly Strategy Flow
```
Cron (Sunday 7 PM PT)
  ├─→ Call Dispatcher (strategy_sync)
  └─→ Call Dispatcher (insights)
        → Merge Results
          → Post to Slack
            → Log to Notion
              → Send Email Report
```

---

## Monitoring & Logs

### n8n Execution Logs

View execution history in n8n UI:
- Dashboard → Executions
- Filter by workflow name
- Check success/failure status
- View detailed execution data

### Slack Notifications

All workflows send Slack notifications:
- **Daily Brief**: Morning summary at 6 AM PT
- **Inbox Triage**: Email summaries every 2 hours
- **Voice Capture**: Interaction logs on each voice request
- **Weekly Strategy**: Comprehensive review every Sunday at 7 PM PT

### Notion Logs (Weekly Strategy Only)

Weekly strategy reports are automatically logged to Notion database with fields:
- Name (week of...)
- Alignment Score
- Burnout Risk
- Energy Trend
- Top Gaps
- Recommendations
- Insights
- Date

---

## Troubleshooting

### Workflow Not Triggering

1. Check if workflow is activated (green toggle in n8n UI)
2. Verify cron expression syntax
3. Check timezone settings (should be `America/Los_Angeles`)
4. Review execution logs for errors

### Dispatcher Errors

1. Verify `DISPATCHER_URL` is correct and accessible
2. Check `DISPATCHER_API_KEY` is valid
3. Test dispatcher endpoint directly with curl
4. Review dispatcher logs for detailed error messages

### Credential Issues

1. Re-authenticate OAuth2 credentials (Google Calendar, Notion)
2. Verify API keys are not expired
3. Check header names and formats match exactly
4. Test credentials outside of n8n workflows

### Webhook Not Receiving Requests

1. Verify webhook is activated in n8n
2. Check webhook URL is publicly accessible
3. Test with curl or Postman
4. Review n8n webhook execution logs

---

## Advanced Configuration

### Custom Scheduling

To change schedule times, modify the cron expression in the workflow JSON:

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 6 * * *"  // Minute Hour Day Month Weekday
        }
      ]
    }
  }
}
```

**Cron Examples**:
- `0 6 * * *` - Daily at 6:00 AM
- `0 */2 * * *` - Every 2 hours
- `0 19 * * 0` - Every Sunday at 7:00 PM
- `0 9 * * 1-5` - Weekdays at 9:00 AM

### Adding New Workflows

1. Create a new JSON file in `workflows/` directory
2. Use existing workflows as templates
3. Ensure all nodes have unique IDs
4. Add proper connections between nodes
5. Tag workflow appropriately (P0/P1, dispatcher, etc.)
6. Document in this README

### Environment-Specific Configurations

For different environments (dev, staging, prod), use different `.env` files:

```bash
# Development
cp .env.example .env.dev

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.prod
```

Then load the appropriate file when starting n8n.

---

## Workflow Statistics

| Workflow | Nodes | Connections | External APIs | Credentials |
|----------|-------|-------------|---------------|-------------|
| daily-brief | 6 | 5 | 2 | 2 |
| inbox-triage | 8 | 7 | 1 | 1 |
| voice-capture | 8 | 7 | 3 | 3 |
| weekly-strategy | 7 | 6 | 4 | 3 |
| **Total** | **29** | **25** | **10** | **9** |

---

## Next Steps

After setting up these workflows:

1. ✅ Monitor first few executions to ensure proper functioning
2. ✅ Adjust Slack notification formats to your preference
3. ✅ Set up Notion database schema for weekly strategy logs
4. ✅ Configure email templates for weekly strategy report
5. ✅ Add error handling and retry logic as needed
6. ✅ Implement data retention policies
7. ✅ Set up monitoring and alerting for workflow failures

---

## Support

For issues or questions:
- Review n8n execution logs
- Check dispatcher API logs
- Test individual nodes in n8n UI
- Verify environment variables are loaded correctly

---

**Version**: 1.0
**Last Updated**: 2025-12-26
**Agent Dispatcher Version**: Wave 5 (18 agents)
