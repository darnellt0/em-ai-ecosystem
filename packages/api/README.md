# Elevated Movements API

REST API for the Elevated Movements AI Ecosystem, featuring voice integration, EM-AI orchestration, and HeyGen Interactive Avatar support.

## Features

- Voice API with ElevenLabs TTS integration
- EM-AI agent orchestration
- HeyGen Interactive Avatar integration
- Real-time WebSocket support
- Bearer token authentication
- Rate limiting and idempotency

## Environment Variables

### Required for Core Functionality

```bash
# Server
PORT=3000
NODE_ENV=development

# Authentication
VOICE_API_TOKEN=your-voice-api-token

# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Optional Integrations

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/em_ai

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=your-openai-key

# Claude
CLAUDE_API_KEY=your-claude-key

# ElevenLabs (for Voice API)
ELEVENLABS_API_KEY=your-elevenlabs-key

# HeyGen Interactive Avatar
HEYGEN_API_KEY=your-heygen-api-key
HEYGEN_BASE_URL=https://api.heygen.com  # Optional, defaults to this
HEYGEN_TIMEOUT_MS=30000  # Optional, defaults to 30000

# Email Notifications
GMAIL_USER=your-gmail@example.com
GMAIL_APP_PASSWORD=your-app-password
# OR
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SECURE=false

# Founders
FOUNDER_DARNELL_EMAIL=darnell@elevatedmovements.com
FOUNDER_SHRIA_EMAIL=shria@elevatedmovements.com
```

## HeyGen Interactive Avatar Integration

The HeyGen integration enables EM-AI responses to be delivered as interactive avatar speech.

### Endpoints

#### `POST /api/heygen/session`

Start a new interactive avatar session.

**Request:**
```json
{
  "avatarId": "your-avatar-id",
  "voiceId": "optional-voice-id",
  "userId": "optional-user-id",
  "language": "en",
  "quality": "medium"
}
```

**Response:**
```json
{
  "sessionId": "session-abc123",
  "streamUrl": "https://stream.heygen.com/...",
  "widgetToken": "widget-token-xyz",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### `POST /api/heygen/message`

Send a message to an active avatar for TTS playback.

**Request:**
```json
{
  "sessionId": "session-abc123",
  "text": "Hello! This is your EM-AI assistant speaking.",
  "userId": "optional-user-id",
  "metadata": {
    "conversationId": "conv-456",
    "agentName": "calendar-optimizer"
  }
}
```

**Response:**
```json
{
  "sessionId": "session-abc123",
  "messageId": "msg-789",
  "status": "queued",
  "timestamp": "2025-11-22T12:00:00Z"
}
```

#### `POST /api/heygen/session/end`

End an active avatar session.

**Request:**
```json
{
  "sessionId": "session-abc123"
}
```

**Response:**
```json
{
  "sessionId": "session-abc123",
  "success": true,
  "message": "Session ended successfully"
}
```

#### `GET /api/heygen/status`

Get HeyGen integration status.

**Response:**
```json
{
  "configured": true,
  "baseUrl": "https://api.heygen.com"
}
```

### Example Usage (cURL)

```bash
# Set your API token
TOKEN="your-voice-api-token"

# Start a session
curl -X POST http://localhost:3000/api/heygen/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "avatarId": "avatar-123",
    "language": "en",
    "quality": "medium"
  }'

# Send a message
curl -X POST http://localhost:3000/api/heygen/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-abc123",
    "text": "Hello from EM-AI!"
  }'

# End the session
curl -X POST http://localhost:3000/api/heygen/session/end \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-abc123"
  }'
```

### EM-AI Integration

To send EM-AI responses as avatar speech:

```typescript
import {
  sendEmAiReplyAsAvatarSpeech,
  registerEmAiAvatarSession
} from './services/heygen-em-ai.integration';

// Register a session when user starts avatar
registerEmAiAvatarSession({
  sessionId: 'session-123',
  userId: 'user-456',
  avatarId: 'avatar-789',
  createdAt: new Date().toISOString(),
});

// In your EM-AI agent, send responses to avatar
const result = await sendEmAiReplyAsAvatarSpeech({
  sessionId: 'session-123',
  emAiText: 'Your meeting is scheduled for 3pm today.',
  userId: 'user-456',
  agentName: 'calendar-optimizer',
});
```

## Voice API Endpoints

### Scheduler
- `POST /api/voice/scheduler/block` - Block focus time
- `POST /api/voice/scheduler/confirm` - Confirm meeting
- `POST /api/voice/scheduler/reschedule` - Reschedule event

### Coach
- `POST /api/voice/coach/pause` - Start meditation

### Support
- `POST /api/voice/support/log-complete` - Mark task done
- `POST /api/voice/support/follow-up` - Create reminder

### Analytics
- `POST /api/voice/analytics/daily-brief` - Get daily brief
- `POST /api/voice/analytics/insights` - Get insights

### Business
- `POST /api/voice/business/grants` - Discover grants
- `POST /api/voice/business/relationships` - Track relationship
- `POST /api/voice/business/budget` - Allocate budget
- `POST /api/voice/business/content` - Generate content
- `POST /api/voice/business/brand-story` - Generate brand story

### Hybrid
- `POST /api/voice/hybrid` - Smart router (deterministic + AI)

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=heygen

# Run tests in watch mode
npm run test:watch
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## Architecture

```
packages/api/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── config/               # Configuration modules
│   │   └── heygen.config.ts  # HeyGen configuration
│   ├── heygen/               # HeyGen integration
│   │   ├── heygen.router.ts  # Express routes
│   │   └── heygen.types.ts   # Type definitions & validation
│   ├── services/             # Business logic
│   │   ├── heygen.service.ts           # HeyGen API client
│   │   ├── heygen-em-ai.integration.ts # EM-AI integration
│   │   ├── email.service.ts            # Email notifications
│   │   ├── calendar.service.ts         # Calendar operations
│   │   └── ...
│   ├── voice/                # Voice API
│   │   ├── voice.router.ts   # Voice endpoints
│   │   ├── voice.types.ts    # Voice types
│   │   └── voice.services.ts # Voice logic
│   ├── middleware/           # Express middleware
│   │   ├── authBearer.ts     # Authentication
│   │   ├── rateLimitSimple.ts # Rate limiting
│   │   └── idempotency.ts    # Idempotency
│   └── types/                # Shared types
└── tests/                    # Jest tests
    ├── heygen.service.spec.ts
    ├── heygen.router.spec.ts
    └── ...
```

## License

ISC
