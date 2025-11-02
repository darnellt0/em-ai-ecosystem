#!/bin/bash

# Voice API Test using Docker Container
# Calls API from within container, then plays audio locally

API_TOKEN="elevenlabs-voice-secure-token-2025"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel (default)
CONTAINER="em-api"
VOICE_NAME="Rachel"

# Allow voice selection via command line argument
if [ -n "$1" ]; then
  case "$1" in
    clyde|male)
      VOICE_ID="IKne3meq5aSrNqZdkZeT"
      VOICE_NAME="Clyde (Male)"
      ;;
    bella|warm)
      VOICE_ID="EXAVITQu4zMVzdu7eNkl"
      VOICE_NAME="Bella (Female)"
      ;;
    josh|young)
      VOICE_ID="pNInz6obpgDQGcFmaJgB"
      VOICE_NAME="Josh (Male)"
      ;;
    sara|clear)
      VOICE_ID="ZQe5CZNOzWyzPSCn5a3c"
      VOICE_NAME="Sara (Female)"
      ;;
  esac
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Voice API Test - Docker Edition                         ║"
echo "║       Voice: $VOICE_NAME"
echo "║       Calls API from container, plays audio locally           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ Error: ELEVENLABS_API_KEY not set"
  exit 1
fi

# Verify container is running
if ! docker ps | grep -q "$CONTAINER"; then
  echo "❌ Error: Container $CONTAINER is not running"
  echo "Run: docker-compose ps"
  exit 1
fi

echo "✅ Container is running"
echo "✅ ElevenLabs API key is set"
echo ""

test_endpoint() {
  local path=$1
  local data=$2
  local description=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "📡 Calling API from container..."

  # Call API from within container
  RESPONSE=$(docker exec "$CONTAINER" node -e "
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '$path',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $API_TOKEN'
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data)));
  });
});
req.write(JSON.stringify($data));
req.end();
" 2>&1)

  if [ -z "$RESPONSE" ]; then
    echo "❌ No response from API"
    return 1
  fi

  echo "✅ Got response"

  # Extract humanSummary (bash equivalent of jq)
  HUMAN_TEXT=$(echo "$RESPONSE" | grep -o '"humanSummary":"[^"]*' | cut -d'"' -f4 || echo "")

  if [ -z "$HUMAN_TEXT" ]; then
    echo "❌ Could not parse response"
    echo "$RESPONSE"
    return 1
  fi

  echo "💬 Response Text:"
  echo "   \"$HUMAN_TEXT\""
  echo ""

  # Generate audio using ElevenLabs
  echo "🎵 Generating voice with ElevenLabs..."
  AUDIO_FILE="/tmp/voice_$(date +%s).mp3"

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
    SIZE=$(du -h "$AUDIO_FILE" | cut -f1)
    echo "✅ Audio generated ($SIZE)"
    echo ""
    echo "🔊 Playing audio..."
    ffplay -autoexit -nodisp "$AUDIO_FILE" 2>/dev/null || echo "⚠️  Could not play audio"
    echo "✅ Done playing"
  else
    echo "❌ Audio generation failed"
  fi

  echo ""
  sleep 1
}

# Get current time
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Test 1: Block Focus
test_endpoint \
  "/api/voice/scheduler/block" \
  '{"minutes": 45, "founder": "shria"}' \
  "Test 1: Block Focus Time"

# Test 2: Confirm Meeting
test_endpoint \
  "/api/voice/scheduler/confirm" \
  "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  "Test 2: Confirm Meeting"

# Test 3: Start Meditation
test_endpoint \
  "/api/voice/coach/pause" \
  '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  "Test 3: Start Meditation"

# Test 4: Log Task Complete
test_endpoint \
  "/api/voice/support/log-complete" \
  '{"taskId": "task-789", "note": "Completed successfully", "founder": "shria"}' \
  "Test 4: Log Task Complete"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ All Tests Complete!                    ║"
echo "║                                                                ║"
echo "║         You just heard the Voice API with ElevenLabs TTS!     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  • Try different voices by editing VOICE_ID in this script"
echo "  • Test other endpoints (reschedule, follow-up)"
echo "  • When ready, wire real agents into voice.services.ts"
echo ""
