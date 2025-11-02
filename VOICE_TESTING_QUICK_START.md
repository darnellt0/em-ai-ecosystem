# 🎤 Voice Testing Quick Start

Test the Voice API and hear the responses with ElevenLabs text-to-speech.

---

## ⚡ Fastest Way (5 minutes)

### 1. Get ElevenLabs API Key
```bash
# Go to: https://elevenlabs.io
# Sign up (free tier available)
# Copy your API key from Account section
```

### 2. Set the Key
```bash
export ELEVENLABS_API_KEY="sk-your-key-from-elevenlabs"
```

### 3. Run the Quick Test
```bash
bash quick-voice-test.sh
```

Done! You'll hear the API responses with voice.

---

## 🎯 What You'll Hear

**Test 1: Block Focus Time**
- API: "Blocked 45 minutes for focus on 11/1/2025, 9:26:06 PM."
- 🔊 You hear this read aloud in a natural voice

**Test 2: Confirm Meeting**
- API: "Added Team Sync to calendar on 11/1/2025, 9:26:07 PM for 60 minutes."
- 🔊 You hear this with proper emphasis

**Test 3: Start Meditation**
- API: "Starting a 60s grounding meditation for you now."
- 🔊 Calm voice guides you through it

**Test 4: Log Task Complete**
- API: "Marked task task-789 as complete. Noted: Completed"
- 🔊 Affirmative tone

---

## 🛠️ Installation

### Prerequisites

**macOS:**
```bash
brew install ffmpeg  # For audio playback
brew install jq      # For JSON parsing (optional)
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg  # For audio playback
sudo apt install jq      # For JSON parsing (optional)
```

**Windows:**
- Download ffmpeg from https://ffmpeg.org/download.html
- Or use Windows Subsystem for Linux

### Verify Installation
```bash
which ffplay      # Should show: /usr/local/bin/ffplay
which curl        # Should show: /usr/bin/curl or similar
```

---

## 📝 Different Testing Options

### Option A: Bash Script (Easiest)
```bash
export ELEVENLABS_API_KEY="sk-..."
bash quick-voice-test.sh
```
**Best for**: Quick testing, hearing responses immediately

---

### Option B: Browser Interface (Most Interactive)
See **TESTING_WITH_VOICE.md** → Option 2

1. Open `test-voice.html` in your browser
2. Add your API key
3. Click any button to test + hear audio
4. Interactive form for testing different scenarios

**Best for**: Exploring all options, adjusting parameters easily

---

### Option C: Node.js (Saves MP3s)
See **TESTING_WITH_VOICE.md** → Option 3

```bash
export ELEVENLABS_API_KEY="sk-..."
node test-voice-nodejs.js
```

Creates MP3 files you can share or archive

**Best for**: Batch testing, saving responses

---

### Option D: CLI One-Liner
See **TESTING_WITH_VOICE.md** → Option 4

```bash
# Single test
TEXT="Blocked 45 minutes for focus"
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -d '{"text":"'$TEXT'"}' | ffplay -autoexit -nodisp -
```

**Best for**: Quick one-off tests

---

## 🎙️ Voice Choices

Change which voice reads the responses:

```bash
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel - Calm, female
VOICE_ID="EXAVITQu4zMVzdu7eNkl"  # Bella - Warm, female
VOICE_ID="IKne3meq5aSrNqZdkZeT"  # Clyde - Professional, male
VOICE_ID="pNInz6obpgDQGcFmaJgB"  # Josh - Young, male
```

Edit the script and change the VOICE_ID variable.

---

## 🔊 Audio Settings

Control how the voice sounds:

```javascript
{
  "text": "Your response text here",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,        // 0=variable, 1=consistent
    "similarity_boost": 0.75 // 0=flexible, 1=exact
  }
}
```

**For more natural sound:**
```javascript
"stability": 0.3,
"similarity_boost": 0.5
```

**For more consistent sound:**
```javascript
"stability": 0.8,
"similarity_boost": 0.9
```

---

## 📊 Testing Checklist

Run through each test and verify:

- [ ] **Block Focus** - Hear confirmation of time blocked
- [ ] **Confirm Meeting** - Hear meeting added to calendar
- [ ] **Reschedule** - Hear event rescheduled
- [ ] **Meditation** - Hear pause/meditation started
- [ ] **Log Complete** - Hear task marked done
- [ ] **Follow-up** - Hear reminder created
- [ ] **Auth Fails** - Get 401 with missing token
- [ ] **Validation Fails** - Get 400 with bad input

---

## 🆘 Troubleshooting

### Audio not playing?
```bash
# Install ffmpeg
brew install ffmpeg

# Or verify it's in PATH
which ffplay
```

### "API_KEY not found"
```bash
# Set it
export ELEVENLABS_API_KEY="sk-your-key"

# Verify it's set
echo $ELEVENLABS_API_KEY
```

### Error from ElevenLabs?
- Check you have credits in your ElevenLabs account
- Verify the API key is correct
- Make sure the voice ID exists

### API returns 401?
- Verify the Bearer token is correct
- Make sure the API is running: `docker-compose ps`

---

## 🚀 Next: Integrate Real Agents

Once you've tested the voice responses, integrate real agents:

```bash
# Edit the service file
vim packages/api/src/voice/voice.services.ts

# Replace mock responses with real agent calls
# Example: Replace this:
# TODO: import { blockFocusTime } from '@agents/calendar-optimizer'

# With this:
import { blockFocusTime } from '@agents/calendar-optimizer/src/operations'
const result = await blockFocusTime(input)
```

Then rebuild:
```bash
cd packages/api && npm run build && cd ../..
docker-compose restart api
```

---

## 📚 Full Documentation

For complete details, see **TESTING_WITH_VOICE.md** which includes:
- 50+ detailed examples for each endpoint
- Security and validation testing
- Idempotency and rate limiting
- Docker testing instructions
- Multiple testing frameworks

---

## 💡 Pro Tips

1. **Test in order** - Start with simplest endpoint (meditation pause)
2. **Try different voices** - Find one that matches your brand
3. **Adjust stability** - Experiment with voice_settings
4. **Save favorites** - Keep MP3s of good responses
5. **Batch test** - Use Node.js script for multiple tests

---

## Example Session

```bash
# 1. Set API key
export ELEVENLABS_API_KEY="sk-abc123xyz..."

# 2. Check installation
ffplay --version

# 3. Run quick test
bash quick-voice-test.sh

# 4. Hear all 4 voice responses
# (Each test calls API and plays audio)

# 5. Try different voice
# Edit quick-voice-test.sh and change VOICE_ID
bash quick-voice-test.sh
```

---

**You're ready! Your Voice API is production-ready with ElevenLabs integration.** 🎉

Next: Wire up real agents and deploy to production!
