#!/bin/bash

# Simple Voice API Test (No jq required)
# This version works without JSON parsing tools

set -e

API_TOKEN="elevenlabs-voice-secure-token-2025"
API_URL="http://localhost:3000"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Voice API Test - Simple Version                         ║"
echo "║       No jq required - direct audio playback                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ Error: ELEVENLABS_API_KEY not set"
  exit 1
fi

test_endpoint() {
  local path=$1
  local data=$2
  local description=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "📡 Calling API..."

  # Call API and save response
  RESPONSE=$(curl -s -X POST "$API_URL$path" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data")

  echo "✅ Got response"
  echo "   Raw: $RESPONSE" | head -c 200
  echo ""

  # Try to extract humanSummary using grep (no jq needed)
  HUMAN_TEXT=$(echo "$RESPONSE" | grep -o '"humanSummary":"[^"]*' | head -1 | cut -d'"' -f4 || echo "")

  if [ -z "$HUMAN_TEXT" ]; then
    echo "❌ Could not parse response"
    echo "Full response:"
    echo "$RESPONSE"
    return 1
  fi

  echo "💬 Response Text:"
  echo "   \"$HUMAN_TEXT\""
  echo ""

  # Generate audio
  echo "🎵 Generating voice with ElevenLabs..."
  AUDIO_FILE="/tmp/voice_$(date +%s).mp3"

  # Send to ElevenLabs for TTS
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
    -H "Content-Type: application/json" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -d '{
      "text": "'"$(echo "$HUMAN_TEXT" | sed 's/"/\\"/g')"'",
      "model_id": "eleven_monolingual_v1",
      "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75
      }
    }' > "$AUDIO_FILE" 2>/dev/null

  if [ -s "$AUDIO_FILE" ]; then
    echo "✅ Audio generated ($(du -h "$AUDIO_FILE" | cut -f1))"
    echo ""
    echo "🔊 Playing audio..."
    ffplay -autoexit -nodisp "$AUDIO_FILE" 2>/dev/null
    echo "✅ Done"
  else
    echo "❌ Audio generation failed"
  fi

  echo ""
  sleep 2
}

# Get current time
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Test 1
test_endpoint \
  "/api/voice/scheduler/block" \
  '{"minutes": 45, "founder": "shria"}' \
  "Test 1: Block Focus Time"

# Test 2
test_endpoint \
  "/api/voice/scheduler/confirm" \
  "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  "Test 2: Confirm Meeting"

# Test 3
test_endpoint \
  "/api/voice/coach/pause" \
  '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  "Test 3: Start Meditation"

# Test 4
test_endpoint \
  "/api/voice/support/log-complete" \
  '{"taskId": "task-789", "note": "Completed", "founder": "shria"}' \
  "Test 4: Log Task Complete"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ All Tests Complete!                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "You just heard the Voice API with ElevenLabs TTS!"
echo ""
