# EM-AI Ecosystem – GitHub Issues Bundle
## Phase 2B → Phase 6 Launch

This document contains a **30-issue bundle** you can use to create GitHub issues for the current execution phase:

- Complete **Phase 2B** (real integrations for Calendar, Email, Slack, DB logging)
- Activate and launch **Phase 6** Growth Agents (Journal, Niche, Mindset, Rhythm, Purpose)
- Light documentation and cleanup

You can:

- Copy/paste each issue into GitHub manually, or  
- Use this as a reference for a GitHub API / script-based bulk importer.

---

## Legend

- **Labels** are suggestions; adapt to your repo’s naming.
- **Dependencies** are textual references; enforce them via Projects or manually.

---

## Phase 2B – Integrations (12 Issues)

---

### Issue 1 – Setup Google Calendar Credentials

**Title:** Phase 2B: Setup Google Calendar Credentials  

**Description:**  
Create Google Calendar credentials (service account or OAuth) and configure environment variables for EM-AI to access real calendars.

**Tasks:**
- Decide between service account vs OAuth user consent
- Enable Google Calendar API in Google Cloud Console
- Download credentials JSON and store securely
- Add `GOOGLE_APPLICATION_CREDENTIALS` and any related env vars
- Verify connectivity with a simple test script

**Acceptance Criteria:**
- Calendar API is enabled in the GCP project
- Credentials are stored and referenced via environment variables
- A simple “list upcoming events” test succeeds locally

**Labels:** `Phase2B`, `Integration`, `Calendar`, `Priority: High`  

---

### Issue 2 – Implement Google Calendar Client (List/Insert/Delete)

**Title:** Phase 2B: Implement Google Calendar Client  

**Description:**  
Replace mock calendar operations with a real Google Calendar client that supports listing, inserting, and deleting events.

**Tasks:**
- Implement a calendar client module (e.g., `calendarClient.ts`)
- Add functions: `listUpcomingEvents`, `insertEvent`, `deleteEvent`
- Handle auth, timezones, and error handling
- Log errors in a structured format

**Acceptance Criteria:**
- Calendar client can list real events from the configured calendar
- Events can be created and deleted via the API
- All operations are logged with useful error messages

**Labels:** `Phase2B`, `Calendar`, `Backend`  
**Depends on:** Issue 1  

---

### Issue 3 – Implement Calendar Conflict Detection

**Title:** Phase 2B: Implement Calendar Conflict Detection  

**Description:**  
Implement logic to detect scheduling conflicts for agents like Calendar Optimizer and Rhythm Agent.

**Tasks:**
- Define what counts as a conflict (overlap thresholds, buffer times, etc.)
- Add a `hasConflict(events, proposedEvent)` helper
- Account for timezones and all-day events
- Add unit tests

**Acceptance Criteria:**
- Conflict detection returns accurate results for overlapping and non-overlapping cases
- Tests pass for edge cases (back-to-back, overlapping, cross-day events)
- Helper is reusable across agents

**Labels:** `Phase2B`, `Calendar`, `Agent`  
**Depends on:** Issue 2  

---

### Issue 4 – Wire Real Calendar into Calendar Optimizer

**Title:** Phase 2B: Wire Google Calendar into Calendar Optimizer  

**Description:**  
Replace mock calendar calls in the Calendar Optimizer agent with the real Calendar client.

**Tasks:**
- Inject calendar client into Calendar Optimizer
- Use real events to compute focus blocks / density
- Write new events back to Google Calendar
- Log all writes and decisions

**Acceptance Criteria:**
- Calendar Optimizer reads real events and proposes realistic focus blocks
- New events are visible in the user’s calendar
- Logs reflect both recommendations and calendar writes

**Labels:** `Phase2B`, `Calendar`, `Agent`  
**Depends on:** Issues 2, 3  

---

### Issue 5 – Implement Email Sender (Gmail API or SMTP)

**Title:** Phase 2B: Implement Email Delivery Service  

**Description:**  
Add a real email delivery mechanism that EM-AI can use to send Daily Briefs, Growth reports, and notifications.

**Tasks:**
- Decide on Gmail API vs SMTP (e.g., Mailgun/SES)
- Implement `sendEmail(to, subject, html, options)` helper
- Configure credentials and env vars
- Add basic retry/error handling

**Acceptance Criteria:**
- Helper function successfully sends HTML emails in dev/staging
- Credentials and secrets are not hard-coded
- Failures are logged with enough detail to debug

**Labels:** `Phase2B`, `Email`, `Integration`, `Priority: High`  

---

### Issue 6 – Create Email Templates for Daily Brief & Growth Reports

**Title:** Phase 2B: Create Email Templates (Daily Brief, Growth Reports)  

**Description:**  
Add HTML templates for key email flows EM-AI will send.

**Tasks:**
- Create a template folder (e.g., `/templates/email/`)
- Design a Daily Brief email template
- Design a Growth Agent report template (Journal/Niche/Mindset/Rhythm/Purpose)
- Wire templates into the email sender

**Acceptance Criteria:**
- Templates render correctly in common email clients
- Daily Brief and Growth Report content can be injected into templates
- All templates are version-controlled and documented

**Labels:** `Phase2B`, `Email`, `UX`  
**Depends on:** Issue 5  

---

### Issue 7 – Implement Slack Bot Messaging

**Title:** Phase 2B: Implement Slack Bot Messaging  

**Description:**  
Create a Slack bot that can send notifications to channels and users.

**Tasks:**
- Create a Slack app with bot permissions
- Configure bot token and signing secret via env vars
- Implement `sendSlackMessage(channelOrUser, text, blocks?)`
- Test sending to a test channel

**Acceptance Criteria:**
- Bot can successfully post messages to a configured channel
- Bot can DM a user (given user ID)
- Secrets are not hard-coded

**Labels:** `Phase2B`, `Slack`, `Integration`, `Priority: High`  

---

### Issue 8 – Implement Slack User Lookup by Email

**Title:** Phase 2B: Slack User Lookup by Email  

**Description:**  
Map email addresses to Slack user IDs so agents can DM users based on email.

**Tasks:**
- Use Slack Web API to search users by email
- Implement `getSlackUserIdByEmail(email)` helper
- Add caching to reduce API calls
- Handle not-found cases gracefully

**Acceptance Criteria:**
- Helper resolves known emails to correct user IDs
- Not-found cases are handled without crashing
- Basic metrics/logging on lookup failures

**Labels:** `Phase2B`, `Slack`, `Backend`  
**Depends on:** Issue 7  

---

### Issue 9 – Add Email + Slack Notifications to Task Orchestrator

**Title:** Phase 2B: Add Email & Slack Notifications to Task Orchestrator  

**Description:**  
Wire the new Email and Slack services into the Task Orchestrator so tasks can send notifications on success/failure.

**Tasks:**
- Define notification rules (which events warrant email/Slack)
- Integrate `sendEmail` and `sendSlackMessage` into orchestrator flows
- Respect rate limits and avoid notification spam
- Log notification outcomes

**Acceptance Criteria:**
- Successful tasks can optionally notify via email/Slack
- Failed tasks can notify with error summaries
- Notifications are traceable in logs

**Labels:** `Phase2B`, `Slack`, `Email`, `Agent`  
**Depends on:** Issues 5, 7, 8  

---

### Issue 10 – Finalize DB Writes (Tasks, Activities, History)

**Title:** Phase 2B: Finalize DB Writes for Tasks, Activities, and History  

**Description:**  
Ensure all relevant agents write to `tasks`, `activities`, and `task_history` tables consistently.

**Tasks:**
- Audit current DB writes vs schema
- Fix any mismatches or missing writes
- Add helper functions for consistent insert/update logging
- Add tests or scripts to verify DB records

**Acceptance Criteria:**
- All critical flows create/update `tasks` records
- Activities and task history are recorded
- DB writes pass tests and manual spot checks

**Labels:** `Phase2B`, `Database`, `Backend`, `Priority: High`  

---

### Issue 11 – Add DB Logging to Insight Analyst & Calendar Optimizer

**Title:** Phase 2B: Add DB Logging for Insight Analyst & Calendar Optimizer  

**Description:**  
Ensure that Insight Analyst and Calendar Optimizer persist their key outputs to the database.

**Tasks:**
- Define DB schema mapping for insight artifacts and optimized calendar results
- Implement DB write logic in both agents
- Add timestamps and relevant metadata
- Verify logs via queries

**Acceptance Criteria:**
- Insight artifacts are stored with user/context IDs
- Calendar Optimizer outputs are stored with event metadata
- Data can be filtered by user/date/agent

**Labels:** `Phase2B`, `Database`, `Agent`  

---

### Issue 12 – Phase 2B End-to-End Validation

**Title:** Phase 2B: End-to-End Validation  

**Description:**  
Run full end-to-end tests for all Phase 2B integrations (Calendar, Email, Slack, DB).

**Tasks:**
- Run a “daily cycle” scenario: tasks, calendar updates, emails, Slack notifications
- Validate DB records, logs, and queue health
- Monitor for 24 hours in staging
- Document results and fixes

**Acceptance Criteria:**
- No critical errors in logs
- Calendar, Email, Slack, and DB behaviors match expectations
- Phase 2B can be marked as **Complete** in docs

**Labels:** `Phase2B`, `Validation`, `Priority: Critical`  
**Depends on:** Issues 1–11  

---

## Phase 6 – Growth Agents (14 Issues)

---

### Issue 13 – Enable Growth Agent Feature Flags in Staging

**Title:** Phase 6: Enable Growth Agent Flags in Staging  

**Description:**  
Turn on feature flags for all Phase 6 Growth Agents in the staging environment.

**Tasks:**
- Set `ENABLE_GROWTH_AGENTS=true` in staging
- Enable individual flags for Journal, Niche, Mindset, Rhythm, Purpose
- Verify agents appear in staging dashboards/routes

**Acceptance Criteria:**
- All 5 Growth Agents are reachable in staging
- No runtime errors loading them

**Labels:** `Phase6`, `Staging`, `FeatureFlag`  

---

### Issue 14 – Integrate Journal Agent with DB + Email

**Title:** Phase 6: Integrate Journal Agent with DB + Email  

**Description:**  
Wire Journal Agent so it stores entries and can send summary emails.

**Tasks:**
- Ensure DB writes for journal entries
- Optional: add daily/weekly email summaries
- Add basic controls for enabling/disabling email reports

**Acceptance Criteria:**
- Journal entries are persisted
- Summary email can be triggered for test users
- No data loss or duplication

**Labels:** `Phase6`, `Agent: Journal`, `Database`, `Email`  

---

### Issue 15 – Integrate Niche Agent with Insight Analyst & Content Synthesizer

**Title:** Phase 6: Integrate Niche Agent with Insight & Synthesis  

**Description:**  
Connect Niche Agent to Insight Analyst for evaluations and Content Synthesizer for narratives.

**Tasks:**
- Define data flow: user input → Insight Analyst → Niche logic → Content Synthesizer
- Implement composition logic
- Log niche evaluations and outputs

**Acceptance Criteria:**
- Niche Agent can generate multi-step outputs (analysis + narrative)
- Outputs are logged for review
- Agent behaves deterministically with same inputs

**Labels:** `Phase6`, `Agent: Niche`, `Analysis`, `Synthesis`  

---

### Issue 16 – Integrate Mindset Agent with Insight Analyst

**Title:** Phase 6: Integrate Mindset Agent with Insight Analyst  

**Description:**  
Use Insight Analyst to extract belief patterns for the Mindset Agent to reframe.

**Tasks:**
- Define input format for belief capture
- Use Insight Analyst to structure beliefs
- Implement reframing pipeline + next-step suggestions

**Acceptance Criteria:**
- Mindset Agent reliably surfaces limiting beliefs
- Reframed beliefs and actions are clearly output
- Artifacts stored in DB or logs

**Labels:** `Phase6`, `Agent: Mindset`, `Analysis`  

---

### Issue 17 – Integrate Rhythm Agent with Live Calendar

**Title:** Phase 6: Integrate Rhythm Agent with Live Calendar  

**Description:**  
Use the real Calendar integration to power Rhythm Agent’s density and rest recommendations.

**Tasks:**
- Connect Rhythm Agent to real calendar client
- Analyze calendar density over configurable window
- Suggest focus blocks and rest periods based on rules
- Log recommendations

**Acceptance Criteria:**
- Rhythm Agent uses actual calendar data
- Suggestions are realistic and non-overlapping
- Outputs can be written to Calendar (if configured)

**Labels:** `Phase6`, `Agent: Rhythm`, `Calendar`  
**Depends on:** Issues 1–4  

---

### Issue 18 – Integrate Purpose Agent with Insight Analyst

**Title:** Phase 6: Integrate Purpose Agent with Insight Analyst  

**Description:**  
Use Insight Analyst to support Purpose Agent’s ikigai/purpose computations.

**Tasks:**
- Define question sets and inputs
- Map responses into an ikigai-style model
- Generate a purpose statement and supporting bullet points

**Acceptance Criteria:**
- Purpose Agent outputs a coherent purpose statement
- Supporting insights align with user inputs
- Outputs can be exported (e.g., PDF/HTML) if needed

**Labels:** `Phase6`, `Agent: Purpose`, `Analysis`  

---

### Issue 19 – Add Notification Layer for Growth Agents

**Title:** Phase 6: Add Email/Slack Notifications for Growth Agents  

**Description:**  
Growth Agent actions should be able to notify users via email and/or Slack.

**Tasks:**
- Define which agents trigger notifications and when
- Integrate with existing email/Slack helpers
- Add toggles in config/flags for each notification type

**Acceptance Criteria:**
- Each Growth Agent can optionally send notifications
- Notifications reuse existing templates or simple text
- No duplicate or spammy notifications

**Labels:** `Phase6`, `Email`, `Slack`  
**Depends on:** Issues 5, 7, 8  

---

### Issue 20 – Add DB Logging for All Growth Agents

**Title:** Phase 6: Add DB Logging for Growth Agents  

**Description:**  
Persist all key outputs from the 5 Growth Agents to the database.

**Tasks:**
- Define DB schema mapping for Growth outputs
- Implement writes for Journal, Niche, Mindset, Rhythm, Purpose
- Add queries to verify data integrity

**Acceptance Criteria:**
- All Growth outputs are stored and queryable
- No missing or malformed records
- Logs clearly identify agent and user/session

**Labels:** `Phase6`, `Database`, `Agent`  

---

### Issue 21 – Implement Phase 6 Dashboard (Staging)

**Title:** Phase 6: Implement Growth Dashboard (Staging)  

**Description:**  
Add a dashboard page to visualize Growth Agent usage and outputs.

**Tasks:**
- Build a simple UI to list recent Growth sessions
- Filter by agent and date range
- Show basic stats (counts, trends)

**Acceptance Criteria:**
- Dashboard loads in staging
- Data shown matches DB records
- Basic filters work as expected

**Labels:** `Phase6`, `Dashboard`, `Frontend`  

---

### Issue 22 – Run 48-Hour Staging Stability Test

**Title:** Phase 6: 48-Hour Staging Stability Test  

**Description:**  
Run all 5 Growth Agents under light but continuous use and monitor system health.

**Tasks:**
- Set up scripted or manual runs of Growth flows
- Monitor BullMQ, Redis, API errors, DB performance
- Document any crashes or anomalies and create follow-up issues

**Acceptance Criteria:**
- 48 hours of staging with no critical failures
- Queue and DB stay within healthy limits
- Identified issues are ticketed

**Labels:** `Phase6`, `Staging`, `Validation`, `Priority: High`  
**Depends on:** Issues 13–21  

---

### Issue 23 – Dark Launch Phase 6 for Internal Users

**Title:** Phase 6: Dark Launch for Internal Users  

**Description:**  
Enable Phase 6 for you and Shria, without exposing to all users.

**Tasks:**
- Restrict access by user ID or role
- Monitor logs and UX feedback
- Note any UX friction or bugs

**Acceptance Criteria:**
- Both internal users can access all 5 Growth Agents
- No security/permission leaks
- A list of improvements/bugs is generated

**Labels:** `Phase6`, `Release: Internal`  

---

### Issue 24 – Fix Bugs from Dark Launch

**Title:** Phase 6: Fix Dark Launch Bugs  

**Description:**  
Resolve issues discovered during dark launch.

**Tasks:**
- Prioritize bugs by severity
- Fix critical and high priority issues
- Validate fixes in staging

**Acceptance Criteria:**
- All critical/high bugs from dark launch are resolved
- No regressions appear in staging tests

**Labels:** `Phase6`, `Bug`, `Priority: High`  

---

### Issue 25 – External Beta Release of Phase 6

**Title:** Phase 6: External Beta Release  

**Description:**  
Release Phase 6 to a limited set of external clients.

**Tasks:**
- Identify beta cohort
- Provide guidance and expectations
- Monitor feedback and usage closely

**Acceptance Criteria:**
- Beta users can access Growth Agents successfully
- Feedback is collected and summarized
- No major system instability

**Labels:** `Phase6`, `Release: Beta`  

---

### Issue 26 – Full Phase 6 Production Rollout

**Title:** Phase 6: Full Production Rollout  

**Description:**  
Launch all 5 Growth Agents to full production.

**Tasks:**
- Flip feature flags on for all production users
- Monitor for 72 hours
- Update docs to reflect GA status

**Acceptance Criteria:**
- All production users can access Growth Agents
- No major incidents in 72-hour window
- Docs and status pages updated

**Labels:** `Phase6`, `Release: Production`, `Priority: Critical`  

---

## Cleanup & Documentation (4 Issues)

---

### Issue 27 – Consolidate Phase Documentation

**Title:** Docs: Consolidate Phase Documentation  

**Description:**  
Merge outdated phase docs into a single “current view” and archive legacy files.

**Acceptance Criteria:**
- One authoritative “Current Phase Overview” doc exists
- Old/duplicate phase docs moved to `/docs/archive/`

**Labels:** `Docs`, `Cleanup`  

---

### Issue 28 – Decide Fate of Ideation Coach Agent

**Title:** Agent: Decide Fate of Ideation Coach  

**Description:**  
Decide whether to integrate Ideation Coach into core flows or archive it.

**Acceptance Criteria:**
- Clear decision documented
- If archived: code moved/flagged
- If kept: follow-up issues created for integration

**Labels:** `Agent`, `Decision`, `Cleanup`  

---

### Issue 29 – Archive Legacy Phase 1/2 Docs

**Title:** Docs: Archive Legacy Phase 1/2 Docs  

**Description:**  
Move no-longer-accurate early phase docs to an archive location.

**Acceptance Criteria:**
- Outdated docs not referenced as “current”
- Archive folder is clearly labeled

**Labels:** `Docs`, `Cleanup`  

---

### Issue 30 – Create Current System Architecture Document

**Title:** Docs: Create Current System Architecture Overview  

**Description:**  
Document the current EM-AI system architecture (services, agents, queues, DB, external integrations, infra).

**Acceptance Criteria:**
- One architecture overview doc exists
- Includes agents, services, data flow, infra, and key dependencies
- Matches reality of the deployed system

**Labels:** `Docs`, `Architecture`, `Cleanup`  

---
