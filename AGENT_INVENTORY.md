# EM AI Ecosystem - Complete Agent Inventory

**Generated**: November 21, 2025
**Total Agents**: 19 agents across all branches

---

## Overview

The EM AI Ecosystem consists of multiple specialized AI agents organized into three categories:
1. **Core Operational Agents** (13 agents) - Production agents in main branch
2. **Growth & Personal Development Agents** (5 agents) - Phase 6 growth agents
3. **Conversational Agents** (1 agent) - Ideation and coaching

---

## 1. Core Operational Agents (13 Agents)

**Location**: `packages/api/src/agents/agent-factory.ts` (main branch)
**Status**: ✅ Production Ready

### 1.1 Calendar Optimizer Agent
- **Purpose**: Focus time blocking, meeting optimization, and scheduling
- **Key Methods**:
  - `blockFocusTime()` - Creates calendar blocks for deep work
  - `confirmMeeting()` - Schedules meetings with attendees
  - `rescheduleMeeting()` - Updates meeting times and notifies attendees
- **Integrations**: Google Calendar API
- **API Endpoint**: `/api/voice/focus`, `/api/voice/meeting`

### 1.2 Inbox Assistant Agent
- **Purpose**: Task completion tracking and inbox management
- **Key Methods**:
  - `logTaskComplete()` - Marks tasks as complete with notes
- **Integrations**: Database service, Email notifications
- **API Endpoint**: `/api/voice/task/complete`

### 1.3 Task Orchestrator Agent
- **Purpose**: Follow-up task creation and task workflow management
- **Key Methods**:
  - `createFollowUp()` - Creates new tasks with due dates
- **Integrations**: Database service, Notification system
- **API Endpoint**: `/api/voice/task/followup`

### 1.4 Voice Companion Agent (Mindfulness Coach)
- **Purpose**: Guided pause/meditation sessions for stress relief
- **Key Methods**:
  - `startPause()` - Initiates guided meditation
  - `getPauseGuidance()` - Provides meditation instructions
- **Features**:
  - 4 meditation styles: `breath`, `box`, `grounding`, `body-scan`
  - Breathing exercises (4-4-6 pattern, box breathing)
  - Grounding techniques (5-4-3-2-1 method)
  - Body scan meditation
- **Integrations**: Deep Work Defender (for activity tracking)
- **API Endpoint**: `/api/voice/coach/pause`

### 1.5 Deep Work Defender Agent
- **Purpose**: Activity tracking and focus protection
- **Key Methods**:
  - `recordActivity()` - Logs work activities and durations
- **Integrations**: Database service
- **API Endpoint**: Internal (called by other agents)

### 1.6 Notification System Agent
- **Purpose**: Multi-channel notification delivery
- **Key Methods**:
  - `sendNotification()` - Sends notifications via email/Slack/SMS
  - `sendEmailNotification()` - Email delivery via Gmail/SMTP
  - `sendSlackNotification()` - Slack message delivery
- **Integrations**: Email service (Gmail), Slack API
- **Channels**: Email, Slack, SMS (planned)

### 1.7 Insight Analyst Agent
- **Purpose**: Activity pattern analysis and productivity insights
- **Key Methods**:
  - `getInsights()` - Generates daily/weekly/monthly insights
- **Features**:
  - Activity trend analysis
  - Productivity recommendations
  - Focus time optimization
- **Integrations**: Insights service, Database
- **API Endpoint**: `/api/voice/insights`

### 1.8 Daily Brief Agent
- **Purpose**: Morning executive summary generation
- **Key Methods**:
  - `getDailyBrief()` - Generates comprehensive daily briefing
- **Features**:
  - Calendar summary
  - Task priorities
  - Key metrics
  - Action items
- **Integrations**: Insights service
- **API Endpoint**: `/api/voice/brief`

### 1.9 Grant Researcher Agent
- **Purpose**: Grant opportunity discovery and tracking
- **Key Methods**:
  - `getGrantOpportunities()` - Finds relevant grants
- **Features**:
  - Grant database integration (planned)
  - Relevance scoring
  - Deadline tracking
- **Integrations**: External grant databases (Foundation Center, Grants.gov)
- **API Endpoint**: `/api/voice/grants`

### 1.10 Relationship Tracker Agent
- **Purpose**: Contact engagement and relationship management
- **Key Methods**:
  - `trackRelationship()` - Records contact interactions
- **Features**:
  - Interaction logging
  - Relationship health scoring
  - Follow-up reminders
- **Integrations**: Database service
- **API Endpoint**: `/api/voice/relationship`

### 1.11 Financial Allocator Agent
- **Purpose**: Budget planning and financial forecasting
- **Key Methods**:
  - `allocateBudget()` - Smart budget allocation by category
- **Features**:
  - Goal-based allocation (Marketing, Product, Operations, Contingency)
  - Historical data analysis
  - Budget recommendations
- **API Endpoint**: `/api/voice/budget`

### 1.12 Content Synthesizer Agent
- **Purpose**: Multi-platform content generation
- **Key Methods**:
  - `generateContent()` - Creates content for social/blog/email
  - `generateHashtags()` - Generates relevant hashtags
- **Features**:
  - Platform-specific templates (social, blog, email)
  - AI-powered content (GPT-4 integration planned)
  - Hashtag generation
- **API Endpoint**: `/api/voice/content`

### 1.13 Brand Storyteller Agent
- **Purpose**: Brand narrative and mission statement creation
- **Key Methods**:
  - `generateBrandStory()` - Creates brand narratives
- **Features**:
  - Mission statement generation
  - Core story development
  - Value propositions
- **API Endpoint**: `/api/voice/brand`

---

## 2. Growth & Personal Development Agents (5 Agents)

**Location**: `packages/api/src/growth-agents/`
**Status**: ✅ Integrated - Behind Feature Flags (Phase 6)
**Branch**: `claude/count-total-items-01MMaVUwuCPEuiTLPMdkL6Sj`
**Orchestration**: BullMQ-based concurrent execution via Growth Orchestrator
**Feature Flags**: `ENABLE_GROWTH_AGENTS`, `ENABLE_GROWTH_DASHBOARD`

### 2.1 Journal Agent (Rooted Phase)
- **Purpose**: Daily alignment journal with AI summarization
- **File**: `journal-agent.ts`
- **Key Features**:
  - Google Sheets integration for journal entries
  - AI-powered sentiment analysis (OpenAI GPT-4)
  - Weekly digest generation
  - Email delivery of summaries
- **Integrations**:
  - Google Sheets API
  - OpenAI API
  - Nodemailer (SMTP)
- **Artifacts**:
  - Google Sheets journal
  - Weekly digest emails
- **API Endpoints**: Via orchestrator (`/api/orchestrator/launch`)

### 2.2 Niche Agent (Grounded Phase)
- **Purpose**: Niche discovery through Q&A and embeddings clustering
- **File**: `niche-agent.ts`
- **Key Features**:
  - Guided niche discovery questionnaire
  - Embeddings-based theme clustering (OpenAI embeddings)
  - PDF niche clarity report generation (Puppeteer)
  - Visual theme mapping
- **Integrations**:
  - OpenAI Embeddings API
  - Puppeteer (PDF generation)
- **Artifacts**:
  - Niche clarity PDF report
  - Theme clustering data
- **Validation**: Report URL verification

### 2.3 Mindset Agent (Grounded Phase)
- **Purpose**: Limiting belief reframing and affirmation generation
- **File**: `mindset-agent.ts`
- **Key Features**:
  - Limiting belief identification
  - AI-powered cognitive reframing (OpenAI GPT-4)
  - Affirmation generation
  - Micro-practice suggestions
  - Google Sheets belief tracking
  - Weekly snapshot emails
- **Integrations**:
  - Google Sheets API
  - OpenAI API
  - Nodemailer (SMTP)
- **Artifacts**:
  - Mindset tracking spreadsheet
  - Weekly snapshot emails
- **Validation**: Spreadsheet creation verification

### 2.4 Rhythm Agent (Rooted Phase)
- **Purpose**: Calendar density analysis and pause block insertion
- **File**: `rhythm-agent.ts`
- **Key Features**:
  - 14-day calendar analysis
  - High-density period detection
  - Automatic pause block creation
  - Rest and recovery scheduling
  - Email schedule summaries
- **Integrations**:
  - Google Calendar API
  - Nodemailer (SMTP)
- **Artifacts**:
  - Calendar pause blocks
  - Schedule summary emails
- **Validation**: Pause block creation verification

### 2.5 Purpose Agent (Radiant Phase)
- **Purpose**: Ikigai-based purpose discovery and declaration
- **File**: `purpose-agent.ts`
- **Key Features**:
  - Ikigai framework questionnaire (skills, passions, values, audience, impact)
  - AI-powered purpose synthesis (OpenAI GPT-4)
  - Branded purpose card generation (PDF with EM colors)
  - 7-day daily affirmation queue (SMS via Twilio)
- **Integrations**:
  - OpenAI API
  - Puppeteer (PDF generation)
  - Twilio (SMS)
  - Nodemailer (email)
- **Artifacts**:
  - Purpose declaration PDF card
  - Daily SMS affirmations (7 days)
- **Validation**: Purpose statement and card URL verification

### 2.6 Growth Orchestrator
- **Purpose**: Coordinates all 5 growth agents with concurrent execution
- **File**: `orchestrator.ts`
- **Key Features**:
  - BullMQ job queue integration
  - Concurrent agent execution (Promise.all)
  - Progress tracking and event emission
  - Health checks and readiness monitoring
  - In-memory storage with Redis extensibility
- **API Endpoints**:
  - `POST /api/orchestrator/launch` - Launch all agents
  - `GET /api/orchestrator/health` - Health and status
  - `GET /api/orchestrator/readiness` - Readiness summary
  - `GET /api/orchestrator/progress` - Progress snapshot
  - `GET /api/orchestrator/agents` - List all agents

---

## 3. Conversational Agents (1 Agent)

**Location**: `packages/api/src/agents/ideation-coach.agent.ts` (growth orchestrator branch)
**Status**: ✅ Implemented (Commit 2091af4)

### 3.1 Ideation Coach Agent
- **Purpose**: Conversational brainstorming and idea refinement
- **File**: `ideation-coach.agent.ts`
- **Key Features**:
  - 4-stage progression: Discovery → Exploration → Refinement → Action
  - Coaching frameworks (GROW model, 5 Whys, Design Thinking)
  - Session memory and conversation history (24h timeout)
  - AI-powered responses (OpenAI GPT-4, 0.8 temperature)
  - Key insights tracking
  - Action item generation
- **Session Management**:
  - In-memory session store
  - Conversation context (last 10 turns)
  - Multiple concurrent sessions
- **API Endpoints**:
  - `POST /api/voice/ideation/start` - Start new session
  - `POST /api/voice/ideation/continue` - Continue conversation
  - `GET /api/voice/ideation/summary/:sessionId` - Get insights
  - `POST /api/voice/ideation/end` - End session with summary
  - `GET /api/voice/ideation/sessions` - View all sessions
- **Use Cases**:
  - Client discovery calls
  - Onboarding new clients
  - Workshop facilitation
  - Product idea validation

---

## Agent Categorization by Function

### 📅 Calendar & Time Management (3 agents)
1. Calendar Optimizer - Meeting scheduling and optimization
2. Rhythm Agent - Calendar density analysis and pause scheduling
3. Deep Work Defender - Focus time protection

### ✉️ Communication & Notifications (3 agents)
4. Inbox Assistant - Email and task management
5. Notification System - Multi-channel notifications
6. Relationship Tracker - Contact engagement tracking

### 📊 Analytics & Insights (3 agents)
7. Insight Analyst - Pattern detection and recommendations
8. Daily Brief - Executive summary generation
9. Financial Allocator - Budget planning and forecasting

### 🎨 Content & Branding (2 agents)
10. Content Synthesizer - Multi-platform content creation
11. Brand Storyteller - Brand narrative development

### 🧘 Wellness & Personal Development (3 agents)
12. Voice Companion (Mindfulness Coach) - Meditation and breathing
13. Mindset Agent - Limiting belief reframing
14. Purpose Agent - Purpose discovery and declaration

### 🎯 Growth & Discovery (3 agents)
15. Niche Agent - Niche discovery and validation
16. Journal Agent - Daily reflection and journaling
17. Ideation Coach - Conversational brainstorming

### 💼 Business Operations (2 agents)
18. Task Orchestrator - Task workflow management
19. Grant Researcher - Grant opportunity discovery

---

## Integration Architecture

### External Service Integrations
- **Google Workspace**: Calendar API, Sheets API, Drive API, Gmail API
- **AI/ML Services**: OpenAI (GPT-4, Embeddings), Claude (fallback)
- **Communication**: Twilio (SMS), Slack API, Nodemailer (SMTP)
- **Infrastructure**: BullMQ (job queues), Redis (caching), PostgreSQL (database)
- **Utilities**: Puppeteer (PDF generation), ElevenLabs (voice synthesis)

### Agent Communication Patterns
1. **Synchronous**: Direct method calls via agent factory
2. **Asynchronous**: BullMQ job queues for growth agents
3. **Event-driven**: Progress tracking and status updates
4. **Orchestrated**: Growth orchestrator coordinates multi-agent workflows

---

## Branch Distribution

| Branch | Agents | Status |
|--------|--------|--------|
| `main` / `origin/main` | 13 core operational agents | ✅ Production |
| `origin/claude/phase6-growth-agents-*` | 5 growth agents + orchestrator | 🚧 Phase 6 Development |
| `origin/claude/add-growth-agent-orchestrator-*` | 5 growth agents (orchestrator package) | 🚧 Development |
| Commit `2091af4` | 1 ideation coach agent | ✅ Implemented |

---

## Deployment Status

### Production (Main Branch)
- **13 Core Agents**: Fully operational
- **Infrastructure**: Render (API) + Vercel (Frontend)
- **Database**: PostgreSQL on Render
- **Monitoring**: Real-time dashboard at `/agents.html`

### Integrated - Behind Feature Flags (Phase 6)
- **5 Growth Agents**: ✅ Fully integrated
- **Orchestrator**: ✅ BullMQ-based concurrent execution
- **Testing**: ✅ Unit tests + integration tests complete
- **Feature Flags**: `ENABLE_GROWTH_AGENTS=false` (default), `ENABLE_GROWTH_DASHBOARD=false` (default)
- **Status**: Ready for staging/production rollout
- **Rollout Guide**: See `PHASE_6_ROLLOUT.md`

### Standalone (Ideation Coach)
- **Status**: Implemented but not yet integrated
- **Documentation**: `IDEATION_COACH_AGENT.md`, `IDEATION_COACH_QUICKSTART.md`
- **Testing**: E2E test script (`test-ideation-coach.sh`)
- **Next Steps**: Integrate with main agent factory or orchestrator

---

## Total Agent Count Summary

| Category | Count | Status |
|----------|-------|--------|
| Core Operational Agents | 13 | ✅ Production |
| Growth & Development Agents | 5 | 🚧 Development |
| Conversational Agents | 1 | ✅ Implemented |
| **TOTAL** | **19** | Mixed |

---

## Future Roadmap

### Planned Agents (Not Yet Implemented)
- **Book Writing Agent**: Guide users through book writing process
- **Membership Guardian**: Community engagement tracking (mentioned in README)
- **Voice Real-time Agent**: Real-time voice conversations (mentioned in ideation coach docs)

### Agent Enhancements
- **Vector DB Integration**: Long-term memory for ideation coach
- **Sentiment Analysis**: Breakthrough detection in conversations
- **Multi-client Sessions**: Collaborative ideation sessions
- **Advanced Metrics**: Physiological tracking for mindfulness sessions

---

## Notes

1. **Naming Variations**:
   - "EM AI Executive Admin" = The entire ecosystem of all agents
   - "Mindfulness Coach" = Voice Companion Agent
   - "Voice Companion" = Official name in agent factory

2. **Agent Overlaps**:
   - Rhythm Agent & Calendar Optimizer: Both manage calendar blocks (proactive vs reactive)
   - Journal Agent & Daily Brief: Both generate summaries (personal vs operational)
   - Mindset Agent & Voice Companion: Both support wellness (cognitive vs somatic)

3. **Architecture Evolution**:
   - Phase 1-2: Core operational agents (agent-factory.ts)
   - Phase 6: Growth agents with orchestrator (growth-agents/)
   - Future: Unified architecture with all agents

---

**Document maintained by**: EM AI Development Team
**Last updated**: November 21, 2025
**Next review**: Upon Phase 6 merge to main branch
