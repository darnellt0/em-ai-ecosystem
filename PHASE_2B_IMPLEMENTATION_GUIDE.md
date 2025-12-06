# Phase 2B Implementation Guide - Real API Integration

## Overview

Phase 2B focuses on replacing mock implementations with **real API integrations** for the 5 core agents currently in production. This guide provides step-by-step instructions for implementing each integration.

**Current Status**: Mock implementations fully functional, ready for real API integration
**Timeline**: 2-4 weeks for complete Phase 2B
**Complexity**: Medium (straightforward API integrations)

---

## Priority Order

### Tier 1 (Week 1-2): Critical Path
1. **Google Calendar API** - Blocks all calendar operations
2. **Email Notifications** - Blocks task completion workflows
3. **Slack Notifications** - Blocks notification workflows

### Tier 2 (Week 2-3): Foundation
4. **PostgreSQL Task Queries** - Enables real task management
5. **Activity Database Logging** - Enables analytics

### Tier 3 (Week 3-4): Enhancement
6. **Stub Agent Implementations** - Remaining 7 agents

---

## 1. Google Calendar API Integration

### Current Implementation
**File**: `packages/api/src/agents/agent-factory.ts` Lines 80-170

**Current Code**:
```typescript
async blockFocusTime(
  founderEmail: string,
  durationMinutes: number,
  reason: string,
  bufferMinutes: number = 10,
  startTime?: Date
): Promise<CalendarBlockResult> {
  // TODO: Check for calendar conflicts via Google Calendar API
  // TODO: Create event in Google Calendar
  // Currently returns mock data
}
```

### Implementation Steps

#### Step 1: Setup Google Calendar API Credentials

```bash
# 1. Go to Google Cloud Console
# https://console.cloud.google.com

# 2. Create new project "Elevated Movements"

# 3. Enable Calendar API
# Search for "Google Calendar API" and enable

# 4. Create Service Account
# - Select "Service Account" as account type
# - Name: "elevated-movements-service"
# - Grant roles: "Editor" (or scoped Calendar Admin)

# 5. Create JSON key
# - Go to Keys tab
# - Create new key → JSON
# - Save to: packages/api/config/google-credentials.json

# 6. Share calendar with service account email
# - Your calendar settings
# - Share calendar with service account email
# - Grant "Make changes to events" permission

# 7. Set environment variable for calendar ID
# Add to .env:
#   GOOGLE_CALENDAR_ID=your-email@gmail.com  # or 'primary'
```

#### Step 1b: Verify Calendar Credentials (Issue 1 Completion)

After setting up credentials, verify the integration works by running the test script:

```bash
# Run the calendar test script
npm run test:calendar
```

This script will:
- Check that google-credentials.json exists at `packages/api/config/`
- Validate the credentials file structure
- Initialize the Google Calendar client
- List the next 5-10 upcoming events from your calendar

**Expected output on success:**
```
=======================================================================
GOOGLE CALENDAR INTEGRATION TEST
Phase 2B - Issue 1: Setup Google Calendar Credentials
=======================================================================

1. Checking credentials file...
   OK: Credentials file exists

2. Validating credentials structure...
   OK: Valid service account credentials

3. Initializing Google Calendar client...
   OK: Calendar client initialized

4. Fetching upcoming events...
   OK: Retrieved X events

5. Upcoming Events:
----------------------------------------------------------------------
   1. Meeting Title
      Date: Mon, Dec 9 at 10:00 AM
      ...

=======================================================================
TEST RESULT: SUCCESS
=======================================================================
```

**Troubleshooting:**
- If "Credentials file not found": Place google-credentials.json in packages/api/config/
- If "Access denied": Share the calendar with the service account email
- If "Calendar not found": Check GOOGLE_CALENDAR_ID in your .env file

#### Step 2: Install Google Calendar Package

```bash
cd packages/api
npm install --save google-auth-library @google-cloud/calendar
npm install --save-dev @types/google-auth-library
```

#### Step 3: Create Calendar Service Wrapper

**File to Create**: `packages/api/src/services/calendar.service.ts`

```typescript
import { google } from 'googleapis';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export class CalendarService {
  private calendar;

  constructor() {
    const keyPath = path.join(__dirname, '../../config/google-credentials.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: SCOPES,
    });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createEvent(
    calendarId: string,
    event: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: { email: string }[];
    }
  ) {
    return this.calendar.events.insert({
      calendarId,
      requestBody: event,
    });
  }

  async getEvent(calendarId: string, eventId: string) {
    return this.calendar.events.get({
      calendarId,
      eventId,
    });
  }

  async updateEvent(calendarId: string, eventId: string, event: any) {
    return this.calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });
  }

  async listEvents(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ) {
    return this.calendar.events.list({
      calendarId,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
  }

  async checkConflicts(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<string[]> {
    const events = await this.listEvents(calendarId, startTime, endTime);
    return (events.data.items || []).map(e => e.summary || 'Untitled Event');
  }
}
```

#### Step 4: Update Agent Factory

**File**: `packages/api/src/agents/agent-factory.ts`

Replace the `blockFocusTime` method:

```typescript
import { CalendarService } from '../services/calendar.service';

class AgentFactory {
  private calendarService = new CalendarService();

  async blockFocusTime(
    founderEmail: string,
    durationMinutes: number,
    reason: string,
    bufferMinutes: number = 10,
    startTime?: Date
  ): Promise<CalendarBlockResult> {
    this.logger.info(`[Calendar Optimizer] Blocking ${durationMinutes}min focus time for ${founderEmail}`);

    try {
      const now = startTime || new Date();
      const end = new Date(now.getTime() + durationMinutes * 60000);
      const bufferEnd = new Date(end.getTime() + bufferMinutes * 60000);

      // Check for conflicts
      const conflicts = await this.calendarService.checkConflicts(
        founderEmail,
        now,
        end
      );

      // Create event in Google Calendar
      const event = await this.calendarService.createEvent(founderEmail, {
        summary: `Deep Focus: ${reason}`,
        description: `Focus block created via Voice API`,
        start: { dateTime: now.toISOString(), timeZone: 'America/Los_Angeles' },
        end: { dateTime: end.toISOString(), timeZone: 'America/Los_Angeles' },
      });

      return {
        success: true,
        eventId: event.data.id || `evt_${Date.now()}`,
        startTime: now,
        endTime: end,
        title: `Deep Focus: ${reason}`,
        notifications: [
          'Silenced all notifications',
          'Set status to Do Not Disturb',
          `Blocked ${durationMinutes} minutes on calendar`,
        ],
        conflicts: conflicts,
      };
    } catch (error) {
      this.logger.error('[Calendar Optimizer] Block focus error:', error);
      throw error;
    }
  }
}
```

### Testing

```bash
# Test with real Google Calendar API
curl -X POST http://127.0.0.1:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 60,
    "reason": "Real Google Calendar Test",
    "founder": "darnell"
  }'

# Should return:
# - Real event ID from Google Calendar
# - Any actual conflicts detected
```

---

## 2. Email Notifications Integration

### Current Implementation
**File**: `packages/api/src/agents/agent-factory.ts` Lines 372-377

**Current Code**:
```typescript
private async sendEmailNotification(to: string, subject: string, html: string): Promise<void> {
  // Phase 2: Connect to Gmail/SMTP
  // Using: nodemailer + Gmail OAuth or app-specific password
  this.logger.info(`[Email] Sending to ${to}: ${subject}`);
  // TODO: Implement actual SMTP sending
}
```

### Implementation Steps

#### Step 1: Install Dependencies

```bash
cd packages/api
npm install --save nodemailer
npm install --save-dev @types/nodemailer
```

#### Step 2: Create Email Service

**File to Create**: `packages/api/src/services/email.service.ts`

```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    // Option 1: Gmail with app-specific password
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Option 2: Generic SMTP
    // this.transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
  }

  async sendNotification(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@elevatedmovements.com',
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html,
      });

      return {
        messageId: info.messageId || '',
        success: true,
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  getTemplate(type: 'task-complete' | 'reminder' | 'meeting', data: any): string {
    const templates: Record<string, string> = {
      'task-complete': `
        <h2>Task Completed</h2>
        <p>Great work! You completed: <strong>${data.taskTitle}</strong></p>
        <p>Next priority: <strong>${data.nextTaskTitle}</strong></p>
      `,
      'reminder': `
        <h2>Reminder</h2>
        <p><strong>${data.subject}</strong></p>
        <p>Due: ${data.dueDate}</p>
      `,
      'meeting': `
        <h2>Meeting Updated</h2>
        <p><strong>${data.meetingTitle}</strong></p>
        <p>New time: ${data.newTime}</p>
      `,
    };

    return templates[type] || '';
  }
}
```

#### Step 3: Update Agent Factory

**File**: `packages/api/src/agents/agent-factory.ts`

```typescript
import { EmailService } from '../services/email.service';

class AgentFactory {
  private emailService = new EmailService();

  private async sendEmailNotification(to: string, subject: string, html: string): Promise<void> {
    this.logger.info(`[Email] Sending to ${to}: ${subject}`);

    try {
      const result = await this.emailService.sendNotification(to, subject, html);
      this.logger.info(`[Email] Sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error('[Email] Send failed:', error);
      throw error;
    }
  }
}
```

#### Step 4: Setup Gmail

```bash
# For Gmail users:
# 1. Go to myaccount.google.com/security
# 2. Enable "Less secure app access" OR use App Passwords
# 3. Create app-specific password (if 2FA enabled)
# 4. Add to .env:
#    GMAIL_USER=your-email@gmail.com
#    GMAIL_APP_PASSWORD=your-16-character-app-password
```

### Testing

```bash
# Test email notification
curl -X POST http://127.0.0.1:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-test",
    "note": "Testing email notifications",
    "founder": "darnell"
  }'

# Check email inbox for notification
```

---

## 3. Slack Notifications Integration

### Current Implementation
**File**: `packages/api/src/agents/agent-factory.ts` Lines 379-384

### Implementation Steps

#### Step 1: Create Slack App

```bash
# 1. Go to https://api.slack.com/apps
# 2. Create New App → From scratch
# 3. Name: "Elevated Movements Voice"
# 4. Workspace: Your workspace
# 5. Go to "OAuth & Permissions"
# 6. Scopes: Add "chat:write", "users:read"
# 7. Install app to workspace
# 8. Copy "Bot User OAuth Token" → SLACK_BOT_TOKEN
```

#### Step 2: Install Slack SDK

```bash
cd packages/api
npm install --save @slack/web-api
npm install --save-dev @types/slack__web-api
```

#### Step 3: Create Slack Service

**File to Create**: `packages/api/src/services/slack.service.ts`

```typescript
import { WebClient } from '@slack/web-api';

export class SlackService {
  private client: WebClient;

  constructor(botToken: string) {
    this.client = new WebClient(botToken);
  }

  async sendMessage(
    userId: string,
    text: string,
    blocks?: any[]
  ): Promise<{ ts: string; success: boolean }> {
    try {
      const result = await this.client.chat.postMessage({
        channel: userId,
        text,
        blocks,
      });

      return {
        ts: result.ts || '',
        success: result.ok || false,
      };
    } catch (error) {
      console.error('Slack send error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<string | null> {
    try {
      const result = await this.client.users.lookupByEmail({
        email,
      });

      return result.user?.id || null;
    } catch (error) {
      console.error('Slack lookup error:', error);
      return null;
    }
  }

  getTemplate(type: 'task-complete' | 'reminder' | 'meeting', data: any): any {
    const templates: Record<string, any> = {
      'task-complete': {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ Task Completed: *${data.taskTitle}*\n\nNext: _${data.nextTaskTitle}_`,
            },
          },
        ],
      },
      'reminder': {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⏰ Reminder: *${data.subject}*\n\nDue: ${data.dueDate}`,
            },
          },
        ],
      },
      'meeting': {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `📅 Meeting Updated: *${data.meetingTitle}*\n\nNew time: ${data.newTime}`,
            },
          },
        ],
      },
    };

    return templates[type] || { text: 'Notification' };
  }
}
```

#### Step 4: Update Agent Factory

**File**: `packages/api/src/agents/agent-factory.ts`

```typescript
import { SlackService } from '../services/slack.service';

class AgentFactory {
  private slackService = new SlackService(process.env.SLACK_BOT_TOKEN || '');

  private async sendSlackNotification(userId: string, title: string, message: string): Promise<void> {
    this.logger.info(`[Slack] Sending to ${userId}: ${title}`);

    try {
      // Convert email to Slack user ID
      const slackUserId = await this.slackService.getUserByEmail(userId);

      if (!slackUserId) {
        this.logger.warn(`[Slack] Could not find user for ${userId}`);
        return;
      }

      const template = this.slackService.getTemplate('task-complete', {
        taskTitle: title,
        nextTaskTitle: message,
      });

      const result = await this.slackService.sendMessage(
        slackUserId,
        message,
        template.blocks
      );

      this.logger.info(`[Slack] Sent successfully: ${result.ts}`);
    } catch (error) {
      this.logger.error('[Slack] Send failed:', error);
      throw error;
    }
  }
}
```

### Testing

```bash
# Test Slack notification
curl -X POST http://127.0.0.1:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Slack notification test",
    "dueISO": "2025-11-08T10:00:00Z",
    "founder": "darnell"
  }'

# Check Slack DM for message
```

---

## 4. PostgreSQL Task Database Integration

### Current Implementation
**File**: `packages/api/src/agents/agent-factory.ts` Lines 176-231

**Current Code**:
```typescript
async logTaskComplete(
  founderEmail: string,
  taskId: string,
  completionNote?: string
): Promise<TaskResult> {
  // Phase 2: Update task in real database
  // - Mark task as complete in em_ecosystem.tasks table
  // - Log completion in execution history
  // Currently returns mock data
}
```

### Implementation Steps

#### Step 1: Create Database Schema

**File**: `db/migrations/001_create_tasks.sql`

```sql
-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(50) PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  completion_note TEXT,
  next_task_id VARCHAR(50),
  FOREIGN KEY (next_task_id) REFERENCES tasks(id)
);

-- Task history/audit log
CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  change_details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Create indexes
CREATE INDEX idx_tasks_founder_email ON tasks(founder_email);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
```

#### Step 2: Install Database Package

```bash
cd packages/api
npm install --save pg
npm install --save-dev @types/pg
```

#### Step 3: Create Database Service

**File to Create**: `packages/api/src/services/database.service.ts`

```typescript
import { Pool, QueryResult } from 'pg';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async logTaskComplete(
    taskId: string,
    completionNote: string
  ): Promise<{ success: boolean; nextTask?: { title: string; dueDate: Date } }> {
    try {
      // Update task as complete
      await this.pool.query(
        `UPDATE tasks SET status = $1, completed_at = $2, completion_note = $3, updated_at = $4 WHERE id = $5`,
        ['completed', new Date(), completionNote, new Date(), taskId]
      );

      // Log to history
      await this.pool.query(
        `INSERT INTO task_history (task_id, action, change_details) VALUES ($1, $2, $3)`,
        [taskId, 'completed', JSON.stringify({ note: completionNote })]
      );

      // Get next task
      const nextTaskResult = await this.pool.query(
        `SELECT id, title, due_date FROM tasks WHERE founder_email = (SELECT founder_email FROM tasks WHERE id = $1) AND status = 'pending' ORDER BY due_date ASC LIMIT 1`,
        [taskId]
      );

      const nextTask = nextTaskResult.rows[0];
      return {
        success: true,
        nextTask: nextTask ? {
          title: nextTask.title,
          dueDate: nextTask.due_date ? new Date(nextTask.due_date) : new Date(),
        } : undefined,
      };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async createFollowUp(
    founderEmail: string,
    subject: string,
    dueDate?: Date,
    context?: string
  ): Promise<{ taskId: string; success: boolean }> {
    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.pool.query(
        `INSERT INTO tasks (id, founder_email, title, description, status, due_date) VALUES ($1, $2, $3, $4, $5, $6)`,
        [taskId, founderEmail, subject, context, 'pending', dueDate]
      );

      // Log to history
      await this.pool.query(
        `INSERT INTO task_history (task_id, action, change_details) VALUES ($1, $2, $3)`,
        [taskId, 'created', JSON.stringify({ context })]
      );

      return { taskId, success: true };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }

  async closePool(): Promise<void> {
    await this.pool.end();
  }
}
```

#### Step 4: Update Agent Factory

```typescript
import { DatabaseService } from '../services/database.service';

class AgentFactory {
  private dbService = new DatabaseService();

  async logTaskComplete(
    founderEmail: string,
    taskId: string,
    completionNote?: string
  ): Promise<TaskResult> {
    this.logger.info(`[Inbox Assistant] Completing task ${taskId}`);

    try {
      const result = await this.dbService.logTaskComplete(taskId, completionNote || '');

      return {
        success: result.success,
        taskId: taskId,
        title: 'Task Completed',
        status: 'completed',
        completedAt: new Date(),
        nextTask: result.nextTask,
      };
    } catch (error) {
      this.logger.error('[Inbox Assistant] Error:', error);
      throw error;
    }
  }

  async createFollowUp(
    founderEmail: string,
    subject: string,
    dueDate?: Date,
    context?: string
  ): Promise<TaskResult> {
    this.logger.info(`[Task Orchestrator] Creating follow-up: ${subject}`);

    try {
      const result = await this.dbService.createFollowUp(
        founderEmail,
        subject,
        dueDate,
        context
      );

      return {
        success: result.success,
        taskId: result.taskId,
        title: subject,
        status: 'pending',
      };
    } catch (error) {
      this.logger.error('[Task Orchestrator] Error:', error);
      throw error;
    }
  }
}
```

### Testing

```bash
# Create a task
curl -X POST http://127.0.0.1:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Database Task",
    "dueISO": "2025-11-08T10:00:00Z",
    "founder": "darnell"
  }'

# Log task completion
curl -X POST http://127.0.0.1:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task_from_previous_response",
    "note": "Completed from database",
    "founder": "darnell"
  }'

# Verify in database
psql postgresql://elevated_movements:T0ml!ns0n@localhost:5433/em_ecosystem
# SELECT * FROM tasks WHERE founder_email = 'darnell@elevatedmovements.com';
```

---

## 5. Activity Tracking Database Integration

### Implementation Steps

#### Step 1: Create Activity Schema

**File**: `db/migrations/002_create_activities.sql`

```sql
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  founder_email VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  duration_minutes INT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (founder_email) REFERENCES founders(email)
);

CREATE INDEX idx_activities_founder ON activities(founder_email);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_timestamp ON activities(timestamp);
```

#### Step 2: Update DatabaseService

```typescript
async recordActivity(
  founderEmail: string,
  activity: string,
  durationMinutes: number,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; activityId: number }> {
  try {
    const result = await this.pool.query(
      `INSERT INTO activities (founder_email, activity_type, duration_minutes, metadata) VALUES ($1, $2, $3, $4) RETURNING id`,
      [founderEmail, activity, durationMinutes, JSON.stringify(metadata)]
    );

    return {
      success: true,
      activityId: result.rows[0].id,
    };
  } catch (error) {
    console.error('Activity logging error:', error);
    throw error;
  }
}
```

#### Step 3: Update Agent Factory

```typescript
async recordActivity(
  founderEmail: string,
  activity: string,
  durationMinutes: number,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; activityId: string }> {
  this.logger.info(`[Deep Work Defender] Recording ${activity} activity`);

  try {
    const result = await this.dbService.recordActivity(
      founderEmail,
      activity,
      durationMinutes,
      metadata
    );

    return {
      success: result.success,
      activityId: `act_${result.activityId}`,
    };
  } catch (error) {
    this.logger.error('[Deep Work Defender] Error:', error);
    throw error;
  }
}
```

---

## Implementation Checklist

### Week 1: Google Calendar + Emails
- [ ] Google Calendar API setup and credentials
- [ ] Install google-auth-library package
- [ ] Create calendar.service.ts
- [ ] Update agent factory blockFocusTime method
- [ ] Test block focus with real calendar
- [ ] Update confirmMeeting method
- [ ] Update rescheduleMeeting method
- [ ] Test calendar endpoints
- [ ] Setup Gmail or SMTP
- [ ] Install nodemailer package
- [ ] Create email.service.ts
- [ ] Update sendEmailNotification method
- [ ] Test email notifications
- [ ] Update task complete flow
- [ ] Test end-to-end task completion with email

### Week 2: Slack + Database
- [ ] Create Slack app and get bot token
- [ ] Install @slack/web-api package
- [ ] Create slack.service.ts
- [ ] Update sendSlackNotification method
- [ ] Test Slack notifications
- [ ] Create database migration files
- [ ] Run migrations against PostgreSQL
- [ ] Install pg package
- [ ] Create database.service.ts
- [ ] Implement logTaskComplete in database
- [ ] Implement createFollowUp in database
- [ ] Test task operations with real database
- [ ] Create activity tracking schema
- [ ] Implement recordActivity in database
- [ ] Test activity logging

### Week 2-3: Testing & Validation
- [ ] Run full integration tests
- [ ] Test all 6 voice endpoints
- [ ] Test error handling for each API
- [ ] Test with multiple founders
- [ ] Load testing: verify rate limiting works
- [ ] Security testing: verify token validation
- [ ] Test idempotency key handling
- [ ] Documentation review and updates

### Week 3-4: Stub Agents Implementation
- [ ] Daily Brief agent
- [ ] Grant Researcher agent
- [ ] Relationship Tracker agent
- [ ] Financial Allocator agent
- [ ] Insight Analyst agent
- [ ] Content Synthesizer agent
- [ ] Brand Storyteller agent

---

## Environment Variables Needed

```bash
# Google Calendar
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json

# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM=noreply@elevatedmovements.com

# Slack
SLACK_BOT_TOKEN=xoxb-your-token-here

# Database
DATABASE_URL=postgresql://elevated_movements:T0ml!ns0n@database:5432/em_ecosystem

# SMTP (alternative to Gmail)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-email@provider.com
SMTP_PASS=your-password
SMTP_SECURE=false
```

---

## Testing Individual Integrations

### Google Calendar Test
```bash
# Block focus time and check Google Calendar directly
curl -X POST http://127.0.0.1:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "minutes": 30,
    "reason": "Testing Google Calendar API",
    "founder": "darnell"
  }'

# Response should include real event ID from Google Calendar
```

### Email Test
```bash
# Trigger email notification
curl -X POST http://127.0.0.1:3000/api/voice/support/log-complete \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-123",
    "note": "Testing email delivery",
    "founder": "darnell"
  }'

# Check email inbox for notification
```

### Database Test
```bash
# Create task via API
curl -X POST http://127.0.0.1:3000/api/voice/support/follow-up \
  -H "Authorization: Bearer elevenlabs-voice-secure-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Database test task",
    "dueISO": "2025-11-10T14:00:00Z",
    "founder": "darnell"
  }'

# Verify in PostgreSQL
docker-compose exec database psql -U elevated_movements -d em_ecosystem -c "SELECT * FROM tasks LIMIT 5;"
```

---

## Troubleshooting

### Google Calendar Issues
- **"Credentials not found"**: Verify JSON file path and contents
- **"Permission denied"**: Calendar not shared with service account email
- **"Quota exceeded"**: Check API usage limits in Google Cloud Console

### Email Issues
- **"Authentication failed"**: Check Gmail app password (not regular password)
- **"Connection timeout"**: Verify SMTP settings for provider
- **"Email not received"**: Check spam folder, verify recipient email

### Slack Issues
- **"User not found"**: Email domain in Slack doesn't match email parameter
- **"Token expired"**: Regenerate bot token if workspace permissions changed
- **"Channel not found"**: Verify Slack user ID is correct

### Database Issues
- **"Connection refused"**: Verify PostgreSQL container is running
- **"Table does not exist"**: Run migrations before testing
- **"Foreign key violation"**: Ensure referenced records exist

---

## Phase 2B Success Criteria

All items complete when:
- ✅ Google Calendar creates/reads real events
- ✅ Emails sent via Gmail or SMTP successfully
- ✅ Slack messages appear in user DMs
- ✅ Tasks stored and retrieved from PostgreSQL
- ✅ Activity logs recorded to database
- ✅ All 6 voice endpoints working with real APIs
- ✅ Zero mock responses returned
- ✅ All error cases handled gracefully
- ✅ Performance metrics maintained (< 500ms end-to-end)
- ✅ Full test coverage of integrations
- ✅ Documentation updated with real API details

---

## Next: Phase 3 Preparation

Once Phase 2B is complete:
- [ ] Stub agent implementations (Daily Brief, Grant Researcher, etc.)
- [ ] Mobile app integration planning
- [ ] Native voice input research
- [ ] Advanced scheduling algorithms
- [ ] Analytics dashboard prototype
- [ ] Multi-user support architecture

---

**Document Version**: 1.0
**Created**: November 2, 2025
**Last Updated**: November 2, 2025
**Phase Status**: Phase 2B - Ready to Begin
