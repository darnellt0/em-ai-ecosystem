#!/bin/bash

# Quick Voice API Test with Audio
# This is the fastest way to hear voice responses from the API

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Quick Voice API Test with Audio                         ║"
echo "║       Tests the API and plays voice responses                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if ELEVENLABS_API_KEY is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ Error: ELEVENLABS_API_KEY not set"
  echo ""
  echo "To use voice, you need an ElevenLabs API key:"
  echo ""
  echo "1. Go to https://elevenlabs.io"
  echo "2. Sign up (free tier available)"
  echo "3. Go to Account → API Key"
  echo "4. Copy your key"
  echo "5. Export it:"
  echo ""
  echo "   export ELEVENLABS_API_KEY='sk-your-key-here'"
  echo ""
  echo "Then run this script again."
  echo ""
  exit 1
fi

# Check dependencies
if ! command -v curl &> /dev/null; then
  echo "❌ Error: curl not found. Install it and try again."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "⚠️  Note: jq not found. Installing would help with parsing"
  echo "   But we'll continue anyway..."
fi

if ! command -v ffplay &> /dev/null; then
  echo "⚠️  Warning: ffplay not found"
  echo "   Audio will be saved to files instead of played immediately"
  echo "   Install with: brew install ffmpeg"
  HAVE_FFPLAY=false
else
  HAVE_FFPLAY=true
fi

API_TOKEN="elevenlabs-voice-secure-token-2025"
API_URL="http://localhost:3000"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel (female, calm voice)

# Test function
test_with_voice() {
  local endpoint=$1
  local data=$2
  local description=$3

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Call the API
  echo "📡 Calling API..."
  RESPONSE=$(curl -s -X POST "$API_URL$endpoint" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data")

  # Extract the human summary
  if command -v jq &> /dev/null; then
    HUMAN_TEXT=$(echo "$RESPONSE" | jq -r '.humanSummary')
  else
    # Fallback without jq
    HUMAN_TEXT=$(echo "$RESPONSE" | grep -o '"humanSummary":"[^"]*' | cut -d'"' -f4)
  fi

  if [ -z "$HUMAN_TEXT" ] || [ "$HUMAN_TEXT" = "null" ]; then
    echo "❌ API Error:"
    echo "$RESPONSE" | head -200
    return 1
  fi

  echo "✅ API Response:"
  echo "   \"$HUMAN_TEXT\""
  echo ""

  # Generate audio
  echo "🎵 Generating voice with ElevenLabs..."
  AUDIO_FILE="/tmp/voice_response_$(date +%s).mp3"

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
    echo "✅ Audio generated"
    echo ""

    if [ "$HAVE_FFPLAY" = true ]; then
      echo "🔊 Playing audio..."
      ffplay -autoexit -nodisp "$AUDIO_FILE" 2>/dev/null
    else
      echo "📁 Audio saved to: $AUDIO_FILE"
      echo "   Open this file in any audio player"
      echo ""
      echo "   To auto-play (macOS): open $AUDIO_FILE"
      echo "   Or install ffmpeg: brew install ffmpeg"
    fi
  else
    echo "❌ Audio generation failed"
    echo "   Check your ElevenLabs API key"
  fi

  echo ""
}

# Get current time for date endpoints
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime; print(datetime.utcnow().isoformat() + 'Z')" || echo "2025-11-01T21:00:00Z")

# Run tests
test_with_voice \
  "/api/voice/scheduler/block" \
  '{"minutes": 45, "founder": "shria"}' \
  "Test 1: Block 45 minutes for focus"

test_with_voice \
  "/api/voice/scheduler/confirm" \
  "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  "Test 2: Confirm meeting"

test_with_voice \
  "/api/voice/coach/pause" \
  '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  "Test 3: Start 60-second meditation"

test_with_voice \
  "/api/voice/support/log-complete" \
  '{"taskId": "task-789", "note": "Completed", "founder": "shria"}' \
  "Test 4: Mark task complete"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ Testing Complete!                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "You just heard the Voice API with ElevenLabs TTS!"
echo ""
echo "Next steps:"
echo "  • Edit the script to test other endpoints"
echo "  • Change VOICE_ID to use different voices"
echo "  • When ready, wire real agents into the API"
echo ""
