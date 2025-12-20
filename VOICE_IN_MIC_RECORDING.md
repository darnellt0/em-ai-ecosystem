# Voice-In: Microphone Recording & Transcription

## Overview

This feature upgrades the Voice Console from text-only input to real microphone recording with speech-to-text transcription, while maintaining text fallback for local development.

## Implementation Summary

### Files Changed/Added

#### Dashboard (packages/dashboard)
- **NEW**: `app/voice/page.tsx` - Voice Console UI with mic recording and text fallback

#### API (packages/api)
- **NEW**: `src/voice/stt.service.ts` - Speech-to-text service with OpenAI Whisper integration
- **NEW**: `src/voice/transcribe.router.ts` - API endpoints for transcription and commands
- **NEW**: `tests/routes/voice.transcribe.spec.ts` - Comprehensive test suite
- **MODIFIED**: `src/index.ts` - Registered transcribe router
- **MODIFIED**: `package.json` - Added multer dependency for file uploads

## Features

### 1. Dashboard: Microphone Recording (`/voice`)

The Voice Console provides:

- **Real microphone recording** using MediaRecorder API
- **Recording state management** with visual feedback (idle → recording → processing)
- **Recording timer** to show elapsed time
- **Text input fallback** that works 100% without STT configured
- **Error handling** for permission denials, network errors, and STT configuration issues
- **Automatic command execution** after transcription

#### User Flow:
1. Click microphone button → Browser requests permission
2. Recording starts → Timer shows elapsed time
3. Click stop → Audio uploads to `/api/voice/transcribe`
4. Transcription returns → Text displays and sends to `/api/voice/command`
5. Command result displays

#### Fallback Mode:
- If microphone fails or STT isn't configured, users can type commands directly
- Text input works identically to voice input
- No external provider required for MVP testing

### 2. API: Speech-to-Text Service

#### STT Service (`stt.service.ts`)

Provider-agnostic design supporting:
- **none** (default): Returns helpful error message with setup instructions
- **openai**: Uses Whisper API for transcription

Configuration via environment variables:
```bash
STT_PROVIDER=openai              # Default: none
STT_OPENAI_API_KEY=sk-...        # Falls back to OPENAI_API_KEY if not set
```

Key functions:
- `transcribeAudio(buffer, filename)` - Main transcription function
- `isSTTAvailable()` - Check if STT is configured
- `getSTTStatus()` - Get configuration status for debugging
- `loadSTTConfig()` - Load config from environment

### 3. API: Transcribe Router

#### Endpoints:

**POST /api/voice/transcribe**

Accepts two input formats:

1. **JSON (stub/fallback mode)**:
   ```json
   { "text": "block 45 minutes for focus" }
   ```
   Response:
   ```json
   { "status": "ok", "text": "block 45 minutes for focus", "provider": "stub" }
   ```

2. **Multipart form-data (audio upload)**:
   - Field name: `audio`
   - Supported formats: webm, mp3, wav, ogg, m4a, mp4
   - Max size: 25MB (Whisper API limit)

   With STT disabled:
   ```json
   {
     "status": "error",
     "error": "Audio received but STT is not configured.",
     "message": "To enable speech-to-text transcription, set STT_PROVIDER=openai and STT_OPENAI_API_KEY..."
   }
   ```

   With STT enabled:
   ```json
   {
     "status": "ok",
     "text": "Block 45 minutes for focus",
     "provider": "openai",
     "duration": 234
   }
   ```

**POST /api/voice/command**

Execute a voice command (stub for now, routes to intent classifier):
```json
{
  "user": "shria",
  "text": "block 45 minutes for focus"
}
```

Response:
```json
{
  "status": "ok",
  "message": "Command received",
  "text": "block 45 minutes for focus",
  "nextStep": "Route this to /api/voice/intent for classification"
}
```

**GET /api/voice/transcribe/status**

Check STT configuration:
```json
{
  "status": "ok",
  "provider": "openai",
  "available": true,
  "openaiKeyConfigured": true
}
```

## Environment Variables

### API (.env)

```bash
# Speech-to-Text Configuration
STT_PROVIDER=openai              # Options: none, openai (default: none)
STT_OPENAI_API_KEY=sk-...        # OpenAI API key for Whisper (optional if OPENAI_API_KEY is set)

# Fallback to existing OpenAI key
OPENAI_API_KEY=sk-...            # Used if STT_OPENAI_API_KEY not set
```

### Dashboard (.env)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000  # API base URL (default: http://localhost:4000)
```

## Testing

### Manual Testing

#### Without STT Configured (Default):

```bash
# Start API
docker-compose up api

# Visit dashboard
http://localhost:3001/voice

# Test 1: Try recording
# Expected: Permission request → Recording → Upload → Error message with setup instructions
# "Audio received but STT is not configured. Set STT_PROVIDER=openai..."

# Test 2: Use text input
# Expected: Works perfectly, sends command to /api/voice/command
```

#### With STT Configured:

```bash
# Set environment variables
export STT_PROVIDER=openai
export STT_OPENAI_API_KEY=sk-...

# Start API
docker-compose up api

# Visit dashboard
http://localhost:3001/voice

# Test 1: Record voice command
# Expected: Permission → Recording → Upload → Transcription → Command execution

# Test 2: Text input still works
# Expected: Same as without STT
```

### Automated Tests

```bash
cd packages/api
npm test -- voice.transcribe.spec.ts

# Test coverage:
# ✓ JSON text input (echo mode)
# ✓ Multipart audio upload (STT disabled)
# ✓ Multipart audio upload (STT enabled)
# ✓ File size limits
# ✓ Content-Type validation
# ✓ Command endpoint
# ✓ Status endpoint
```

## Architecture Decisions

### 1. No External Provider Required by Default

**Decision**: Default `STT_PROVIDER=none` with graceful degradation
**Rationale**:
- Local dev doesn't require API keys
- Text input provides full functionality
- Clear error messages guide setup
- Reduces cost during development

### 2. Multer for File Uploads

**Decision**: Use multer with memory storage (no disk writes)
**Rationale**:
- Industry standard for Express multipart
- Memory storage keeps audio in RAM (fast, no cleanup needed)
- 25MB limit matches OpenAI Whisper API limit
- Lightweight and well-maintained

### 3. Provider-Agnostic STT Service

**Decision**: Abstract STT providers behind common interface
**Rationale**:
- Easy to add providers later (Google, Azure, local Whisper, etc.)
- Consistent error handling across providers
- Centralized configuration management
- Testable without external API calls

### 4. Separate Transcribe and Command Endpoints

**Decision**: `/transcribe` for STT, `/command` for execution
**Rationale**:
- Single responsibility principle
- Client can handle transcript before executing
- Easier to test and debug
- Allows for transcript editing/confirmation UI later

## CORS Configuration

Dashboard runs on `http://localhost:3001`, API on `http://localhost:3000`.

CORS is already configured in `packages/api/src/index.ts` via `ALLOWED_ORIGINS` env var:
```bash
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:19006
```

No additional CORS changes needed.

## Integration Points

### Current Integration:
1. Dashboard → `/api/voice/transcribe` (audio → text)
2. Dashboard → `/api/voice/command` (text → stub response)

### Future Integration:
1. `/api/voice/command` → `/api/voice/intent` (classify intent)
2. `/api/voice/intent` → Voice API endpoints (execute action)

## Concurrency & Safety

### File Ownership:
- **Dashboard**: `packages/dashboard/app/voice/**`
- **API**: `packages/api/src/voice/**` (specifically transcribe.router.ts, stt.service.ts)
- **Tests**: `packages/api/tests/routes/voice.transcribe.spec.ts`

### NOT Touched:
- ✅ `packages/ops/n8n/**` (as required)
- ✅ `docs/P0_ACTIVATION.md` (as required)
- ✅ `docs/P0_READINESS_CHECKLIST.md` (as required)
- ✅ Shared config files (only added STT env vars to API .env)

### Docker Safety:
- No breaking changes to docker-compose.yml
- New env vars are optional with safe defaults
- API starts successfully without STT configured

## Next Steps

1. **Integrate with Intent Router**: Connect `/api/voice/command` → `/api/voice/intent`
2. **Add Recording Visualization**: Waveform or audio level indicator during recording
3. **Support More Providers**: Add Google Cloud Speech-to-Text, Azure Speech, etc.
4. **Add Confidence Scores**: Return STT confidence with transcription
5. **Add Language Detection**: Auto-detect language or allow user selection
6. **Optimize for Mobile**: Test MediaRecorder on mobile browsers
7. **Add Audio Preview**: Let users play back recording before transcribing

## Deployment Checklist

- [ ] Set `STT_PROVIDER=openai` in production API .env
- [ ] Set `STT_OPENAI_API_KEY=...` in production API .env
- [ ] Verify CORS allows dashboard origin
- [ ] Test microphone permissions in production browser
- [ ] Monitor OpenAI API usage and costs
- [ ] Add rate limiting for transcribe endpoint (already has rateLimitSimple from voice router)
- [ ] Set up error tracking for transcription failures
- [ ] Document voice command patterns for users

## Files Summary

### Created:
1. `packages/dashboard/app/voice/page.tsx` (283 lines)
2. `packages/api/src/voice/stt.service.ts` (152 lines)
3. `packages/api/src/voice/transcribe.router.ts` (216 lines)
4. `packages/api/tests/routes/voice.transcribe.spec.ts` (265 lines)
5. `VOICE_IN_MIC_RECORDING.md` (this file)

### Modified:
1. `packages/api/src/index.ts` (added transcribe router import + registration)
2. `packages/api/package.json` (added multer + @types/multer)

### Total:
- **916 lines of new code**
- **2 files modified**
- **5 files created**
- **0 files in restricted zones**

---

**Status**: ✅ Complete and ready for testing
**Branch**: `codex/voice-in-mic-stt-mvp`
**Safe to merge**: Yes (no conflicts with P0 activation work)
