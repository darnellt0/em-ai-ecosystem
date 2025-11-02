#!/bin/bash

# Voice API Test - Clean version without sed issues
# Works with all voices reliably

API_TOKEN="elevenlabs-voice-secure-token-2025"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}"
VOICE_ID="DoEstgRs2aKZVhKhJhnx"  # Shria (cloned voice - default)
CONTAINER="em-api"
VOICE_NAME="Shria (Cloned Voice)"

# Allow voice selection via command line argument
if [ -n "$1" ]; then
  case "$1" in
    shria)
      VOICE_ID="DoEstgRs2aKZVhKhJhnx"
      VOICE_NAME="Shria (Cloned Voice)"
      ;;
    josh|male)
      VOICE_ID="pNInz6obpgDQGcFmaJgB"
      VOICE_NAME="Josh (Male - Young & Energetic)"
      ;;
    sara|female)
      VOICE_ID="ZQe5CZNOzWyzPSCn5a3c"
      VOICE_NAME="Sara (Female - Helpful & Clear)"
      ;;
    rachel|calm)
      VOICE_ID="21m00Tcm4TlvDq8ikWAM"
      VOICE_NAME="Rachel (Female - Calm & Professional)"
      ;;
  esac
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Voice API Test                                           ║"
echo "║       Voice: $VOICE_NAME"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$ELEVENLABS_API_KEY" ]; then
  echo "❌ Error: ELEVENLABS_API_KEY not set"
  exit 1
fi

if ! docker ps | grep -q "$CONTAINER"; then
  echo "❌ Error: Container $CONTAINER is not running"
  exit 1
fi

echo "✅ Container running"
echo "✅ API key set"
echo ""

test_endpoint() {
  local path=$1
  local data=$2
  local description=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

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

  # Extract humanSummary using Node.js (reliable JSON parsing)
  HUMAN_TEXT=$(echo "$RESPONSE" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.humanSummary || '');
" 2>/dev/null || echo "")

  if [ -z "$HUMAN_TEXT" ]; then
    echo "❌ Could not parse response"
    return 1
  fi

  echo "📡 API: \"$HUMAN_TEXT\""
  echo ""

  # Generate audio using ElevenLabs - use printf for proper escaping
  echo "🎵 Generating voice..."
  AUDIO_FILE="/tmp/voice_$(date +%s).mp3"

  # Escape quotes in the text for JSON
  ESCAPED_TEXT=$(echo "$HUMAN_TEXT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

  # Create temp JSON file using Node.js to avoid all escaping issues
  TEMP_JSON=$(mktemp)
  node -e "
const text = process.argv[1];
const json = {
  text: text,
  model_id: 'eleven_turbo_v2_5',
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75
  }
};
process.stdout.write(JSON.stringify(json));
" "$HUMAN_TEXT" > "$TEMP_JSON"

  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
    -H "Content-Type: application/json" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -d @"$TEMP_JSON" > "$AUDIO_FILE" 2>/dev/null

  rm -f "$TEMP_JSON"

  if [ -s "$AUDIO_FILE" ]; then
    SIZE=$(du -h "$AUDIO_FILE" | cut -f1)
    echo "✅ Audio generated ($SIZE)"
    echo "🔊 Playing..."
    ffplay -autoexit -nodisp "$AUDIO_FILE" 2>/dev/null
    echo "✅ Done"
  else
    echo "❌ Audio generation failed (file is empty)"
    # Try to see what error we got
    echo "Debug: Check your ElevenLabs API key"
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
  '{"taskId": "task-789", "note": "Completed", "founder": "shria"}' \
  "Test 4: Log Task Complete"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ All Tests Complete!                    ║"
echo "║         You heard the Voice API with $VOICE_NAME!            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Try other voices (available with your API key):"
echo "  bash test-voice-clean.sh josh        # Josh (Male - Young & Energetic)"
echo "  bash test-voice-clean.sh sara        # Sara (Female - Helpful & Clear)"
echo "  bash test-voice-clean.sh rachel      # Rachel (Female - Calm & Professional)"
echo ""
