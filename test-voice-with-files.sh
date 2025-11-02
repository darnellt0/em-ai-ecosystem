#!/bin/bash

# Voice API Test - Save MP3 files for manual playback
# This version saves audio files you can open directly

API_TOKEN="elevenlabs-voice-secure-token-2025"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY}"
VOICE_ID="${1:-IKne3meq5aSrNqZdkZeT}"  # Clyde by default
CONTAINER="em-api"
VOICE_NAME="Clyde (Male)"

if [ "$VOICE_ID" = "21m00Tcm4TlvDq8ikWAM" ]; then
  VOICE_NAME="Rachel (Female)"
elif [ "$VOICE_ID" = "EXAVITQu4zMVzdu7eNkl" ]; then
  VOICE_NAME="Bella (Female)"
elif [ "$VOICE_ID" = "pNInz6obpgDQGcFmaJgB" ]; then
  VOICE_NAME="Josh (Male)"
elif [ "$VOICE_ID" = "ZQe5CZNOzWyzPSCn5a3c" ]; then
  VOICE_NAME="Sara (Female)"
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Voice API Test - Save Audio Files                       ║"
echo "║       Voice: $VOICE_NAME"
echo "║       Files will be saved to current directory                ║"
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

echo "✅ Container is running"
echo "✅ ElevenLabs API key is set"
echo ""

test_endpoint() {
  local path=$1
  local data=$2
  local description=$3
  local filename=$4

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎤 $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "📡 Calling API..."

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

  # Extract humanSummary
  HUMAN_TEXT=$(echo "$RESPONSE" | grep -o '"humanSummary":"[^"]*' | cut -d'"' -f4 || echo "")

  if [ -z "$HUMAN_TEXT" ]; then
    echo "❌ Could not parse response"
    return 1
  fi

  echo "💬 Response: \"$HUMAN_TEXT\""
  echo ""

  # Generate audio using ElevenLabs
  echo "🎵 Generating voice with ElevenLabs..."
  AUDIO_FILE="${filename}.mp3"

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
    echo "✅ Audio saved to: $AUDIO_FILE ($SIZE)"
    echo "   Open this file to hear: $VOICE_NAME"
  else
    echo "❌ Audio generation failed"
  fi

  echo ""
  sleep 1
}

# Get current time
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Saving audio files with $VOICE_NAME voice..."
echo ""

# Test 1: Block Focus
test_endpoint \
  "/api/voice/scheduler/block" \
  '{"minutes": 45, "founder": "shria"}' \
  "Test 1: Block Focus Time" \
  "01_block_focus"

# Test 2: Confirm Meeting
test_endpoint \
  "/api/voice/scheduler/confirm" \
  "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  "Test 2: Confirm Meeting" \
  "02_confirm_meeting"

# Test 3: Start Meditation
test_endpoint \
  "/api/voice/coach/pause" \
  '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  "Test 3: Start Meditation" \
  "03_meditation"

# Test 4: Log Task Complete
test_endpoint \
  "/api/voice/support/log-complete" \
  '{"taskId": "task-789", "note": "Completed successfully", "founder": "shria"}' \
  "Test 4: Log Task Complete" \
  "04_task_complete"

# Test 5: Reschedule
test_endpoint \
  "/api/voice/scheduler/reschedule" \
  "{\"eventId\": \"evt-123\", \"newStartAtISO\": \"$NOW\", \"newDurationMinutes\": 45, \"founder\": \"darnell\"}" \
  "Test 5: Reschedule Meeting" \
  "05_reschedule"

# Test 6: Follow-up
test_endpoint \
  "/api/voice/support/follow-up" \
  "{\"subject\": \"Follow up on Q4 planning\", \"dueISO\": \"$NOW\", \"context\": \"From board meeting\", \"founder\": \"darnell\"}" \
  "Test 6: Create Follow-up" \
  "06_followup"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ All Tests Complete!                    ║"
echo "║                                                                ║"
echo "║              Audio files saved in current directory:           ║"
echo "║              01_block_focus.mp3                                ║"
echo "║              02_confirm_meeting.mp3                            ║"
echo "║              03_meditation.mp3                                 ║"
echo "║              04_task_complete.mp3                              ║"
echo "║              05_reschedule.mp3                                 ║"
echo "║              06_followup.mp3                                   ║"
echo "║                                                                ║"
echo "║  Open any file to hear $VOICE_NAME read the response!         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "To open an audio file:"
echo "  open 01_block_focus.mp3          (macOS)"
echo "  xdg-open 01_block_focus.mp3      (Linux)"
echo "  start 01_block_focus.mp3         (Windows)"
echo ""
echo "To try a different voice:"
echo "  bash test-voice-with-files.sh 21m00Tcm4TlvDq8ikWAM    # Rachel"
echo "  bash test-voice-with-files.sh EXAVITQu4zMVzdu7eNkl    # Bella"
echo "  bash test-voice-with-files.sh pNInz6obpgDQGcFmaJgB    # Josh"
echo "  bash test-voice-with-files.sh ZQe5CZNOzWyzPSCn5a3c    # Sara"
echo ""
