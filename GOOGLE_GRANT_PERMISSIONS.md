# Grant Google Service Account Permissions - Detailed Guide

## The Problem We're Solving

Your service account (the bot) needs permission to read emails and calendars from:
- Darnell's account: darnell@elevatedmovements.com
- Shria's account: shria@elevatedmovements.com

Without this step, the service account can't access their emails.

---

## Prerequisites

Before starting, you need:
1. ✅ Your service account email (from the JSON file you downloaded)
   - Looks like: `elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com`
2. ✅ Access to both founder's Google accounts
3. ✅ Either:
   - Google Workspace Admin access (if using business accounts), OR
   - Ability to log into each founder's Gmail directly

---

## Option A: Using Google Workspace Admin (RECOMMENDED)

If both founders have Google Workspace accounts (not personal Gmail):

### Step 1: Go to Google Workspace Admin
1. Visit: https://admin.google.com
2. Sign in with your admin account

### Step 2: Set Up API Delegation
1. Click **Security** in the left sidebar
2. Click **API Controls**
3. Click **Manage Delegation**

### Step 3: Add Service Account
1. Click **Add new** or **+ Add**
2. In **Client ID**, enter your service account's **client_id** from the JSON file
   - Found in: `google-credentials.json` → look for `"client_id": "123456789"`
3. In **OAuth Scopes**, enter these exact scopes (comma-separated):
   ```
   https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/contacts.readonly
   ```
4. Click **Authorize**

### Step 4: Verify It Works
1. After authorizing, the service account now has permission to:
   - Read Gmail for all users
   - Read Calendar for all users
   - Read Contacts for all users

**This option is complete!** Your service account can now access emails from any Workspace account.

---

## Option B: Manual Grant via Gmail Settings

If using personal Gmail accounts (not Google Workspace):

### For Darnell's Account (darnell@elevatedmovements.com)

#### Step 1: Log into Darnell's Gmail
1. Go to: https://mail.google.com
2. Sign in as: darnell@elevatedmovements.com
3. Enter password

#### Step 2: Go to Account Settings
1. Click your profile picture (top right)
2. Click **Manage your Google Account**
3. Click **Security** tab (top)

#### Step 3: Find "Apps with account access"
1. Scroll down to **How you sign in to Google**
2. Look for **Third-party apps with account access** or **Connected apps**
3. Click **Manage all third-party apps**

#### Step 4: Add the Service Account
1. Click **+ Add an app** or **Add app**
2. Search for your service account email:
   ```
   elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com
   ```
3. Click it
4. Click **Allow** or **Grant Access**
5. Select these permissions:
   - ✅ Read Gmail messages
   - ✅ Access Calendar
   - ✅ Access Contacts
6. Click **Grant** or **Allow**

#### Step 5: Verify Permissions
You should see the service account listed under connected apps.

---

### For Shria's Account (shria@elevatedmovements.com)

**Repeat the exact same steps as above for Shria's account:**

1. Log in as: shria@elevatedmovements.com
2. Go to account security settings
3. Add the same service account email
4. Grant read permissions for Gmail, Calendar, Contacts

---

## Option C: Using Google Cloud Console (Advanced)

If Options A & B don't work, try this:

### Step 1: Create OAuth Consent Screen
1. Go to: https://console.cloud.google.com
2. Go to **APIs & Services** → **OAuth Consent Screen**
3. Select **External**
4. Fill in:
   - App name: `Elevated Movements AI`
   - User support email: darnell@elevatedmovements.com
   - Developer contact: your email
5. Click **Save and Continue**

### Step 2: Add Scopes
1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/contacts.readonly`
3. Click **Update**
4. Click **Save and Continue**

### Step 3: Add Test Users
1. Click **Add Users** under **Test Users**
2. Add both:
   - darnell@elevatedmovements.com
   - shria@elevatedmovements.com
3. Click **Save and Continue**

### Step 4: Create OAuth Client
1. Go back to **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Select: **Desktop application**
4. Name it: `Elevated Movements Desktop App`
5. Click **Create**
6. Download the JSON file
7. Replace your `google-credentials.json` with this new one

---

## Testing If Permissions Work

### Test 1: Check Service Account Email in JSON
```bash
cat config/google-credentials.json | grep "client_email"
```

You should see something like:
```
"client_email": "elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com"
```

### Test 2: Restart Docker and Check Logs
```bash
cd em-ai-ecosystem
docker-compose restart api
sleep 5
docker-compose logs api | grep -i "google\|gmail\|credential"
```

Look for messages like:
```
✅ Google credentials loaded successfully
✅ Gmail API initialized
✅ Calendar API initialized
```

### Test 3: Check if Endpoints Work
```bash
curl http://localhost:80/api/config | grep -i "google\|gmail\|credential"
```

Should show all Google services as configured.

---

## Troubleshooting Permissions Issues

### Problem: "Permission denied" error
**Solution:**
- [ ] Did you add the service account to BOTH Darnell's AND Shria's accounts?
- [ ] Did you grant "Read" permissions (not just "View")?
- [ ] Did you click "Grant" or "Allow" to confirm?
- [ ] Wait 5-10 minutes for permissions to propagate
- [ ] Try logging out of Gmail and back in

### Problem: "Service account not found"
**Solution:**
- [ ] Copy the EXACT email from the JSON file
- [ ] Don't modify or shorten it
- [ ] Verify you're using: `elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com`

### Problem: "Insufficient permissions" for Gmail
**Solution:**
- [ ] Make sure you selected "Read Gmail messages" specifically
- [ ] Don't just select generic "Google Account access"
- [ ] Need: `https://www.googleapis.com/auth/gmail.readonly` scope

### Problem: "Can't find third-party apps section"
**Solution:**
- [ ] Try: https://myaccount.google.com/permissions
- [ ] Or: https://myaccount.google.com/security
- [ ] Or scroll down in account security settings
- Different Gmail UI versions show this in different places

---

## What You Should See After Granting Permissions

In each founder's Gmail settings, you should see:

```
Connected apps and sites:

✅ Elevated Movements AI
   Client: elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com
   Permissions:
   - Access your Gmail messages (read-only)
   - Access your Google Calendar (read-only)
   - Access your Contacts (read-only)
```

---

## Step-by-Step Checklist

### Account 1 - Darnell's Business Account:
- [ ] Logged in as darnell@elevatedmovements.com
- [ ] Found Security/Connected Apps section
- [ ] Added service account email
- [ ] Granted Gmail read permission
- [ ] Granted Calendar read permission
- [ ] Granted Contacts read permission
- [ ] Saw confirmation that app is connected

### Account 2 - Shria's Business Account:
- [ ] Logged in as shria@elevatedmovements.com
- [ ] Found Security/Connected Apps section
- [ ] Added service account email
- [ ] Granted Gmail read permission
- [ ] Granted Calendar read permission
- [ ] Granted Contacts read permission
- [ ] Saw confirmation that app is connected

### Account 3 - Darnell's Personal Account:
- [ ] Logged in as darnell.tomlinson@gmail.com
- [ ] Found Security/Connected Apps section
- [ ] Added service account email
- [ ] Granted Gmail read permission
- [ ] Granted Calendar read permission
- [ ] Granted Contacts read permission
- [ ] Saw confirmation that app is connected

### Account 4 - Shria's Personal Account:
- [ ] Logged in as shria.tomlinson@gmail.com
- [ ] Found Security/Connected Apps section
- [ ] Added service account email
- [ ] Granted Gmail read permission
- [ ] Granted Calendar read permission
- [ ] Granted Contacts read permission
- [ ] Saw confirmation that app is connected

### Docker Configuration:
- [ ] Placed `google-credentials.json` in `em-ai-ecosystem/config/`
- [ ] Restarted API container: `docker-compose restart api`
- [ ] Checked logs for success messages
- [ ] Tested API endpoint: `curl http://localhost:80/api/config`

---

## Expected Result

Once everything is set up:

1. Your service account can read Darnell's emails
2. Your service account can read Shria's emails
3. Your service account can read both calendars
4. The Inbox Assistant agent can monitor both email accounts
5. The system can generate AI responses in each founder's voice

---

## Security Notes

✅ **DO:**
- Grant READ-ONLY permissions only
- Never grant admin or write access
- Keep the JSON file secure
- Regularly audit connected apps
- Remove app if no longer needed

❌ **DON'T:**
- Grant more permissions than needed
- Share the service account with others
- Use this for personal projects
- Forget to remove access when done

---

## Still Stuck?

If permissions aren't working after following all steps:

1. **Try Option A** if you have Google Workspace
2. **Try Option B** if using personal Gmail
3. **Try Option C** as a fallback using OAuth flow
4. **Check logs**: `docker-compose logs api`
5. **Restart everything**: `docker-compose restart`

The most common issue is forgetting to grant permissions to BOTH accounts. Make sure you've logged in as both Darnell AND Shria and added the service account to each one!

---

## Next Steps After Permissions Are Granted

1. Restart your Docker containers
2. Check that API loads the credentials successfully
3. The Inbox Assistant will start monitoring both email accounts
4. Both founders' emails will be processed and AI responses generated
5. Calendar data will be accessible for optimization

You're almost there! Once permissions are granted, your AI Ecosystem will have full access to the founders' Gmail and Calendar data!
