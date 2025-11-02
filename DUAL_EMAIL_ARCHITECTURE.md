# How the System Handles Both Founder Emails

## The Key Insight

**The system uses TWO different email protocols for a reason:**

- **Gmail API** - Reads from BOTH founder inboxes (GMAIL_SERVICE_ACCOUNT credentials)
- **SMTP** - Sends from ONE relay account (SMTP_USER)

This is intentional and works perfectly for dual-founder scenarios.

---

## Configuration Breakdown

### Email Configuration in .env

```
# Email Sending (SMTP Relay)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=darnell.tomlinson@gmail.com        ← ONE account
SMTP_PASS=bvro rurx zcrq ykra

# Founder Email Reading (Gmail API)
FOUNDER_DARNELL_EMAIL=darnell@elevatedmovements.com    ← TWO accounts
FOUNDER_SHRIA_EMAIL=shria@elevatedmovements.com

# Google Integration (Authentication)
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json
```

---

## How It Works

### 1. Reading Emails (Incoming) - BOTH Founders

The **Gmail API** reads from both founder accounts:

```
Inbox Assistant Agent
    ↓
    ├─→ Gmail API query for FOUNDER_DARNELL_EMAIL
    │   └─ Fetches all unread emails from Darnell's inbox
    │   └ Uses OAuth credentials from GOOGLE_APPLICATION_CREDENTIALS
    │
    └─→ Gmail API query for FOUNDER_SHRIA_EMAIL
        └─ Fetches all unread emails from Shria's inbox
        └─ Uses OAuth credentials from GOOGLE_APPLICATION_CREDENTIALS
```

**Example Code:**
```typescript
// Inbox Assistant polls both mailboxes
const darnellEmails = await gmailService.listEmails(
  process.env.FOUNDER_DARNELL_EMAIL
);
const shriaEmails = await gmailService.listEmails(
  process.env.FOUNDER_SHRIA_EMAIL
);

// Process emails from both founders
for (const email of [...darnellEmails, ...shriaEmails]) {
  const founder = identifyFounder(email);  // "darnell" or "shria"
  const voiceDNA = getVoiceDNA(founder);   // Get their voice pattern
  const draft = await generateResponse(email, voiceDNA);
  await queueForApproval(draft, founder);
}
```

### 2. Sending Emails (Outgoing) - Via Relay Account

The **SMTP Service** sends from ONE relay account but with founder-specific From headers:

```
Email Sender Service
    ↓
Authenticates with: SMTP_USER = darnell.tomlinson@gmail.com
    ↓
    ├─ For Darnell's emails:
    │  ├─ Sets From: darnell@elevatedmovements.com
    │  ├─ Sets Reply-To: darnell@elevatedmovements.com
    │  └─ Sends via relay (darnell.tomlinson@gmail.com)
    │
    └─ For Shria's emails:
       ├─ Sets From: shria@elevatedmovements.com
       ├─ Sets Reply-To: shria@elevatedmovements.com
       └─ Sends via relay (darnell.tomlinson@gmail.com)
```

**Why this works:**
- Gmail allows sending "on behalf of" addresses
- The authenticated account is just the relay
- Email headers show the correct founder address
- Recipients reply to the founder's correct email
- Replies automatically go back to their inbox

---

## Complete Email Flow Example

### Scenario: Email arrives for Darnell

```
1. Email sent to: darnell@elevatedmovements.com
   From: client@example.com
   Subject: Project Update

2. Inbox Assistant polls Gmail API
   └─ Queries: FOUNDER_DARNELL_EMAIL inbox
   └─ Retrieves: New email from client@example.com

3. Agent processes email:
   ├─ Identifies: "This is for Darnell"
   ├─ Classifies: "CLIENT" category
   ├─ Extracts: Darnell's voice DNA
   └─ Generates: AI response in Darnell's voice

4. Draft queued for approval
   └─ Status: "Pending Darnell approval"
   └─ Founder reviews and clicks "Approve"

5. Email Sender sends response:
   ├─ From: darnell@elevatedmovements.com
   ├─ Reply-To: darnell@elevatedmovements.com
   ├─ Via: SMTP_USER (darnell.tomlinson@gmail.com relay)
   └─ To: client@example.com

6. Client receives email:
   ├─ Appears from: darnell@elevatedmovements.com
   ├─ Looks like: Personal email from Darnell
   └─ Reply goes to: darnell@elevatedmovements.com (correct inbox)
```

### Scenario: Same time, email arrives for Shria

```
1. Email sent to: shria@elevatedmovements.com
   From: partner@company.com
   Subject: Partnership Inquiry

2. Inbox Assistant polls Gmail API (simultaneously)
   └─ Queries: FOUNDER_SHRIA_EMAIL inbox
   └─ Retrieves: New email from partner@company.com

3. Agent processes email:
   ├─ Identifies: "This is for Shria"
   ├─ Classifies: "PARTNERSHIP" category
   ├─ Extracts: Shria's voice DNA (different from Darnell's)
   └─ Generates: AI response in Shria's voice

4. Draft queued for approval
   └─ Status: "Pending Shria approval"
   └─ Founder reviews and clicks "Approve"

5. Email Sender sends response:
   ├─ From: shria@elevatedmovements.com
   ├─ Reply-To: shria@elevatedmovements.com
   ├─ Via: SMTP_USER (same relay: darnell.tomlinson@gmail.com)
   └─ To: partner@company.com

6. Partner receives email:
   ├─ Appears from: shria@elevatedmovements.com
   ├─ Looks like: Personal email from Shria
   └─ Reply goes to: shria@elevatedmovements.com (correct inbox)
```

---

## Voice DNA Separation

Each founder's responses are personalized:

### Darnell's Voice DNA
```
Greetings: ["Hey", "Hi there", "What's up"]
Signoffs: ["Cheers", "Talk soon", "All the best"]
Tone: Casual, energetic
Sentence Length: Medium, varied
Vocabulary: Direct, action-oriented
```

### Shria's Voice DNA
```
Greetings: ["Hello", "Hi", "Good to hear from you"]
Signoffs: ["Best regards", "Warmly", "Looking forward"]
Tone: Professional, thoughtful
Sentence Length: Slightly longer, structured
Vocabulary: Polished, strategic
```

When drafting responses:
1. System identifies which founder received the email
2. Loads that founder's voice DNA profile
3. AI uses voice DNA to shape the response
4. Response sounds authentically like that founder

---

## Why This Architecture?

### Problem
- Two founders with separate email addresses
- Each needs personalized responses in their own voice
- But sending from two different accounts complicates things

### Solution
- **Read**: Use Gmail API to monitor BOTH accounts (unlimited OAuth clients)
- **Send**: Use ONE relay account (SMTP is simpler than OAuth for sending)
- **Personalize**: Track founder identity and apply voice DNA

### Benefits
1. **Scalability**: Can add more founders without changing SMTP
2. **Simplicity**: Only one SMTP credential to manage
3. **Personalization**: Each founder's responses sound like them
4. **Reliability**: SMTP relay is more stable than multiple OAuth flows
5. **Security**: Easier to rotate SMTP credentials
6. **Cost**: Only one Gmail account needs "Send As" permissions

---

## Current Configuration Status

Your .env already has:

✅ **SMTP Relay** (for sending):
- `SMTP_USER=darnell.tomlinson@gmail.com` (configured)
- `SMTP_PASS=bvro rurx zcrq ykra` (configured)

❌ **Founder Emails** (for reading):
- `FOUNDER_DARNELL_EMAIL=your-calendar-id@gmail.com` (needs update)
- `FOUNDER_SHRIA_EMAIL=your-calendar-id@gmail.com` (needs update)

✅ **Google Auth** (for accessing both accounts):
- `GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json` (configured)

---

## What You Need to Update

Edit your .env file:

```bash
# Change these lines:
FOUNDER_DARNELL_EMAIL=darnell@elevatedmovements.com
FOUNDER_SHRIA_EMAIL=shria@elevatedmovements.com

# These should match:
# - Your actual founder email addresses
# - Accounts configured in your Google OAuth credentials
# - Accounts with SMTP_USER having "Send As" permission
```

---

## Summary

**The system handles both founder emails by:**

1. **Reading** with Gmail API from BOTH accounts
   - Monitors Darnell's and Shria's inboxes separately
   - Tracks which founder each email is for

2. **Processing** with personalized voice DNA
   - Applies Darnell's voice to his emails
   - Applies Shria's voice to her emails

3. **Sending** via ONE relay account
   - Uses SMTP_USER for authentication
   - But sets From/Reply-To to correct founder
   - Recipients see the right founder's email address

This gives you the best of both worlds:
- **Unified system** (one relay account)
- **Personalized responses** (different voice for each founder)
- **Separate inboxes** (maintains email separation)

---

## Technical Files

If you want to understand the implementation deeper:

- `packages/agents/inbox-assistant/src/classifier.ts` - Identifies which founder
- `packages/agents/inbox-assistant/src/voice-dna.ts` - Extracts voice patterns
- `packages/core/src/services/gmail.service.ts` - Reads from both accounts
- `packages/core/src/services/email-sender.service.ts` - Sends with correct From header

All use the dual-account architecture described here.
