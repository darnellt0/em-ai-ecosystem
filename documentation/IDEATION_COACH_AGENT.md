# Ideation Coach Agent

## Overview

The **Ideation Coach Agent** is an AI-powered conversational assistant that helps clients and potential clients brainstorm, refine, and **flesh out** ideas through structured coaching guidance. It creates a safe, judgment-free space for exploring concepts and discovering the great ideas beneath the surface.

> **Note:** "Flesh out" means to add detail, substance, and development to an idea - making it more complete and fully formed.

---

## Key Features

### 🗣️ Conversational Brainstorming
- Natural, back-and-forth dialogue that feels like talking to a human coach
- Multi-turn conversations that build on previous context
- Adaptive responses based on client input and stage of exploration

### 🎯 Structured Guidance
- Uses proven coaching frameworks (GROW model, 5 Whys, design thinking)
- Asks targeted, probing questions to deepen thinking
- Guides clients through distinct stages of ideation

### 👤 Personalized Support
- Adapts to each client's unique context and communication style
- Tracks conversation history and key insights
- Remembers important details throughout the session

### 🔒 Safe & Private Space
- Judgment-free zone for expressing early-stage thoughts
- Supportive and encouraging tone
- No external pressure - clients explore at their own pace

---

## Conversation Stages

The agent guides clients through four distinct stages:

### 1. **Discovery** (Turns 1-6)
**Focus:** Understanding the initial idea and context

**Sample Questions:**
- "What's the core problem or opportunity you're exploring?"
- "Who would benefit most from this idea?"
- "What inspired this idea in the first place?"
- "What would success look like?"

### 2. **Exploration** (Turns 7-12)
**Focus:** Expanding thinking and challenging assumptions

**Sample Questions:**
- "What assumptions are you making about this idea?"
- "What would this look like if it were 10x bigger?"
- "What's stopping this idea from existing already?"
- "What would need to be true for this to work?"
- "How does this connect to your broader mission?"

### 3. **Refinement** (Turns 13-18)
**Focus:** Clarifying and strengthening the core idea

**Sample Questions:**
- "What's the simplest version of this idea?"
- "What makes this uniquely valuable?"
- "What evidence supports this direction?"
- "What feedback have you received so far?"
- "What would you need to validate this idea?"

### 4. **Action** (Turns 18+)
**Focus:** Defining concrete next steps

**Sample Questions:**
- "What's the very first step you could take?"
- "What resources do you already have?"
- "Who could help you move this forward?"
- "What could you test in the next 48 hours?"
- "What's holding you back from starting?"

---

## API Endpoints

All endpoints require Bearer authentication via `Authorization: Bearer <VOICE_API_TOKEN>` header.

### 1. Start Ideation Session

**POST** `/api/voice/ideation/start`

Start a new ideation coaching session for a client.

**Request:**
```json
{
  "clientName": "Maya Thompson",
  "initialIdea": "I want to create a wellness app for busy professionals that helps them integrate mindfulness into their workday without taking too much time. Something quick and practical.",
  "clientEmail": "maya@example.com",
  "founder": "shria"
}
```

**Response:**
```json
{
  "status": "ok",
  "sessionId": "ideation_1763021845741_w5u8kapgj",
  "coachResponse": "Thank you for sharing that, Maya! It sounds like you're addressing a real pain point for busy professionals. Let me ask you - what inspired this idea in the first place? Was there a specific moment or experience that made you realize this was needed?",
  "questionType": "open",
  "stage": "discovery",
  "keyInsights": [],
  "nextBestAction": "Continue sharing your thoughts and context"
}
```

---

### 2. Continue Ideation Session

**POST** `/api/voice/ideation/continue`

Continue an existing conversation by responding to the coach.

**Request:**
```json
{
  "sessionId": "ideation_1763021845741_w5u8kapgj",
  "clientResponse": "I think the core problem is that people want to be mindful but they feel like they don't have time. Traditional meditation apps ask for 10-20 minutes, but that's too much for someone in back-to-back meetings."
}
```

**Response:**
```json
{
  "status": "ok",
  "sessionId": "ideation_1763021845741_w5u8kapgj",
  "coachResponse": "That's a powerful insight - you're identifying a gap between what people want and what's currently available. So if 10-20 minutes is too much, what would the ideal duration be? And more importantly, when during their day would this make the most sense for your target users?",
  "questionType": "probing",
  "stage": "discovery",
  "keyInsights": [
    "Traditional meditation apps ask for 10-20 minutes, but that's too much for someone in back-to-back meetings"
  ],
  "nextBestAction": "Continue sharing your thoughts and context"
}
```

---

### 3. Get Session Summary

**GET** `/api/voice/ideation/summary/:sessionId`

Retrieve a summary of the ideation session including key insights.

**Response:**
```json
{
  "status": "ok",
  "sessionId": "ideation_1763021845741_w5u8kapgj",
  "summary": "Session with Maya Thompson exploring: I want to create a wellness app for busy professionals that helps them integrate mindfulness into their workday...",
  "keyInsights": [
    "Traditional meditation apps ask for 10-20 minutes, but that's too much",
    "Micro-meditations of 60-90 seconds could work between meetings",
    "Calendar integration could automatically suggest mindfulness moments"
  ],
  "actionItems": [],
  "conversationLength": 8,
  "duration": "12 minutes"
}
```

---

### 4. End Session

**POST** `/api/voice/ideation/end`

End an ideation session and receive a final summary with suggested next steps.

**Request:**
```json
{
  "sessionId": "ideation_1763021845741_w5u8kapgj"
}
```

**Response:**
```json
{
  "status": "ok",
  "sessionId": "ideation_1763021845741_w5u8kapgj",
  "finalMessage": "Thank you for this ideation session, Maya Thompson!\n\nIt's been wonderful exploring your idea with you. Remember, the best ideas evolve through action and iteration. You've made great progress today - keep that momentum going!\n\nFeel free to come back anytime to continue refining or to explore new ideas. I'm here to support your journey.",
  "summary": "Session with Maya Thompson exploring: wellness app for busy professionals...",
  "keyInsights": [
    "Core problem: people want mindfulness but lack time",
    "Solution direction: 60-90 second micro-meditations",
    "Integration idea: automatic calendar-based suggestions",
    "Resources: meditation expertise + developer contact"
  ],
  "suggestedNextSteps": [
    "Write down your top 3 insights from this conversation",
    "Identify one small action you can take in the next 48 hours",
    "Share your idea with someone you trust and get feedback",
    "Schedule time to continue developing this idea",
    "Return for another session when you have new questions"
  ]
}
```

---

### 5. Get Active Sessions (Admin)

**GET** `/api/voice/ideation/sessions`

Retrieve all active ideation sessions (for monitoring/admin purposes).

**Response:**
```json
{
  "status": "ok",
  "sessions": [
    {
      "sessionId": "ideation_1763021845741_w5u8kapgj",
      "clientName": "Maya Thompson",
      "stage": "exploration",
      "turnCount": 8,
      "lastActivity": "2025-11-13T08:17:38.369Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-11-13T08:17:39.523Z"
}
```

---

## Question Types

The agent classifies its questions into distinct types to guide the conversation:

| Type | Purpose | Example |
|------|---------|---------|
| **open** | Broad exploration | "What's your initial idea?" |
| **probing** | Dig deeper | "What makes you think that?" |
| **clarifying** | Ensure understanding | "Can you tell me more about..." |
| **visioning** | Expand possibilities | "What if this were 10x bigger?" |
| **action** | Drive toward steps | "What's your first step?" |

---

## Coaching Frameworks

The agent leverages proven coaching methodologies:

### GROW Model
- **Goal:** What do you want to achieve?
- **Reality:** What's the current situation?
- **Options:** What could you do?
- **Way Forward:** What will you do?

### 5 Whys
Asking "why" repeatedly to uncover root motivations and assumptions.

### Design Thinking
- Empathize with the user
- Define the problem
- Ideate solutions
- Prototype quickly
- Test and iterate

---

## Use Cases

### For Clients Exploring New Ideas
```
Client: "I have this vague idea about helping parents..."
→ Agent helps them flesh out who specifically they serve, what problem they solve, and what makes their approach unique.
```

### For Entrepreneurs Refining Concepts
```
Client: "I want to create a platform for..."
→ Agent challenges assumptions, explores "what if" scenarios, and helps identify the simplest viable version.
```

### For Teams Brainstorming
```
Client: "Our team is stuck on how to approach..."
→ Agent asks probing questions that unlock new perspectives and help the team see connections they hadn't considered.
```

### For Individuals Seeking Clarity
```
Client: "I know I want to do something with..."
→ Agent guides them through self-discovery to articulate what they really care about and what they're uniquely positioned to do.
```

---

## Technical Architecture

### Session Management
- **Storage:** In-memory map (replace with Redis for production)
- **Session Lifetime:** 24 hours of inactivity
- **Data Stored:**
  - Conversation history (all turns)
  - Key insights extracted
  - Current stage
  - Client metadata

### AI Integration
- **Primary:** OpenAI GPT-4 for conversational responses
- **Fallback:** Rule-based coaching questions (when API unavailable)
- **Temperature:** 0.8 (higher for creativity)
- **Context Window:** Last 10 conversation turns

### Conversation Flow
```
1. Client sends initial idea
   ↓
2. Agent analyzes + generates coaching question
   ↓
3. Client responds
   ↓
4. Agent:
   - Adds to conversation history
   - Extracts insights
   - Determines stage progression
   - Generates next question
   ↓
5. Repeat steps 3-4 until session ends
   ↓
6. Final summary with insights + action items
```

---

## Example Conversation Flow

### Turn 1: Start
**Client:** "I want to create a wellness app for busy professionals."

**Coach:** "Thank you for sharing that! What inspired this idea in the first place?"

### Turn 2: Discovery
**Client:** "I noticed my friends are stressed but feel they don't have time for meditation."

**Coach:** "That's a valuable observation. Who specifically would benefit most - what type of professionals?"

### Turn 3: Exploration
**Client:** "Probably people in tech, finance, consulting - high-stress jobs with lots of meetings."

**Coach:** "What if we thought about this differently - what would a wellness solution look like if it required zero extra time?"

### Turn 4: Refinement
**Client:** "Maybe it's not about adding time, but transforming existing moments - like the transition between meetings."

**Coach:** "Now we're getting somewhere! What's the simplest version of this you could test?"

### Turn 5: Action
**Client:** "I could create a simple Chrome extension that detects when a meeting ends and offers a 60-second breathing exercise."

**Coach:** "That's concrete and testable. What's stopping you from building a prototype this week?"

---

## Integration Points

### Voice Interface
The Ideation Coach can be accessed via:
- **REST API** (documented above)
- **WebSocket** (for real-time voice conversations)
- **Mobile App** (native iOS/Android)
- **Web Dashboard** (embedded chat widget)

### External Systems
- **CRM Integration:** Auto-log sessions to client records
- **Email:** Send session summaries via email
- **Calendar:** Schedule follow-up sessions
- **Slack:** Enable ideation sessions via Slack bot

---

## Best Practices

### For Founders Using This Agent

1. **Set Context:** Tell clients this is a brainstorming space, not a sales pitch
2. **Encourage Honesty:** Emphasize that vulnerability leads to better insights
3. **Follow Up:** Use session summaries to track client journey
4. **Iterate:** Return to refine ideas as they evolve

### For Developers Extending This Agent

1. **Add Memory:** Integrate with vector DB for long-term client memory
2. **Enhance Insights:** Use sentiment analysis to detect breakthrough moments
3. **Personalize:** Adapt coaching style based on client personality type
4. **Measure Impact:** Track idea evolution from initial to final concept

---

## Configuration

### Environment Variables

```bash
# Required for AI-powered responses
OPENAI_API_KEY=sk-your-openai-key-here

# Required for authentication
VOICE_API_TOKEN=your-secure-token-here

# Optional: Customize session timeout (default: 24 hours)
IDEATION_SESSION_TIMEOUT_MS=86400000
```

### Customization Options

**Coaching Persona:**
Edit `SYSTEM_PROMPT` in `ideation-coach.agent.ts` to adjust:
- Tone (formal/casual)
- Question style (directive/exploratory)
- Values alignment (rest, community, growth)

**Question Banks:**
Modify `COACHING_FRAMEWORKS` object to add/remove questions for each stage.

**Stage Progression:**
Adjust turn count thresholds in `determineNextStage()` function.

---

## Testing

### Quick Test
```bash
bash test-ideation-coach.sh
```

### Manual Test
```bash
# Start session
curl -X POST http://localhost:3000/api/voice/ideation/start \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "initialIdea": "I want to help people solve [problem]",
    "founder": "shria"
  }'

# Continue session (use sessionId from previous response)
curl -X POST http://localhost:3000/api/voice/ideation/continue \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ideation_1234567890_abc123",
    "clientResponse": "The problem is that..."
  }'
```

---

## Metrics & Analytics

Track these KPIs to measure agent effectiveness:

| Metric | What It Measures | Target |
|--------|------------------|--------|
| **Session Completion Rate** | % of sessions that reach "action" stage | >70% |
| **Average Session Length** | Number of conversation turns | 12-18 turns |
| **Insight Density** | Key insights per 10 turns | >3 |
| **Client Satisfaction** | Post-session rating (1-5) | >4.2 |
| **Follow-through Rate** | % who take suggested next steps | >40% |
| **Return Rate** | % who start another session | >25% |

---

## Roadmap

### Phase 1: ✅ Core Functionality (Current)
- [x] Conversational brainstorming
- [x] Session management
- [x] Structured coaching questions
- [x] Multi-stage progression

### Phase 2: 🔄 Enhanced Intelligence (Next)
- [ ] Vector DB for long-term memory
- [ ] Sentiment analysis for breakthrough detection
- [ ] Personalized coaching styles (MBTI, Enneagram)
- [ ] Multi-language support

### Phase 3: 🔮 Advanced Features (Future)
- [ ] Voice-to-voice conversations (real-time)
- [ ] Visual ideation tools (mind maps, sketches)
- [ ] Collaborative sessions (multiple clients)
- [ ] Idea evolution tracking dashboard
- [ ] Integration with project management tools

---

## Troubleshooting

### Issue: Agent gives generic responses
**Cause:** OpenAI API key not configured
**Fix:** Set `OPENAI_API_KEY` environment variable

### Issue: Session not found
**Cause:** Session expired (24h timeout) or server restarted
**Fix:** Start a new session

### Issue: Responses don't build on context
**Cause:** Conversation history not being maintained
**Fix:** Check session ID is consistent across requests

### Issue: Agent stuck in one stage
**Cause:** Turn count threshold not reached
**Fix:** Continue conversation or manually adjust stage thresholds

---

## Support

For questions, issues, or feature requests:
- **Documentation:** `/documentation/IDEATION_COACH_AGENT.md`
- **Tests:** `test-ideation-coach.sh`
- **Source:** `packages/api/src/agents/ideation-coach.agent.ts`
- **Endpoints:** `packages/api/src/voice/voice.router.ts`

---

## License

Part of the Elevated Movements AI Ecosystem.
© 2025 Elevated Movements. All rights reserved.
