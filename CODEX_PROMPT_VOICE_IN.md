# Codex Prompt: Deploy Voice-In Microphone Recording Feature

## Current Situation

A new voice console feature with microphone recording has been implemented and committed to branch `claude/add-mic-recording-bbvfp`. The code is in the local filesystem, but the Docker dashboard container is showing an old cached page because it uses a pre-built image that was created before the new feature was added.

**Problem**: The dashboard Docker image needs to be rebuilt to include the new voice page file.

## Files Already in Place

These files are already committed and in the local filesystem:
- ✅ `packages/dashboard/app/voice/page.tsx` (329 lines, microphone recording UI)
- ✅ `packages/api/src/voice/stt.service.ts` (STT service with OpenAI Whisper)
- ✅ `packages/api/src/voice/transcribe.router.ts` (Transcribe + command endpoints)
- ✅ `packages/api/tests/routes/voice.transcribe.spec.ts` (Test suite)
- ✅ `packages/api/src/index.ts` (Router registered)
- ✅ `packages/api/package.json` (multer dependency added)

## Task: Rebuild Docker Images and Verify

### Step 1: Verify Files Exist

```bash
# Confirm the new voice page exists locally
ls -lh /home/user/em-ai-ecosystem/packages/dashboard/app/voice/page.tsx

# Should show: 12K file with 329 lines
# If missing, the files need to be pulled from git
```

### Step 2: Rebuild Docker Images

```bash
cd /home/user/em-ai-ecosystem

# Option A: Rebuild just dashboard (faster - recommended)
docker-compose build --no-cache dashboard

# Option B: Rebuild everything (slower but ensures all changes)
docker-compose build --no-cache

# The --no-cache flag ensures a fresh build without using old layers
```

### Step 3: Restart Services

```bash
# Stop all services
docker-compose down

# Start services with rebuilt images
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Check dashboard logs to confirm it started
docker-compose logs -f dashboard
# Look for: "ready started server on 0.0.0.0:3001"
# Press Ctrl+C to exit logs
```

### Step 4: Verify the New Page

```bash
# Check if the new page is accessible
curl -I http://localhost:3001/voice

# Should return: HTTP/1.1 200 OK
```

**Then open in browser**: `http://localhost:3001/voice`

## Expected Result

After rebuilding, visiting `http://localhost:3001/voice` should show:

### ✅ New Page Features:
1. **Header**: "VOICE CONSOLE" with "Voice Command Interface" title
2. **Left Panel**: "Microphone Input" section with:
   - Large circular microphone button
   - Recording timer when active
   - Transcript display area
3. **Right Panel**: "Text Input (Fallback)" section with:
   - Textarea for manual text entry
   - "Send Command" button
   - Result display area
4. **Bottom**: "How It Works" documentation section
5. **Modern UI**: Emerald green accents, dark theme, glassmorphic cards

### ❌ Old Page (should NOT see this):
- "VOICE MVP" header
- "Test voice-to-journal pipeline" description
- "Transcribe" and "Command" buttons side-by-side
- Different layout and styling

## Troubleshooting

### Issue 1: Still Seeing Old Page After Rebuild

**Solution**:
```bash
# Clear browser cache with hard refresh
# Chrome/Edge: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
# Firefox: Ctrl+F5

# OR try in private/incognito window
```

### Issue 2: Build Fails

**Check**:
```bash
# Ensure all files are present
git status
git log -1 --oneline

# Should show: 53ea45a feat: add voice-in microphone recording and STT transcription
```

**If files are missing**:
```bash
# Pull latest from branch
git fetch origin claude/add-mic-recording-bbvfp
git checkout claude/add-mic-recording-bbvfp
git pull origin claude/add-mic-recording-bbvfp
```

### Issue 3: Container Won't Start

**Check logs**:
```bash
docker-compose logs dashboard
docker-compose logs api

# Look for errors in the build or startup process
```

**Common fixes**:
```bash
# Remove old containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Testing the Feature

### Test 1: Without STT (Default)

1. Visit `http://localhost:3001/voice`
2. Click the microphone button
3. Allow microphone permission
4. Speak something
5. Click stop

**Expected**: Error message saying "Audio received but STT is not configured. Set STT_PROVIDER=openai..."

### Test 2: Text Input Fallback

1. Type "block 45 minutes for focus" in the text area
2. Click "Send Command"

**Expected**: Command received message with next steps

### Test 3: With STT Enabled (Optional)

**Only if you want to test actual transcription**:

```bash
# Add to packages/api/.env
echo "STT_PROVIDER=openai" >> packages/api/.env
echo "STT_OPENAI_API_KEY=sk-your-key-here" >> packages/api/.env

# Rebuild API
docker-compose build api
docker-compose up -d api

# Wait 30 seconds for API to restart
# Then test microphone recording again
```

**Expected**: Audio transcribes to text successfully

## Success Criteria

- ✅ `http://localhost:3001/voice` shows new microphone recording UI
- ✅ Microphone button is visible and clickable
- ✅ Text input fallback works
- ✅ No console errors in browser (F12 → Console)
- ✅ API endpoints respond at `http://localhost:3000/api/voice/transcribe`

## If Everything Works

The feature is now deployed! Next steps:

1. **Test the full flow**: Record → Transcribe → Command
2. **Configure STT** (optional): Add OpenAI API key to enable real transcription
3. **Create PR**: The changes are on branch `claude/add-mic-recording-bbvfp` and ready to merge

## Documentation

Full documentation is available at:
- `/home/user/em-ai-ecosystem/VOICE_IN_MIC_RECORDING.md`

This includes:
- Architecture decisions
- API endpoint documentation
- Environment variable configuration
- Manual testing guide
- Integration points

---

**Time estimate**: 5-10 minutes (mostly waiting for Docker build)

**Risk level**: Low (no breaking changes, new feature only)

**Rollback**: `git checkout <previous-branch>` and rebuild
