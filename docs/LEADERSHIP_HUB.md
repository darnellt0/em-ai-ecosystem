# Leadership Hub (EM-AI Ecosystem)

## 1. Purpose
The Leadership Hub is a strength-centered leadership development surface designed primarily for women of color and values-driven leaders. It is grounded in rest and the I.N.T.E.N.T. leadership framework, helping leaders stay rooted, intentional, and sustainable while using the EM-AI system.

## 2. Frontend Overview
- Route: `GET /em/leadership-hub` (Next.js App Router)
  - Implemented at: `packages/dashboard/app/em/leadership-hub/page.tsx`
- Main components:
  - `LeadershipHub` (`packages/dashboard/src/leadership-hub/LeadershipHub.tsx`)
    - Deep space background, animated “living” UI.
    - Centered bot prompt: “How are you leading and resting today?”
    - Renders 6 leadership tools as feature cards.
  - `FeatureCard` (`packages/dashboard/src/leadership-hub/FeatureCard.tsx`)
    - Hub-and-spoke card for each tool, with color, icon, and description.
  - `InteractionView` (`packages/dashboard/src/leadership-hub/InteractionView.tsx`)
    - Full-screen overlay for a chosen leadership tool.
    - Chat-style exchange with an EM-AI leadership agent.
- Data:
  - `FEATURES` (`packages/dashboard/src/leadership-hub/features.ts`)
    - 6 tools:
      - Mood Sculptor
      - Empathy Mirror
      - Cognitive Reframer
      - Bubble Burster
      - Memory Harmonizer
      - Future Pathfinder
    - Each description is leadership- and rest-focused.

## 3. Backend Overview
- Endpoint: `POST /em-ai/leadership-session`
  - Express route: `packages/api/src/routes/leadership-session.router.ts`
- Request shape (`packages/api/src/types/leadership-session.ts`):
  ```ts
  interface LeadershipSessionRequest {
    featureId: LeadershipFeatureId;
    message: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
  ```
- Response shape (`packages/api/src/types/leadership-session.ts`):
  ```ts
  interface LeadershipSessionResponse {
    reply: string;
    routedAgents: string[];
    featureId: LeadershipFeatureId;
    meta?: Record<string, unknown>;
  }
  ```
- Logic:
  - `leadership-router.service.ts` maps featureId to leadership/growth agents (Mindset, Rhythm, Purpose, Niche, Journal, etc.).
  - `leadership-session.service.ts` validates, invokes orchestrated agents, and returns a reply that supports strength-based leadership, rest rhythms, and I.N.T.E.N.T.-aligned decision-making.

## 4. How Frontend and Backend Connect
- `InteractionView` posts to `/api/em-ai/leadership-session` with `featureId`, `message`, and `history`.
- The Next.js app typically proxies `/api/*` to the EM-AI API (use your local/staging base URL if configured).
- On success, the assistant’s reply is rendered inline in the chat thread of the overlay.

## 5. Extending the Hub
- Add a new feature/tool:
  1. Add a new `LeadershipFeature` entry in `features.ts`.
  2. Add a mapping for its `featureId` in `leadership-router.service.ts` to one or more agents.
  3. Optionally adjust UI copy/layout in `LeadershipHub` if needed.
- Swap agent mappings:
  - Edit `FEATURE_AGENT_MAP` in `leadership-router.service.ts`.
  - Re-run tests:
    - Backend: `cd packages/api && npm test -- leadership-session`
    - Frontend: `cd packages/dashboard && npm test -- LeadershipHub.test.tsx InteractionView.test.tsx`

## 6. Testing
- Backend:
  ```bash
  cd packages/api
  npm test -- leadership-session
  ```
- Frontend:
  ```bash
  cd packages/dashboard
  npm test -- LeadershipHub.test.tsx
  npm test -- InteractionView.test.tsx
  ```
- Note: Backend tests may log infra warnings (DB/SMTP/Slack/Sentry), but leadership-session tests should pass.
