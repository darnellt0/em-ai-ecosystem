# Testing Voice API with ElevenLabs Text-to-Speech

This guide shows how to test the API and actually **hear the voice responses** using ElevenLabs TTS.

---

## Setup: Get ElevenLabs API Key

1. **Create ElevenLabs Account**
   - Go to https://elevenlabs.io
   - Sign up (free tier available)
   - Go to API section

2. **Get Your API Key**
   - Copy your API key from https://elevenlabs.io/account
   - Export it:
     ```bash
     export ELEVENLABS_API_KEY="sk-your-key-here"
     ```

3. **Update .env file**
   ```bash
   ELEVENLABS_API_KEY=sk-your-key-here
   ```

---

## Option 1: Using curl + ffplay (Easiest)

Stream the audio directly from ElevenLabs while testing the API.

### Step 1: Test API and Get Response Text

```bash
# Call the API and capture the humanSummary
RESPONSE=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}')

# Extract the human-readable text
TEXT=$(echo "$RESPONSE" | jq -r '.humanSummary')
echo "API Response: $TEXT"
```

### Step 2: Convert to Speech with ElevenLabs

```bash
# Install ffplay (macOS: brew install ffmpeg, Linux: apt install ffmpeg, Windows: download ffmpeg)

TEXT="Blocked 45 minutes for focus on 11/1/2025, 9:26:06 PM."
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel (female voice)
API_KEY="sk-your-key-here"

curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
  -H "Content-Type: application/json" \
  -H "xi-api-key: $API_KEY" \
  -d '{
    "text": "'"$TEXT"'",
    "model_id": "eleven_monolingual_v1",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }' | ffplay -autoexit -nodisp -
```

### Step 3: Complete Script (All-in-One)

Save this as `test-voice-with-audio.sh`:

```bash
#!/bin/bash

API_TOKEN="elevenlabs-voice-secure-token-2025"
API_URL="http://localhost:3000"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-sk-your-key-here}"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

test_endpoint_with_voice() {
  local endpoint=$1
  local method=$2
  local data=$3
  local description=$4

  echo ""
  echo -e "${BLUE}Testing: $description${NC}"
  echo "Endpoint: $method $endpoint"
  echo ""

  # Call API
  RESPONSE=$(curl -s -X "$method" "$API_URL$endpoint" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data")

  # Extract text and status
  HUMAN_SUMMARY=$(echo "$RESPONSE" | jq -r '.humanSummary')
  STATUS=$(echo "$RESPONSE" | jq -r '.status')
  NEXT_ACTION=$(echo "$RESPONSE" | jq -r '.nextBestAction // "null"')

  echo -e "${GREEN}Response Status: $STATUS${NC}"
  echo "Human Summary: $HUMAN_SUMMARY"

  if [ "$NEXT_ACTION" != "null" ]; then
    echo "Next Action: $NEXT_ACTION"
  fi

  # Play audio if we have the API key
  if [ -n "$ELEVENLABS_API_KEY" ] && command -v ffplay &> /dev/null; then
    echo ""
    echo "🔊 Playing voice response..."
    TEXT_TO_SPEAK="$HUMAN_SUMMARY"

    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
      -H "Content-Type: application/json" \
      -H "xi-api-key: $ELEVENLABS_API_KEY" \
      -d '{
        "text": "'"$TEXT_TO_SPEAK"'",
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
          "stability": 0.5,
          "similarity_boost": 0.75
        }
      }' | ffplay -autoexit -nodisp - 2>/dev/null || echo "⚠️  ffplay not found. Install with: brew install ffmpeg"
  else
    if [ -z "$ELEVENLABS_API_KEY" ]; then
      echo "⚠️  ELEVENLABS_API_KEY not set. Set it to hear voice responses:"
      echo "   export ELEVENLABS_API_KEY='sk-your-key-here'"
    fi
  fi

  echo ""
  sleep 2
}

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    Voice API with Audio Testing                               ║"
echo "║    Using ElevenLabs for text-to-speech                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Get current time for date endpoints
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime; print(datetime.utcnow().isoformat() + 'Z')")

# Test 1: Block Focus
test_endpoint_with_voice \
  "/api/voice/scheduler/block" \
  "POST" \
  '{"minutes": 45, "founder": "shria"}' \
  "Block 45 minutes for focus"

# Test 2: Confirm Meeting
test_endpoint_with_voice \
  "/api/voice/scheduler/confirm" \
  "POST" \
  "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}" \
  "Confirm meeting"

# Test 3: Reschedule
test_endpoint_with_voice \
  "/api/voice/scheduler/reschedule" \
  "POST" \
  "{\"eventId\": \"evt-123\", \"newStartAtISO\": \"$NOW\", \"newDurationMinutes\": 30, \"founder\": \"darnell\"}" \
  "Reschedule meeting"

# Test 4: Pause/Meditation
test_endpoint_with_voice \
  "/api/voice/coach/pause" \
  "POST" \
  '{"style": "grounding", "seconds": 60, "founder": "shria"}' \
  "Start 60-second grounding meditation"

# Test 5: Log Complete
test_endpoint_with_voice \
  "/api/voice/support/log-complete" \
  "POST" \
  '{"taskId": "task-789", "note": "Completed", "founder": "shria"}' \
  "Log task as complete"

# Test 6: Follow-up
test_endpoint_with_voice \
  "/api/voice/support/follow-up" \
  "POST" \
  "{\"subject\": \"Follow up on Q4 planning\", \"dueISO\": \"$NOW\", \"founder\": \"darnell\"}" \
  "Create follow-up task"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Testing Complete!                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
```

Run it:
```bash
export ELEVENLABS_API_KEY="sk-your-key-here"
bash test-voice-with-audio.sh
```

---

## Option 2: Browser Testing with Audio

Create an interactive HTML page to test the API with voice playback.

### Create test-voice.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Voice API Tester</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    .endpoint-group {
      margin: 30px 0;
      padding: 20px;
      border-left: 4px solid #0066cc;
      background: #f9f9f9;
    }
    .endpoint-group h3 {
      margin-top: 0;
      color: #0066cc;
    }
    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
    }
    button:hover {
      background: #0052a3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    input[type="text"], input[type="number"], select {
      padding: 8px;
      margin-right: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .response {
      background: #f0f0f0;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin-top: 10px;
      border-radius: 4px;
    }
    .response.error {
      border-left-color: #ff6b6b;
      background: #ffe0e0;
    }
    .response h4 {
      margin-top: 0;
    }
    .response code {
      display: block;
      background: white;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin-top: 10px;
    }
    .audio-controls {
      margin: 10px 0;
    }
    #audioPlayer {
      width: 100%;
      margin-top: 10px;
    }
    .status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .status.ok {
      background: #d4edda;
      color: #155724;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
    }
    .loading {
      display: none;
      color: #0066cc;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎤 Voice API Tester with Audio</h1>

    <!-- Config -->
    <div class="endpoint-group">
      <h3>Configuration</h3>
      <label>API URL:</label>
      <input type="text" id="apiUrl" value="http://localhost:3000" style="width: 300px;">
      <br><br>
      <label>API Token:</label>
      <input type="text" id="apiToken" value="elevenlabs-voice-secure-token-2025" style="width: 300px;">
      <br><br>
      <label>ElevenLabs API Key:</label>
      <input type="password" id="elevenLabsKey" placeholder="sk-..." style="width: 300px;">
      <p style="font-size: 12px; color: #666;">Get your key from https://elevenlabs.io/account</p>
    </div>

    <!-- Endpoint 1: Block Focus -->
    <div class="endpoint-group">
      <h3>1. Block Focus Time</h3>
      <p>Schedule a focus block for deep work</p>
      <label>Minutes:</label>
      <input type="number" id="blockMinutes" value="45" min="1" max="240">
      <label>Founder:</label>
      <select id="blockFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('blockFocus')">Test & Play Audio</button>
      <div id="blockFocusResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Endpoint 2: Confirm Meeting -->
    <div class="endpoint-group">
      <h3>2. Confirm Meeting</h3>
      <p>Add a meeting to the calendar</p>
      <label>Meeting Title:</label>
      <input type="text" id="meetingTitle" value="Team Sync" style="width: 200px;">
      <label>Duration (min):</label>
      <input type="number" id="meetingDuration" value="60" min="1" max="480">
      <label>Founder:</label>
      <select id="meetingFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('confirmMeeting')">Test & Play Audio</button>
      <div id="confirmMeetingResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Endpoint 3: Reschedule -->
    <div class="endpoint-group">
      <h3>3. Reschedule Meeting</h3>
      <p>Move an event to a different time</p>
      <label>Event ID:</label>
      <input type="text" id="eventId" value="evt-123" style="width: 150px;">
      <label>New Duration (min):</label>
      <input type="number" id="rescheduleDuration" value="30" min="1" max="480">
      <label>Founder:</label>
      <select id="rescheduleFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('reschedule')">Test & Play Audio</button>
      <div id="rescheduleResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Endpoint 4: Pause -->
    <div class="endpoint-group">
      <h3>4. Start Meditation Pause</h3>
      <p>Initiate a guided pause session</p>
      <label>Style:</label>
      <select id="pauseStyle">
        <option value="grounding">Grounding (default)</option>
        <option value="breath">Box Breathing</option>
        <option value="box">4-4-4-4 Box</option>
        <option value="body-scan">Body Scan</option>
      </select>
      <label>Duration (sec):</label>
      <input type="number" id="pauseSeconds" value="60" min="1" max="300">
      <label>Founder:</label>
      <select id="pauseFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('pause')">Test & Play Audio</button>
      <div id="pauseResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Endpoint 5: Log Complete -->
    <div class="endpoint-group">
      <h3>5. Log Task Complete</h3>
      <p>Mark a task as complete</p>
      <label>Task ID:</label>
      <input type="text" id="taskId" value="task-789" style="width: 150px;">
      <label>Note:</label>
      <input type="text" id="completionNote" value="Completed successfully" style="width: 200px;">
      <label>Founder:</label>
      <select id="logFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('logComplete')">Test & Play Audio</button>
      <div id="logCompleteResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Endpoint 6: Follow-up -->
    <div class="endpoint-group">
      <h3>6. Create Follow-up</h3>
      <p>Create a follow-up task or reminder</p>
      <label>Subject:</label>
      <input type="text" id="followupSubject" value="Review Q4 planning" style="width: 250px;">
      <label>Context:</label>
      <input type="text" id="followupContext" value="From board meeting" style="width: 250px;">
      <label>Founder:</label>
      <select id="followupFounder">
        <option>shria</option>
        <option>darnell</option>
      </select>
      <button onclick="testEndpoint('followup')">Test & Play Audio</button>
      <div id="followupResponse" class="response" style="display:none;"></div>
    </div>

    <!-- Audio Player -->
    <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 4px;">
      <h3>🔊 Audio Playback</h3>
      <div id="audioStatus" class="loading"></div>
      <audio id="audioPlayer" controls style="width: 100%;"></audio>
    </div>
  </div>

  <script>
    async function testEndpoint(endpoint) {
      const apiUrl = document.getElementById('apiUrl').value;
      const apiToken = document.getElementById('apiToken').value;
      const elevenLabsKey = document.getElementById('elevenLabsKey').value;

      let path = '';
      let data = {};

      switch(endpoint) {
        case 'blockFocus':
          path = '/api/voice/scheduler/block';
          data = {
            minutes: parseInt(document.getElementById('blockMinutes').value),
            founder: document.getElementById('blockFounder').value
          };
          break;
        case 'confirmMeeting':
          path = '/api/voice/scheduler/confirm';
          data = {
            title: document.getElementById('meetingTitle').value,
            startAtISO: new Date().toISOString(),
            durationMinutes: parseInt(document.getElementById('meetingDuration').value),
            founder: document.getElementById('meetingFounder').value
          };
          break;
        case 'reschedule':
          path = '/api/voice/scheduler/reschedule';
          data = {
            eventId: document.getElementById('eventId').value,
            newStartAtISO: new Date().toISOString(),
            newDurationMinutes: parseInt(document.getElementById('rescheduleDuration').value),
            founder: document.getElementById('rescheduleFounder').value
          };
          break;
        case 'pause':
          path = '/api/voice/coach/pause';
          data = {
            style: document.getElementById('pauseStyle').value,
            seconds: parseInt(document.getElementById('pauseSeconds').value),
            founder: document.getElementById('pauseFounder').value
          };
          break;
        case 'logComplete':
          path = '/api/voice/support/log-complete';
          data = {
            taskId: document.getElementById('taskId').value,
            note: document.getElementById('completionNote').value,
            founder: document.getElementById('logFounder').value
          };
          break;
        case 'followup':
          path = '/api/voice/support/follow-up';
          data = {
            subject: document.getElementById('followupSubject').value,
            context: document.getElementById('followupContext').value,
            founder: document.getElementById('followupFounder').value
          };
          break;
      }

      try {
        // Show loading
        const statusEl = document.getElementById('audioStatus');
        statusEl.style.display = 'block';
        statusEl.textContent = '⏳ Calling API...';

        // Call API
        const response = await fetch(`${apiUrl}${path}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const jsonResponse = await response.json();

        // Display response
        const responseDiv = document.getElementById(endpoint + 'Response');
        responseDiv.style.display = 'block';

        const statusBadge = `<span class="status ${jsonResponse.status}">${jsonResponse.status.toUpperCase()}</span>`;
        responseDiv.innerHTML = `
          <h4>${statusBadge}</h4>
          <p><strong>Response:</strong> ${jsonResponse.humanSummary}</p>
          ${jsonResponse.nextBestAction ? `<p><strong>Next Action:</strong> ${jsonResponse.nextBestAction}</p>` : ''}
          <code>${JSON.stringify(jsonResponse, null, 2)}</code>
        `;

        // Generate audio if key is provided
        if (elevenLabsKey && jsonResponse.humanSummary) {
          statusEl.textContent = '🎵 Generating voice...';

          const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel

          const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': elevenLabsKey
            },
            body: JSON.stringify({
              text: jsonResponse.humanSummary,
              model_id: 'eleven_monolingual_v1',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            })
          });

          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            document.getElementById('audioPlayer').src = audioUrl;
            document.getElementById('audioPlayer').play();
            statusEl.textContent = '🔊 Playing...';

            document.getElementById('audioPlayer').onended = () => {
              statusEl.textContent = '✅ Done!';
            };
          } else {
            statusEl.textContent = '⚠️  Audio generation failed. Check your ElevenLabs key.';
          }
        } else if (!elevenLabsKey) {
          statusEl.textContent = '⚠️  Add your ElevenLabs API key to enable audio';
        }

      } catch (error) {
        statusEl.textContent = `❌ Error: ${error.message}`;
      }
    }
  </script>
</body>
</html>
```

### Usage:
1. Save as `test-voice.html`
2. Open in browser: `open test-voice.html` (or just double-click it)
3. Add your ElevenLabs API key
4. Click any "Test & Play Audio" button
5. Hear the voice response!

---

## Option 3: Using Node.js Script

Create `test-voice-nodejs.js`:

```javascript
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_TOKEN = 'elevenlabs-voice-secure-token-2025';
const API_URL = 'http://localhost:3000';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

async function callVoiceAPI(endpoint, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function generateSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!ELEVENLABS_API_KEY) {
      reject(new Error('ELEVENLABS_API_KEY not set'));
    }

    const postData = JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: `/v1/text-to-speech/${VOICE_ID}/stream`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testWithAudio(endpointName, apiEndpoint, data, description) {
  console.log(`\n🎤 Testing: ${description}`);
  console.log(`   Endpoint: ${apiEndpoint}`);

  try {
    // Call API
    console.log('   → Calling API...');
    const response = await callVoiceAPI(apiEndpoint, data);

    console.log(`   ✅ Response: ${response.status}`);
    console.log(`   📝 "${response.humanSummary}"`);

    // Generate speech
    if (ELEVENLABS_API_KEY) {
      console.log('   → Generating audio...');
      const audioBuffer = await generateSpeech(response.humanSummary);

      // Save to file
      const audioFile = `${endpointName}.mp3`;
      fs.writeFileSync(audioFile, audioBuffer);
      console.log(`   ✅ Audio saved to: ${audioFile}`);
      console.log(`   🔊 Open this file to hear the response`);
    }

    return response;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║    Voice API Testing with Audio                               ║');
  console.log('║    Using ElevenLabs for text-to-speech                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const now = new Date().toISOString();

  // Test 1
  await testWithAudio(
    'test-block-focus',
    '/api/voice/scheduler/block',
    { minutes: 45, founder: 'shria' },
    'Block 45 minutes for focus'
  );

  // Test 2
  await testWithAudio(
    'test-confirm-meeting',
    '/api/voice/scheduler/confirm',
    { title: 'Team Sync', startAtISO: now, durationMinutes: 60, founder: 'shria' },
    'Confirm meeting'
  );

  // Test 3
  await testWithAudio(
    'test-reschedule',
    '/api/voice/scheduler/reschedule',
    { eventId: 'evt-123', newStartAtISO: now, newDurationMinutes: 30, founder: 'darnell' },
    'Reschedule meeting'
  );

  // Test 4
  await testWithAudio(
    'test-pause',
    '/api/voice/coach/pause',
    { style: 'grounding', seconds: 60, founder: 'shria' },
    'Start meditation pause'
  );

  // Test 5
  await testWithAudio(
    'test-log-complete',
    '/api/voice/support/log-complete',
    { taskId: 'task-789', note: 'Completed', founder: 'shria' },
    'Log task complete'
  );

  // Test 6
  await testWithAudio(
    'test-followup',
    '/api/voice/support/follow-up',
    { subject: 'Follow up on Q4 planning', context: 'From board meeting', founder: 'darnell' },
    'Create follow-up'
  );

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Testing Complete!                          ║');
  console.log('║    MP3 files have been saved in the current directory         ║');
  console.log('║    Open them in any audio player to hear the responses        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Check for API key
if (!ELEVENLABS_API_KEY) {
  console.warn('⚠️  ELEVENLABS_API_KEY not set');
  console.warn('   Export it: export ELEVENLABS_API_KEY="sk-your-key"');
  console.warn('   Audio generation will be skipped\n');
}

runTests().catch(console.error);
```

Run it:
```bash
export ELEVENLABS_API_KEY="sk-your-key-here"
node test-voice-nodejs.js
```

This creates MP3 files you can play with any audio player.

---

## Option 4: Manual Testing with Command Line

Test one endpoint and hear the response:

```bash
#!/bin/bash

API_TOKEN="elevenlabs-voice-secure-token-2025"
ELEVENLABS_API_KEY="sk-your-key-here"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"

# Call API
RESPONSE=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"minutes": 45, "founder": "shria"}')

# Get the text
TEXT=$(echo "$RESPONSE" | jq -r '.humanSummary')
echo "Response: $TEXT"

# Convert to speech and play
echo "Generating audio..."
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID/stream" \
  -H "Content-Type: application/json" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -d "{
    \"text\": \"$TEXT\",
    \"model_id\": \"eleven_monolingual_v1\",
    \"voice_settings\": {
      \"stability\": 0.5,
      \"similarity_boost\": 0.75
    }
  }" > response.mp3

echo "Saved to response.mp3"
echo "Opening with default audio player..."

# macOS
if command -v open &> /dev/null; then
  open response.mp3
# Linux
elif command -v xdg-open &> /dev/null; then
  xdg-open response.mp3
# Windows (Git Bash)
elif command -v start &> /dev/null; then
  start response.mp3
fi
```

---

## Available Voices

Use different voice IDs in your tests:

```
21m00Tcm4TlvDq8ikWAM = Rachel (female, calm)
EXAVITQu4zMVzdu7eNkl = Bella (female, warm)
IKne3meq5aSrNqZdkZeT = Clyde (male, professional)
EXAVITQu4zMVzdu7eNkl = Domi (female, excited)
pNInz6obpgDQGcFmaJgB = Josh (male, young)
ZQe5CZNOzWyzPSCn5a3c = Sara (female, helpful)
```

Example:
```bash
VOICE_ID="IKne3meq5aSrNqZdkZeT"  # Clyde (male)
```

---

## Best Practices

1. **Get the API Key First**
   - Sign up at https://elevenlabs.io
   - Copy from API section
   - Store in `.env` or export

2. **Install Dependencies**
   - `brew install ffmpeg` (macOS)
   - `apt install ffmpeg` (Linux)
   - Download from ffmpeg.org (Windows)

3. **Use Streaming for Real-time Response**
   - `/stream` endpoint gives you audio instantly
   - Perfect for voice assistants

4. **Cache Audio Files**
   - Save MP3s to reuse them
   - Don't re-generate the same text

5. **Use Different Voices**
   - Choose voices that match your brand
   - Test with multiple voices
   - Collect user preferences

---

## Troubleshooting

### "Command not found: ffplay"
```bash
# Install ffmpeg
brew install ffmpeg  # macOS
apt install ffmpeg   # Ubuntu/Debian
choco install ffmpeg # Windows
```

### "ELEVENLABS_API_KEY not set"
```bash
export ELEVENLABS_API_KEY="sk-your-key-from-elevenlabs"
```

### Audio plays but sounds robotic
- Increase `stability` (0.5-1.0, default 0.5)
- Adjust `similarity_boost` (0.0-1.0, default 0.75)

### API returns 401
- Check your Bearer token
- Make sure API is running: `docker-compose ps`

### No audio generated
- Verify ElevenLabs key is valid
- Check API rate limits
- Ensure you have credits in ElevenLabs

---

## Next Steps

1. **Choose an option above** (bash script, browser, Node.js, or CLI)
2. **Get your ElevenLabs API key** from https://elevenlabs.io/account
3. **Run the tests** and hear the voice responses
4. **Customize the voices** to match your brand
5. **Integrate with real agents** when ready

The mock API responses work perfectly with ElevenLabs - you'll hear beautiful voice responses for every API call!
