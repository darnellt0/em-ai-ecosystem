# 🧪 Manual Testing Guide - Voice API System

**Last Updated**: November 1, 2025
**Status**: Ready for Testing
**Voice**: Shria (Cloned Voice)

---

## 🚀 Quick Start - Test in 5 Minutes

### Prerequisites
- ✅ Docker container running (`em-api`)
- ✅ ElevenLabs API key set in environment
- ✅ Port 3000 accessible

### Verify System is Running
```bash
# Check if container is running
docker ps | grep em-api

# Check API health
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T..."
}
```

---

## 📋 Testing Levels

### LEVEL 1: Basic Smoke Test (5 minutes)
**Goal**: Verify the API is responding

```bash
# 1. Check health endpoint
curl http://localhost:3000/health

# 2. Check voice API is accessible
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}'

# 3. Check audio endpoint is accessible
curl -X GET http://localhost:3000/api/voice/audio/voices \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025"
```

---

### LEVEL 2: Voice API Testing (15 minutes)
**Goal**: Test all 6 voice endpoints

#### 2.1 Block Focus Time
```bash
curl -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 45,
    "reason": "Deep work session",
    "founder": "shria"
  }'
```

**Expected Response**:
```json
{
  "status": "ok",
  "humanSummary": "Blocked 45 minutes for focus on ...",
  "nextBestAction": "Silence notifications during this time.",
  "data": {
    "founderEmail": "shria",
    "blockStart": "2025-11-01T...",
    "blockEnd": "2025-11-01T...",
    "bufferMinutes": 10
  }
}
```

#### 2.2 Confirm Meeting
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Team Sync\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 60,
    \"founder\": \"shria\",
    \"location\": \"Conference Room A\"
  }"
```

**Expected**: Meeting added to calendar response

#### 2.3 Reschedule Meeting
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST http://localhost:3000/api/voice/scheduler/reschedule \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"evt-123\",
    \"newStartAtISO\": \"$NOW\",
    \"newDurationMinutes\": 45,
    \"founder\": \"shria\"
  }"
```

#### 2.4 Start Meditation (Pause)
```bash
curl -X POST http://localhost:3000/api/voice/coach/pause \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "grounding",
    "seconds": 60,
    "founder": "shria"
  }'
```

**Styles**: `grounding`, `breathing`, `body_scan`

#### 2.5 Log Task Complete
```bash
curl -X POST http://localhost:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-789",
    "note": "Completed the Q4 planning",
    "founder": "shria"
  }'
```

#### 2.6 Create Follow-up
```bash
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST http://localhost:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"Follow up on Q4 planning\",
    \"dueISO\": \"$NOW\",
    \"context\": \"From board meeting\",
    \"founder\": \"shria\"
  }"
```

---

### LEVEL 3: Audio Generation Testing (20 minutes)
**Goal**: Test text-to-speech with Shria voice

#### 3.1 Generate Single Audio (Base64)
```bash
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Production voice API with Shria is now live",
    "voiceId": "DoEstgRs2aKZVhKhJhnx",
    "returnFormat": "base64"
  }' > audio_response.json

cat audio_response.json
```

**Expected**:
```json
{
  "status": "ok",
  "audioBase64": "SUQzBAA...",
  "size": 58559,
  "format": "mp3",
  "voiceId": "DoEstgRs2aKZVhKhJhnx"
}
```

#### 3.2 Generate Audio (Stream)
```bash
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test audio streaming",
    "voiceId": "DoEstgRs2aKZVhKhJhnx",
    "returnFormat": "buffer"
  }' > test_audio.mp3

# Play the audio
ffplay test_audio.mp3
# or
open test_audio.mp3  # macOS
start test_audio.mp3  # Windows
xdg-open test_audio.mp3  # Linux
```

#### 3.3 List Available Voices
```bash
curl -X GET http://localhost:3000/api/voice/audio/voices \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025"
```

**Expected**:
```json
{
  "status": "ok",
  "default": "shria",
  "voices": [
    {
      "key": "shria",
      "voiceId": "DoEstgRs2aKZVhKhJhnx",
      "name": "Shria (Cloned Voice)",
      "description": "Custom cloned voice for primary responses"
    },
    // ... other voices
  ]
}
```

#### 3.4 Batch Generate Audio
```bash
curl -X POST http://localhost:3000/api/voice/audio/batch \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "Blocked 45 minutes for focus",
      "Added Team Sync to calendar",
      "Starting 60 second meditation"
    ],
    "voiceId": "DoEstgRs2aKZVhKhJhnx"
  }' > batch_response.json

cat batch_response.json
```

---

### LEVEL 4: Integration Testing (30 minutes)
**Goal**: Test end-to-end workflows

#### Workflow 1: Block Focus → Generate Audio
```bash
#!/bin/bash

echo "Step 1: Block focus time"
VOICE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}')

echo "Voice API Response:"
echo "$VOICE_RESPONSE" | jq .

# Extract the human summary
HUMAN_TEXT=$(echo "$VOICE_RESPONSE" | jq -r '.humanSummary')
echo ""
echo "Step 2: Generate audio from response"
echo "Text: $HUMAN_TEXT"

AUDIO_RESPONSE=$(curl -s -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$HUMAN_TEXT\",
    \"returnFormat\": \"base64\"
  }")

echo "Audio Response:"
echo "$AUDIO_RESPONSE" | jq '{status: .status, size: .size, format: .format}'
```

#### Workflow 2: Meeting Confirmation with Voice
```bash
#!/bin/bash

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Confirming meeting and generating voice..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/confirm \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Quarterly Planning\",
    \"startAtISO\": \"$NOW\",
    \"durationMinutes\": 90,
    \"founder\": \"shria\"
  }")

echo "Meeting Confirmed:"
echo "$RESPONSE" | jq .

# Generate audio
TEXT=$(echo "$RESPONSE" | jq -r '.humanSummary')
curl -s -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEXT\", \"returnFormat\": \"base64\"}" > meeting_audio.json

echo "Audio generated and saved to meeting_audio.json"
```

---

### LEVEL 5: Advanced Testing (45 minutes)
**Goal**: Test edge cases and performance

#### 5.1 Test Different Voices
```bash
# Test Josh voice (male)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is Josh, a young and energetic male voice",
    "voiceId": "pNInz6obpgDQGcFmaJgB"
  }' > josh_audio.mp3

# Test Sara voice (female)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is Sara, a helpful and clear voice",
    "voiceId": "ZQe5CZNOzWyzPSCn5a3c"
  }' > sara_audio.mp3

# Test Rachel voice (female)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is Rachel, calm and professional",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }' > rachel_audio.mp3
```

#### 5.2 Test Voice Settings
```bash
# High stability (consistent, less expressive)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "High stability version",
    "stability": 0.95,
    "similarity_boost": 0.75
  }' > high_stability.mp3

# Low stability (expressive, more variation)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Low stability version",
    "stability": 0.1,
    "similarity_boost": 0.75
  }' > low_stability.mp3
```

#### 5.3 Test Long Text
```bash
# Test with longer text
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "You have been invited to the quarterly planning meeting scheduled for Friday at 2 PM. The meeting will cover Q4 goals, budget allocation, and team restructuring. Please come prepared with your department updates and any concerns you would like to discuss."
  }' > long_text.mp3
```

#### 5.4 Test Error Cases
```bash
# Missing required auth
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}'

# Invalid text (empty)
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'

# Invalid stability value
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test",
    "stability": 1.5
  }'
```

---

## 🧬 Testing with Script

### Pre-Built Test Script
Use the existing script for comprehensive testing:

```bash
# Shria voice (default)
export ELEVENLABS_API_KEY="your-key"
bash test-voice-clean.sh shria

# Josh voice
bash test-voice-clean.sh josh

# Sara voice
bash test-voice-clean.sh sara

# Rachel voice
bash test-voice-clean.sh rachel
```

---

## 📊 What to Check During Testing

### ✅ API Response Quality
- [ ] Response status codes (200, 400, 401, 429, 500)
- [ ] Error messages are clear and actionable
- [ ] Response times are < 3 seconds
- [ ] Audio files are generated successfully

### ✅ Audio Quality
- [ ] Audio plays without errors
- [ ] Voice sounds like Shria
- [ ] No artifacts or distortion
- [ ] Audio matches the text content
- [ ] Volume is appropriate

### ✅ Authentication
- [ ] Valid token returns 200
- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Token is case-sensitive

### ✅ Rate Limiting
- [ ] Multiple requests within limit succeed
- [ ] Request 21+ times in 10 seconds → 429 error
- [ ] Limit resets after 10 seconds

### ✅ Validation
- [ ] Invalid input returns 400 with clear error
- [ ] Missing required fields return 400
- [ ] Type mismatches return 400

### ✅ Batch Processing
- [ ] Multiple texts process in parallel
- [ ] All succeed or fail independently
- [ ] Total time is ~3 seconds for 3 items

---

## 🐛 Troubleshooting Common Issues

### Issue: "Connection refused"
```bash
# Check if container is running
docker ps | grep em-api

# Start container if needed
docker-compose up -d em-api

# Check logs
docker logs em-api
```

### Issue: "401 Unauthorized"
```bash
# Verify bearer token is correct
# Token: elevenlabs-voice-secure-token-2025

# Make sure you're using -H "Authorization: Bearer ..."
# NOT -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" (with extra text)
```

### Issue: "Audio is empty or 1KB"
```bash
# This usually means ElevenLabs API failed
# Check your ELEVENLABS_API_KEY is set correctly
echo $ELEVENLABS_API_KEY

# Regenerate audio and check for errors
curl -X POST http://localhost:3000/api/voice/audio/generate \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "returnFormat": "base64"}' | jq .
```

### Issue: "No response from API"
```bash
# Check if container is healthy
docker ps
# Look for "health: starting" or "health: unhealthy"

# Check logs for errors
docker logs em-api | tail -50

# Restart container
docker-compose restart em-api
```

---

## 📈 Performance Baseline

Record these metrics during your testing:

| Test | Expected | Actual | Notes |
|------|----------|--------|-------|
| Health check | < 10ms | | |
| Voice API (block) | < 50ms | | |
| Audio generation (1x) | 2-3s | | |
| Batch generation (3x) | ~3s | | |
| Voice listing | < 50ms | | |

---

## 🎯 Testing Checklist

### Before You Start
- [ ] Docker container is running
- [ ] API is responding to health checks
- [ ] ElevenLabs API key is set

### Level 1: Basic
- [ ] Health endpoint responds
- [ ] Voice API endpoint responds
- [ ] Audio endpoint responds

### Level 2: Voice API
- [ ] Block focus works
- [ ] Confirm meeting works
- [ ] Reschedule works
- [ ] Pause/meditation works
- [ ] Log complete works
- [ ] Follow-up works

### Level 3: Audio Generation
- [ ] Single audio generates
- [ ] Audio plays correctly
- [ ] Voice listing works
- [ ] Batch generation works

### Level 4: Integration
- [ ] Block focus + audio generation works end-to-end
- [ ] Meeting + audio works
- [ ] Response text matches audio content

### Level 5: Advanced
- [ ] Different voices work (Josh, Sara, Rachel)
- [ ] Voice settings affect output
- [ ] Long text generates correctly
- [ ] Error cases handled properly
- [ ] Rate limiting works
- [ ] Authentication required

---

## 💡 Pro Tips

1. **Use `jq` for readable JSON output**:
   ```bash
   curl ... | jq .
   ```

2. **Save audio responses to files**:
   ```bash
   curl ... > output.mp3
   ```

3. **Test in parallel** using multiple terminals

4. **Monitor logs while testing**:
   ```bash
   docker logs em-api -f
   ```

5. **Use environment variables** for repeated values:
   ```bash
   AUTH="Authorization: Bearer elevenlabs-voice-secure-token-2025"
   curl -X GET ... -H "$AUTH"
   ```

---

## 🚀 Next Steps After Testing

Once you've completed Level 4 testing and everything passes:

1. **Go to production** - System is ready
2. **Wire real agents** - Replace mock responses in `voice.services.ts`
3. **Monitor performance** - Track audio generation times
4. **Gather feedback** - Test with real users
5. **Fine-tune voice** - Adjust settings based on feedback

---

**Happy Testing!** 🎉

If you encounter issues, check the logs and error responses first. Most problems are related to:
- Missing/invalid API keys
- Incorrect bearer token
- ElevenLabs API unavailability
- Rate limiting

You've got this! 💪
