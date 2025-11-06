# Concurrent Agent Execution Plan

**Last Updated**: November 6, 2025
**Status**: Phase 2B - Ready for Parallel Execution

---

## 🎯 Overview

This document defines how multiple Claude agents can work **concurrently** on different phases without merge conflicts.

---

## 📊 Phase 2B - 4 Concurrent Agents

### Agent 1: Calendar Integration
**Branch**: `claude/phase2b-calendar-{sessionId}`
**Priority**: HIGH
**Estimated Time**: 1-2 hours

**Files to Create**:
- `packages/api/src/services/calendar.service.ts`
- `tests/integration/calendar.test.ts`

**Files to Modify**:
- `packages/api/src/agents/agent-factory.ts`
  - **ONLY Lines 80-170** (calendar methods)
  - Methods: `blockFocusTime`, `confirmMeeting`, `rescheduleMeeting`

**Dependencies**: NONE

**Tasks**:
- [ ] Install `googleapis` package
- [ ] Create CalendarService class
- [ ] Implement Google Calendar API integration
- [ ] Update blockFocusTime with real API calls
- [ ] Update confirmMeeting with real API calls
- [ ] Update rescheduleMeeting with real API calls
- [ ] Write integration tests
- [ ] Update environment variables template

**Success Criteria**:
- ✓ Real events created in Google Calendar
- ✓ Conflict detection working
- ✓ Tests passing
- ✓ No mock responses

---

### Agent 2: Notifications Stack
**Branch**: `claude/phase2b-notifications-{sessionId}`
**Priority**: HIGH
**Estimated Time**: 1-2 hours

**Files to Create**:
- `packages/api/src/services/email.service.ts`
- `packages/api/src/services/slack.service.ts`
- `tests/integration/notifications.test.ts`

**Files to Modify**:
- `packages/api/src/agents/agent-factory.ts`
  - **ONLY Lines 372-384** (notification methods)
  - Methods: `sendEmailNotification`, `sendSlackNotification`

**Dependencies**: NONE

**Tasks**:
- [ ] Install `nodemailer` and `@slack/web-api` packages
- [ ] Create EmailService class
- [ ] Create SlackService class
- [ ] Implement email templates
- [ ] Implement Slack message templates
- [ ] Update sendEmailNotification with real API
- [ ] Update sendSlackNotification with real API
- [ ] Write integration tests
- [ ] Update environment variables template

**Success Criteria**:
- ✓ Emails delivered via Gmail/SMTP
- ✓ Slack messages appear in DMs
- ✓ Templates rendering correctly
- ✓ Tests passing

---

### Agent 3: Database Layer
**Branch**: `claude/phase2b-database-{sessionId}`
**Priority**: CRITICAL (foundation for others)
**Estimated Time**: 1-2 hours

**Files to Create**:
- `packages/api/src/services/database.service.ts`
- `db/migrations/001_create_tasks.sql`
- `db/migrations/002_create_activities.sql`
- `db/migrations/003_create_notifications.sql`
- `tests/integration/database.test.ts`

**Files to Modify**:
- `packages/api/src/agents/agent-factory.ts`
  - **ONLY Lines 176-231** (task/database methods)
  - Methods: `logTaskComplete`, `createFollowUp`, `recordActivity`

**Dependencies**: NONE

**Tasks**:
- [ ] Install `pg` package
- [ ] Create DatabaseService class
- [ ] Create migration files (tasks, activities, notifications)
- [ ] Run migrations
- [ ] Implement logTaskComplete with real DB
- [ ] Implement createFollowUp with real DB
- [ ] Implement recordActivity with real DB
- [ ] Write integration tests
- [ ] Document database schema

**Success Criteria**:
- ✓ Migrations run successfully
- ✓ Tasks stored/retrieved from PostgreSQL
- ✓ Activities logged correctly
- ✓ Tests passing
- ✓ Connection pool working

---

### Agent 4: Stub Agents Implementation
**Branch**: `claude/phase2b-stub-agents-{sessionId}`
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Files to Create**:
- `packages/api/src/agents/daily-brief.agent.ts`
- `packages/api/src/agents/grant-researcher.agent.ts`
- `packages/api/src/agents/relationship-tracker.agent.ts`
- `packages/api/src/agents/financial-allocator.agent.ts`
- `packages/api/src/agents/insight-analyst.agent.ts`
- `packages/api/src/agents/content-synthesizer.agent.ts`
- `packages/api/src/agents/brand-storyteller.agent.ts`
- `tests/unit/stub-agents.test.ts`

**Files to Modify**:
- `packages/api/src/agents/agent-factory.ts`
  - **ONLY Lines 232-371** (stub agent methods)
  - All 7 stub agent implementations

**Dependencies**: Agent 3 (database layer recommended but not required)

**Tasks**:
- [ ] Implement Daily Brief Agent (morning summaries)
- [ ] Implement Grant Researcher Agent (grant discovery)
- [ ] Implement Relationship Tracker Agent (contact engagement)
- [ ] Implement Financial Allocator Agent (budget planning)
- [ ] Implement Insight Analyst Agent (pattern detection)
- [ ] Implement Content Synthesizer Agent (content generation)
- [ ] Implement Brand Storyteller Agent (brand consistency)
- [ ] Create API endpoints for each agent
- [ ] Write unit tests
- [ ] Document each agent's capabilities

**Success Criteria**:
- ✓ All 7 agents implemented
- ✓ Each agent has real logic (not mocks)
- ✓ API endpoints working
- ✓ Tests passing
- ✓ Documentation complete

---

## 🔄 Merge Strategy

### Order of Integration (if conflicts arise)
1. **Agent 3** (Database) - Merge FIRST (foundation)
2. **Agent 1** (Calendar) - Merge SECOND
3. **Agent 2** (Notifications) - Merge THIRD
4. **Agent 4** (Stub Agents) - Merge LAST

### Integration Branch
```
main
  ↑
phase2b-integration (integration branch)
  ↑         ↑         ↑         ↑
Agent1   Agent2   Agent3   Agent4
```

### Merge Process
1. Each agent pushes to their branch
2. Create PR to `phase2b-integration` (not main)
3. Review and merge in order (3 → 1 → 2 → 4)
4. Run full integration tests
5. Merge `phase2b-integration` → `main`

---

## 📊 Phase 3 - 5 Concurrent Agents

### Agent 5: Mobile App Foundation
**Branch**: `claude/phase3-mobile-foundation-{sessionId}`
**Estimated Time**: 3-4 hours
**Dependencies**: NONE

**Files**: Entire `packages/mobile/` directory (new)

**Tasks**:
- React Native setup
- Navigation structure
- UI components
- API client
- Authentication

---

### Agent 6: Voice Input Integration
**Branch**: `claude/phase3-voice-input-{sessionId}`
**Estimated Time**: 2-3 hours
**Dependencies**: Agent 5

**Files**: `packages/mobile/src/voice/*` (new)

**Tasks**:
- Speech-to-text integration
- Voice command parsing
- Audio recording UI

---

### Agent 7: Analytics Dashboard
**Branch**: `claude/phase3-analytics-{sessionId}`
**Estimated Time**: 3-4 hours
**Dependencies**: NONE

**Files**: `packages/dashboard/src/pages/analytics/*` (new)

**Tasks**:
- Analytics API endpoints
- Dashboard UI
- Charts/visualizations
- Real-time metrics

---

### Agent 8: Advanced Scheduling
**Branch**: `claude/phase3-scheduling-{sessionId}`
**Estimated Time**: 2-3 hours
**Dependencies**: NONE

**Files**: `packages/core/src/scheduling/*` (new)

**Tasks**:
- Conflict prediction
- Optimal time-finding
- Meeting optimization

---

### Agent 9: Multi-user Support
**Branch**: `claude/phase3-multiuser-{sessionId}`
**Estimated Time**: 2-3 hours
**Dependencies**: Agent 3 (database)

**Files**: Database migrations, auth middleware

**Tasks**:
- Multi-tenancy schema
- User management
- RBAC
- Team support

---

## 📊 Phase 4 - 4 Concurrent Agents

### Agent 10: ML/Preference Learning
**Branch**: `claude/phase4-ml-learning-{sessionId}`
**Estimated Time**: 4-5 hours
**Dependencies**: Agent 7 (analytics)

**Files**: `packages/ml/*` (new)

---

### Agent 11: Voice Customization
**Branch**: `claude/phase4-voice-custom-{sessionId}`
**Estimated Time**: 2-3 hours
**Dependencies**: NONE

**Files**: `packages/api/src/voice/voice.profiles.ts` (new)

---

### Agent 12: Team Features
**Branch**: `claude/phase4-team-features-{sessionId}`
**Estimated Time**: 3-4 hours
**Dependencies**: Agent 9 (multi-user)

**Files**: `packages/team/*` (new)

---

### Agent 13: Predictive Scheduling
**Branch**: `claude/phase4-predictive-{sessionId}`
**Estimated Time**: 3-4 hours
**Dependencies**: Agent 10 (ML)

**Files**: `packages/core/src/predictive/*` (new)

---

## 🎯 Coordination Rules

### For All Agents

1. **Read this file FIRST** before starting work
2. **Claim your agent** by updating status below
3. **Stay within file boundaries** defined for your agent
4. **Update status** when done
5. **Create PR** to integration branch (not main)

### File Conflict Prevention

**agent-factory.ts** - Multiple agents modify this file:
- Agent 1: Lines 80-170 only (calendar methods)
- Agent 2: Lines 372-384 only (notification methods)
- Agent 3: Lines 176-231 only (database methods)
- Agent 4: Lines 232-371 only (stub agents)

**Rule**: Only modify YOUR assigned line ranges!

### Communication

**Status Updates**: Update this file with your progress
```markdown
### Agent Status
- Agent 1 (Calendar): ✅ COMPLETE - Nov 6, 2025 10:30 AM
- Agent 2 (Notifications): 🔄 IN PROGRESS - Started Nov 6, 2025 10:00 AM
- Agent 3 (Database): ⏳ PENDING
- Agent 4 (Stub Agents): ⏳ PENDING
```

---

## 📋 Current Status

### Phase 2B Agents

| Agent | Status | Branch | Started | Completed |
|-------|--------|--------|---------|-----------|
| Agent 1 (Calendar) | ⏳ PENDING | - | - | - |
| Agent 2 (Notifications) | ⏳ PENDING | - | - | - |
| Agent 3 (Database) | ⏳ PENDING | - | - | - |
| Agent 4 (Stub Agents) | ⏳ PENDING | - | - | - |

### Phase 3 Agents

| Agent | Status | Branch | Started | Completed |
|-------|--------|--------|---------|-----------|
| Agent 5 (Mobile) | ⏳ PENDING | - | - | - |
| Agent 6 (Voice Input) | ⏳ PENDING | - | - | - |
| Agent 7 (Analytics) | ⏳ PENDING | - | - | - |
| Agent 8 (Scheduling) | ⏳ PENDING | - | - | - |
| Agent 9 (Multi-user) | ⏳ PENDING | - | - | - |

### Phase 4 Agents

| Agent | Status | Branch | Started | Completed |
|-------|--------|--------|---------|-----------|
| Agent 10 (ML) | ⏳ PENDING | - | - | - |
| Agent 11 (Voice Custom) | ⏳ PENDING | - | - | - |
| Agent 12 (Team Features) | ⏳ PENDING | - | - | - |
| Agent 13 (Predictive) | ⏳ PENDING | - | - | - |

---

## 🚀 Quick Start for New Agent

1. **Read this file completely**
2. **Claim your agent** (update status table above)
3. **Create your branch**: `git checkout -b claude/phase2b-{domain}-{sessionId}`
4. **Read your agent's section** above
5. **Start coding** within your file boundaries
6. **Run tests** before committing
7. **Push to your branch**
8. **Create PR** to `phase2b-integration`
9. **Update status** when complete

---

## 🎯 Success Metrics

### Phase 2B Complete When:
- ✅ All 4 agents marked COMPLETE
- ✅ All PRs merged to integration branch
- ✅ Full integration tests passing
- ✅ No mock responses remaining
- ✅ All services wired to real APIs

### Estimated Timeline:
- **Concurrent execution**: 2-3 hours (all agents working simultaneously)
- **Sequential execution**: 8-12 hours (one at a time)
- **Speedup**: ~4x faster with concurrent agents

---

**Next**: When Phase 2B is complete, move to Phase 3 agents following same pattern.
