# Email Automation System

Canonical n8n workflows for Gmail triage, classification, and automated response generation.

## Overview

This email automation system consists of:
- **1 Router Workflow**: Classifies incoming emails and routes them to specialized agents
- **5 Category Agent Workflows**: Process emails based on category (Internal, Support, Promotions, Finance, Sales)
- **1 Helper Workflow**: Sends email notifications when important emails arrive

All workflows use a unified output schema and single LLM provider (OpenAI gpt-4o-mini) for consistency and cost efficiency.

## Architecture

```
Gmail Trigger (unread emails)
    ↓
Normalize Email Object
    ↓
LLM Text Classifier (5 categories)
    ↓
Switch Node (route by category)
    ↓
Add Gmail Label
    ↓
Execute Category Agent Workflow
    ↓
Agent Returns Unified JSON Schema
    ↓
If action="draft" → Create Draft
If action="reply" → Send Reply
If action="none" → Do nothing
    ↓
If notify=true → Execute Email Notify Helper
    ↓
Mark Email as Read
```

## Workflows

### Router Workflow
**File**: `canonical/email/gmail_triage_router.workflow.json`

Main orchestration workflow that:
1. Polls Gmail every minute for unread emails
2. Normalizes email into standard fields (id, threadId, from, to, subject, text, html, receivedAt)
3. Classifies email into one of 5 categories using LLM
4. Adds appropriate Gmail label
5. Executes the matching category agent workflow
6. Creates draft or sends reply based on agent output
7. Sends notification email if agent requests it
8. Marks email as read only after successful processing

### Category Agent Workflows

All agents accept a normalized email object and return the unified JSON schema.

#### 1. Internal Agent
**File**: `canonical/email/agent_internal.workflow.json`

Handles internal team emails. Defaults to `action=draft` and `notify=true`.

#### 2. Customer Support Agent
**File**: `canonical/email/agent_support.workflow.json`

Handles customer support inquiries. Defaults to `action=draft` and `notify=true`.

#### 3. Promotions Agent
**File**: `canonical/email/agent_promotions.workflow.json`

Analyzes promotional emails and provides summary + recommendation.
- Defaults to `action=none` and `notify=false`
- If `recommendation=yes`, sets `notify=true`

#### 4. Finance Agent
**File**: `canonical/email/agent_finance.workflow.json`

Processes finance and billing emails. Extracts invoice details.
Defaults to `action=draft` and `notify=true`.

#### 5. Sales Agent
**File**: `canonical/email/agent_sales.workflow.json`

Handles sales inquiries. Extracts lead information (name, email, company, phone).
Defaults to `action=draft` and `notify=true`.

### Helper Workflow

#### Email Notify
**File**: `helpers/email_notify.workflow.json`

Sends email notifications via Gmail. Triggered by router when agent sets `notify=true`.

## Unified Output Schema

All category agents MUST return this exact JSON structure:

```json
{
  "category": "internal|support|promotions|finance|sales",
  "action": "draft|reply|none",
  "notify": true,
  "label": "Internal|Customer Support|Promotions|Admin/Finance|Sales Opportunity",
  "subject": "string",
  "body": "string",
  "summary": "string|null",
  "recommendation": "yes|no|null",
  "confidence": 0.0,
  "extracted": {
    "name": "string|null",
    "email": "string|null",
    "company": "string|null",
    "phone": "string|null",
    "invoice_number": "string|null",
    "amount": "string|null",
    "due_date": "string|null"
  },
  "meta": {
    "messageId": "string",
    "threadId": "string",
    "from": "string",
    "to": "string",
    "receivedAt": "string",
    "rawSubject": "string"
  }
}
```

## Import Order

Import workflows in this order to avoid dependency issues:

1. `helpers/email_notify.workflow.json`
2. `canonical/email/agent_internal.workflow.json`
3. `canonical/email/agent_support.workflow.json`
4. `canonical/email/agent_promotions.workflow.json`
5. `canonical/email/agent_finance.workflow.json`
6. `canonical/email/agent_sales.workflow.json`
7. `canonical/email/gmail_triage_router.workflow.json` (import last)

## Required Credentials

You must configure these n8n credentials before importing:

### 1. Gmail OAuth2
- **Credential Name**: `Gmail OAuth2`
- **Type**: Gmail OAuth2 API
- **Scopes**: `gmail.readonly`, `gmail.modify`, `gmail.compose`, `gmail.send`
- **Used by**: Router workflow (trigger + label + draft/reply + mark read), Email Notify helper

### 2. OpenAI API
- **Credential Name**: `OpenAi account`
- **Type**: OpenAI API
- **Used by**: Router (classifier), all 5 category agents

### 3. Google Sheets (Optional)
If you want to log email interactions to a sheet (not included in canonical workflows, but mentioned in original):
- **Credential Name**: `Google Sheets account`
- **Type**: Google Sheets OAuth2 API

## Required Environment Variables

Set these in your n8n environment:

```bash
# Email address to send notifications to
NOTIFY_TO=your-email@example.com

# Optional: Email address to send notifications from (defaults to Gmail OAuth2 account)
# NOTIFY_FROM=notifications@example.com
```

## Gmail Label Setup

Before running the router workflow, create these labels in Gmail:

1. **Internal** (or use existing label and update `labelIds` in router)
2. **Customer Support**
3. **Promotions**
4. **Admin/Finance**
5. **Sales Opportunity**

### How to Find Label IDs

If you need to map labelIds (they're currently set as placeholders like `Label_Internal`):

1. In n8n, create a simple workflow with Gmail "Get Labels" operation
2. Execute it to see all your label IDs
3. Update the router workflow `labelIds` arrays with the correct IDs

**Note**: Some versions of the Gmail node support label names directly. If yours does, you can use label names instead of IDs.

## Testing Steps

### 1. Send Test Emails

Send yourself emails for each category:

- **Internal**: Email from your domain with internal keywords
- **Support**: Customer support inquiry
- **Promotions**: Newsletter or promotional offer
- **Finance**: Invoice or billing statement
- **Sales**: Sales inquiry or pricing request

### 2. Verify Each Step

For each test email, check:

1. ✅ Email is classified correctly
2. ✅ Correct Gmail label is applied
3. ✅ Appropriate agent workflow is executed
4. ✅ Draft is created (or reply sent, if configured)
5. ✅ Notification email is sent (if notify=true)
6. ✅ Email is marked as read

### 3. Check Drafts

Go to Gmail → Drafts and verify:
- Draft subject matches agent output
- Draft body is well-formatted
- Draft recipient is the original sender

### 4. Check Notifications

Check your `NOTIFY_TO` inbox for notification emails with:
- Correct subject line
- Summary of the email
- Category and action information

## Safety Defaults

This system is designed with safety in mind:

- ✅ **Draft-only by default**: All agents except Promotions default to `action=draft`
- ✅ **No auto-send**: Drafts are created, not sent automatically
- ✅ **Human review**: You review and send drafts manually
- ✅ **No secrets in workflows**: All credentials use n8n's credential system
- ✅ **Notifications via email only**: No Slack or Telegram dependencies
- ✅ **Mark as read only after success**: Email stays unread if processing fails

## How to Enable Auto-Reply

⚠️ **WARNING**: Auto-reply will send emails automatically without human review.

To enable auto-reply for a specific category:

1. Open the category agent workflow (e.g., `agent_support.workflow.json`)
2. In the LLM system prompt, change the default action:
   - Find: `"action": "draft"`
   - Change to: `"action": "reply"`
3. Save and re-import the workflow

**Recommended**: Only enable auto-reply for low-risk categories like Promotions (already set to `action=none`).

## Removed from Original Workflow

This refactor removed/replaced the following from the original workflow:

### Removed
- ❌ **Telegram notifications** → Replaced with Email notifications
- ❌ **Slack nodes** → Removed entirely
- ❌ **Hard-coded API keys** → Replaced with n8n credentials
- ❌ **Pinecone integration** → Omitted (marked as Phase 2: add RAG)
- ❌ **Disabled testing nodes** → Removed from canonical versions
- ❌ **Google Drive trigger for RAG** → Omitted (Phase 2)
- ❌ **Multiple LLM providers** → Standardized to OpenAI gpt-4o-mini only
- ❌ **Direct Google Sheets logging** → Omitted (optional add-back via helper)

### Changed
- ✔️ **Multiple system prompts** → Standardized with unified schema requirement
- ✔️ **Inconsistent action handling** → Unified draft/reply/none logic
- ✔️ **Notification chaos** → Single email notification helper
- ✔️ **Label IDs hard-coded** → Placeholders with setup instructions

## Phase 2 Enhancements (Not Included)

Future enhancements you can add:

1. **RAG with Pinecone**: Add vector store retrieval to agents for knowledge base queries
2. **Google Sheets logging**: Create `helpers/log_to_sheet.workflow.json` to log all email interactions
3. **Slack notifications**: Add Slack webhook helper if needed
4. **Auto-reply toggle**: Add workflow variables to toggle draft vs reply per category
5. **Confidence thresholds**: Only auto-draft if confidence > 0.8
6. **Sentiment analysis**: Add sentiment scoring to prioritize urgent/negative emails

## Troubleshooting

### Workflow doesn't trigger
- Check Gmail OAuth2 credentials are valid
- Verify poll interval is set to "every minute"
- Ensure there are unread emails in the inbox

### Labels not applied
- Verify label IDs are correct for your Gmail account
- Check Gmail OAuth2 has `gmail.modify` scope

### Drafts not created
- Check Gmail OAuth2 has `gmail.compose` scope
- Verify agent output includes valid `subject` and `body` fields
- Check that `action` field is set to `draft`

### Notifications not sent
- Verify `NOTIFY_TO` environment variable is set
- Check Email Notify helper workflow is imported and active
- Verify agent output has `notify=true`

### Agent returns invalid JSON
- Check LLM system prompt includes schema requirement
- Verify `jsonOutput: true` is set on OpenAI node
- Review agent execution logs for parsing errors

## File Inventory

```
packages/ops/n8n/
├── canonical/
│   └── email/
│       ├── gmail_triage_router.workflow.json (ROUTER)
│       ├── agent_internal.workflow.json
│       ├── agent_support.workflow.json
│       ├── agent_promotions.workflow.json
│       ├── agent_finance.workflow.json
│       └── agent_sales.workflow.json
├── helpers/
│   └── email_notify.workflow.json
└── EMAIL_AUTOMATION_README.md (this file)
```

## Support

For issues or questions:
1. Check n8n execution logs for error messages
2. Verify all credentials are configured correctly
3. Test each workflow individually before running the full router
4. Review agent LLM outputs to ensure schema compliance

## Changelog

### 2025-12-21: Initial Canonical Refactor
- Refactored monolithic workflow into modular router + agents
- Removed Telegram/Slack dependencies → Email-only notifications
- Removed hard-coded secrets → n8n credentials only
- Standardized LLM outputs to unified JSON schema
- Single model provider (OpenAI gpt-4o-mini) across all agents
- Removed Pinecone (marked as Phase 2)
- Removed disabled testing nodes
- Added comprehensive documentation
