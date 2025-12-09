# EM-AI Ecosystem  
## 30-Day Execution Plan  
### Phase 2B → Phase 6 Launch  
**Document Version:** 1.0  
**Generated:** 2025-12-05  

---

# 📌 Overview

This document outlines the **correct, reality-aligned 30-day execution plan** for progressing the EM-AI ecosystem from its current state through:

- Full completion of **Phase 2B** (real integrations)
- Staged activation and production launch of **Phase 6 Growth Agents**

This plan is based entirely on the **actual codebase and documentation contained in the December 2025 `/em2.zip` repo**, including:

- `AGENT_INVENTORY.md`
- `CURRENT_PHASE_OVERVIEW.md`
- `LIVE_PRODUCTION_READY.md`
- `PHASE_2B_IMPLEMENTATION_GUIDE.md`
- `PHASE_6_ROLLOUT.md`
- `PHASE_3_COMPLETE.md`
- Existing service architecture (Docker, Postgres, Redis, Voice API, Agent Factory, BullMQ, Feature Flags)

No assumptions. No fabricated agents. No generic pruning.

---

# 🚀 Phase Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 | Complete | Environment, Docker, base services |
| Phase 1 | Complete | Agent Factory + core agent execution |
| Phase 2 | Complete | Base agents + API layer |
| Phase 2B | **CURRENT PRIORITY** | Real integrations: Calendar, Email, Slack |
| Phase 2C | Complete | Insights engine + additional agents |
| Phase 3 | Complete | Mobile & multimodal integration |
| Phase Voice-0 | Complete | Voice API + ElevenLabs |
| Phase 6 | **NEXT PRIORITY** | 5 Growth Agents behind feature flags |

---

# 🧭 30-Day Execution Roadmap  
*(Day-by-day breakdown)*

---

# WEEK 1 — Phase 2B: Google Calendar Integration  
> From `PHASE_2B_IMPLEMENTATION_GUIDE.md`

## **Day 1–2: Set up Calendar Credentials**
- Decide OAuth vs Service Account  
- Enable Calendar API in Google Cloud  
- Add credential JSON and environment variables  
- Confirm scopes  

## **Day 3–4: Implement Real Calendar Client**
Replace mocks with:
- `listUpcomingEvents`
- `insertEvent`
- `deleteEvent`
- Structured error handling

## **Day 5–7: Calendar End-to-End Testing**
- Event creation  
- Conflict detection  
- Timezone testing  
- RhythmAgent dependency validation  

**Deliverable:** Calendar fully hooked into real API.

---

# WEEK 2 — Phase 2B: Email + Slack + DB Hooks

## **Day 8–10: Email Delivery**
- Implement Gmail API or SMTP  
- `sendEmail()` with HTML templates  
- Templates: Daily Brief, Growth Reports  

## **Day 11–13: Slack Integration**
- Slack bot + signing secret  
- Send messages to channels and DMs  
- Email → Slack user lookup  

## **Day 14: Finalize DB Writes**
- Verify and enforce writes to:  
  - `tasks`  
  - `activities`  
  - `task_history`  

**Deliverable:** Phase 2B integrations complete.

---

# WEEK 3 — Phase 6 Staging Activation  
> From `PHASE_6_ROLLOUT.md`

## **Day 15–16: Enable Feature Flags in Staging**
Flags:
ENABLE_GROWTH_AGENTS=true
ENABLE_JOURNAL_AGENT=true
ENABLE_NICHE_AGENT=true
ENABLE_MINDSET_AGENT=true
ENABLE_RHYTHM_AGENT=true
ENABLE_PURPOSE_AGENT=true

markdown
Copy code

## **Day 17–18: Staging Tests**
### Journal Agent
- DB writes  
- Morning/evening flows  
- Optional email summaries  

### Niche Agent
- Market assessment  
- Positioning + narrative synthesis  

### Mindset Agent
- Belief extraction  
- Reframing pipeline  

### Rhythm Agent
- Calendar density analysis (requires Phase 2B)  
- Focus block generation  

### Purpose Agent
- Ikigai quadrant mapping  
- Purpose statement generation  

## **Day 19–21: Stabilization**
- Fix logging gaps  
- Fix queue/worker issues  
- Validate staging dashboard  

---

# WEEK 4 — Phase 6 Production Launch

## **Day 22–24: Dark Launch (Internal Only)**
Enabled for:
- You  
- Shria  

Monitor:
- BullMQ latency  
- Redis memory  
- API quota usage  
- Daily agent health  

## **Day 25–27: Full Internal Rollout**
Enable:
ENABLE_GROWTH_DASHBOARD=true

markdown
Copy code
Test:
- Rhythm insights  
- Purpose reports  
- Niche worksheets  
- Journal history  
- Mindset reframes  

## **Day 28–29: External Beta**
Roll out to a limited number of coaching clients.

## **Day 30: Full Production Release**
- Flip all flags ON  
- Final health checks  
- Update:  
  - `AGENT_INVENTORY.md`  
  - `CURRENT_PHASE_OVERVIEW.md`  
  - `LIVE_PRODUCTION_READY.md`

---

# 📁 Task Breakdown (for GitHub Issues)  

30 issues were prepared for this phase of work.  
They are grouped into:

- **12 Phase 2B integration tasks**
- **14 Phase 6 activation tasks**
- **4 documentation cleanup tasks**

Issues include:
- Descriptions  
- Acceptance criteria  
- Dependencies  
- Labels  
- Priorities  

(See `/docs/GITHUB_ISSUES_BUNDLE.md` if created.)

---

# 🧩 Architectural Requirements

The following components MUST be stable for Phase 6 success:

### Core Services
- Redis  
- BullMQ queues  
- PostgreSQL  
- Agent Factory  
- Feature Flags  
- Voice API (ElevenLabs)

### External Integrations
- Google Calendar  
- Gmail / SMTP  
- Slack API  

### Internal Agents (Production-Ready)
- Calendar Optimizer  
- Inbox Assistant  
- Task Orchestrator  
- Insight Analyst  
- Financial Allocator  
- Content Synthesizer  
- Relationship Tracker  
- Brand Storyteller  

### Phase 6 Agents (Behind Feature Flags)
- Journal Agent  
- Niche Agent  
- Mindset Agent  
- Rhythm Agent  
- Purpose Agent  

---

# 🎯 Final Deliverables by Day 30

### ✔ Phase 2B complete (real external integrations)
### ✔ Phase 6 live in production
### ✔ Growth Dashboard active
### ✔ Documentation updated + consolidated
### ✔ All 19 agents fully integrated and stable
### ✔ End-to-end intelligence across:
- Calendar  
- Email  
- Slack  
- Mobile  
- Voice  
- Web  
- Internal DB  

Your system becomes **the complete coaching + productivity + growth engine** you originally designed.

---