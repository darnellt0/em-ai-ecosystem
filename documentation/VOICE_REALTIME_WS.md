# Voice Realtime WebSocket Gateway

The `/ws/voice` WebSocket provides a low-latency pipeline for streaming microphone audio to the API and receiving synthesized
speech in response. It is designed to emit partial transcripts as speech-to-text (STT) results arrive and immediately begin a
text-to-speech (TTS) stream once the intent service responds.

## Authentication

Supply a bearer token via the `token` query parameter when connecting. The token is validated against the `VOICE_WS_TOKEN`
environment variable.

```text
ws://localhost:3000/ws/voice?token=YOUR_SECRET_TOKEN
```

Connections without a valid token are rejected with `401 Unauthorized`.

## Heartbeats & Timeouts

- The server pings every 10 seconds. The client must answer with `pong` (handled automatically by most WebSocket clients).
- If no activity (messages or `pong`) is observed for 30 seconds, the connection is closed.

## Client → Server Frames

Send JSON frames encoded as UTF-8 text. Audio data must be base64 encoded 16 kHz PCM.

| Type | Schema | Description |
|------|--------|-------------|
| `audio.chunk` | `{ "type": "audio.chunk", "contentType": "audio/pcm;rate=16000", "data": "<base64>" }` | Stream microphone audio frames.

> **Note**: The stubbed STT adapter emits simple placeholder transcripts. Integrating Whisper or another realtime model should
> replace the implementation in `packages/api/src/voice-realtime/adapters/stt.adapter.ts`.

## Server → Client Frames

| Type | Schema | Description |
|------|--------|-------------|
| `stt.partial` | `{ "type": "stt.partial", "text": string }` | Interim transcript updates.
| `stt.final` | `{ "type": "stt.final", "text": string }` | Final transcript for the utterance.
| `tts.start` | `{ "type": "tts.start", "streamId": string }` | Indicates a new TTS stream will follow.
| `tts.chunk` | `{ "type": "tts.chunk", "streamId": string, "data": "<base64>" }` | Base64 encoded audio fragments.
| `tts.end` | `{ "type": "tts.end", "streamId": string }` | Marks completion of the stream.

> **Note**: The TTS adapter currently emits UTF-8 placeholders. Replace the implementation in
> `packages/api/src/voice-realtime/adapters/tts.adapter.ts` with a provider such as ElevenLabs when credentials are available.

## Intent Dispatch Flow

1. Client streams `audio.chunk` frames.
2. STT emits `stt.partial` frames for immediate feedback.
3. When the transcript is finalized, the server POSTs the text to `/api/voice/intent`.
4. The response (`{ "humanSummary": string }`) seeds the TTS adapter.
5. The server streams `tts.start`, zero or more `tts.chunk` frames, and finishes with `tts.end`.

## Example Session

```json
// Client → Server
{ "type": "audio.chunk", "contentType": "audio/pcm;rate=16000", "data": "AAAA" }
{ "type": "audio.chunk", "contentType": "audio/pcm;rate=16000", "data": "BBBB" }
{ "type": "audio.chunk", "contentType": "audio/pcm;rate=16000", "data": "CCCC" }

// Server → Client
{ "type": "stt.partial", "text": "stub-partial-1" }
{ "type": "stt.partial", "text": "stub-partial-2" }
{ "type": "stt.partial", "text": "stub-partial-3" }
{ "type": "stt.final", "text": "stub-partial-1 stub-partial-2 stub-partial-3" }
{ "type": "tts.start", "streamId": "0f7c..." }
{ "type": "tts.chunk", "streamId": "0f7c...", "data": "U1RFIHN0dWIgYXVkaW8=" }
{ "type": "tts.end", "streamId": "0f7c..." }
```

## Local Testing

Run the Jest suite to exercise the realtime gateway and confirm the stub adapters emit streaming responses.

```bash
cd packages/api
npm test -- voice-realtime.spec.ts
```

The test harness spins up an ephemeral server, connects via `ws`, pushes audio chunks, and verifies the STT/TTS pipeline end to
end.
