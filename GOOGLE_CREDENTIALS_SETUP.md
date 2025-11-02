# Google Application Credentials Setup Guide

## Overview

The Elevated Movements AI Ecosystem needs Google credentials to:
- Access both founder's Gmail inboxes (read emails)
- Access both founder's Google Calendars
- Authenticate with Google services

This guide walks you through creating the credentials file.

---

## Step 1: Create a Google Cloud Project

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com

### 1.2 Create a New Project
1. Click **Select a Project** dropdown at the top
2. Click **NEW PROJECT**
3. Enter project name: `Elevated Movements AI Ecosystem`
4. Click **CREATE**
5. Wait for the project to be created (may take a minute)
6. Select the new project

---

## Step 2: Enable Required APIs

Your project needs these APIs enabled:

### 2.1 Enable Gmail API
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for: `Gmail API`
3. Click on it
4. Click **ENABLE**

### 2.2 Enable Google Calendar API
1. Go back to **APIs & Services** → **Library**
2. Search for: `Google Calendar API`
3. Click on it
4. Click **ENABLE**

### 2.3 Enable Google Drive API (Optional, but recommended)
1. Go back to **APIs & Services** → **Library**
2. Search for: `Google Drive API`
3. Click on it
4. Click **ENABLE**

---

## Step 3: Create a Service Account

Service accounts are special accounts that applications use to access Google services.

### 3.1 Go to Service Accounts
1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **Service Account**

### 3.2 Fill in Service Account Details
1. **Service account name**: `elevated-movements-ai`
2. **Service account ID**: Auto-populated (or customize)
3. **Description**: `AI Ecosystem for managing founder emails and calendars`
4. Click **CREATE AND CONTINUE**

### 3.3 Grant Permissions (Optional for now)
- You can skip this step for now
- Click **CONTINUE**

### 3.4 Create Key
1. Click **+ CREATE KEY**
2. Select **JSON** as the key type
3. Click **CREATE**

**IMPORTANT**: A JSON file will download automatically. This is your credentials file.

---

## Step 4: Save the Credentials File

### 4.1 Where to Save It
Save the downloaded JSON file to:
```
em-ai-ecosystem/config/google-credentials.json
```

### 4.2 Create the config Directory
If the directory doesn't exist:
```bash
cd em-ai-ecosystem
mkdir -p config
# Then paste the downloaded JSON file into this directory
```

### 4.3 Verify the File
The file should contain something like:
```json
{
  "type": "service_account",
  "project_id": "elevated-movements-ai-xxxxx",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

---

## Step 5: Grant the Service Account Access to Gmail & Calendar

Now you need to give the service account permission to access the founder's Gmail and Calendar accounts.

### Option A: Share via Google Workspace Admin (Recommended for Organizations)

If you use Google Workspace:

1. Go to **Google Workspace Admin Console**: https://admin.google.com
2. Go to **Security** → **API Controls** → **Manage Delegation**
3. Add your service account's client email
4. Grant these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/contacts.readonly
   ```

### Option B: Manual Grant (For Personal Gmail Accounts)

If using personal Gmail accounts:

1. Get your service account's email from the JSON file:
   ```
   elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com
   ```

2. **For Darnell's Gmail (darnell@elevatedmovements.com)**:
   - Add the service account as a user with access to the account
   - Or delegate Gmail access via account sharing settings

3. **For Shria's Gmail (shria@elevatedmovements.com)**:
   - Same process

### Option C: Use OAuth 2.0 (Simpler for Personal Use)

Instead of a service account, you can use OAuth 2.0:

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. Select **Desktop application**
4. Name it: `Elevated Movements Desktop`
5. Click **CREATE**
6. Download the JSON file
7. Use this for OAuth flow instead

---

## Step 6: Update Your .env File

In your `.env` file, the path is already set to:
```
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json
```

This is the Docker container path. The file will be at:
```
em-ai-ecosystem/config/google-credentials.json
```

---

## Step 7: Test the Connection

### 7.1 Verify the File is in Place
```bash
cd em-ai-ecosystem
ls -la config/google-credentials.json
```

Should show the file exists.

### 7.2 Test with the API
```bash
# Restart the API container to load the credentials
docker-compose restart api

# Check the logs
docker-compose logs api | grep -i "google\|credential"
```

---

## Troubleshooting

### Error: "Credentials not found"
- Verify file is at: `em-ai-ecosystem/config/google-credentials.json`
- Check file permissions: `chmod 600 config/google-credentials.json`

### Error: "Permission denied"
- Service account doesn't have access to the Gmail/Calendar accounts
- Need to complete Step 5 above

### Error: "Invalid client_id"
- JSON file might be corrupted
- Download a fresh copy from Google Cloud Console

### Gmail API showing "unauthorized"
- Ensure you completed Step 5 (granting permissions)
- May need to wait a few minutes for permissions to propagate

---

## Security Best Practices

### DO:
✅ Keep the JSON file secure
✅ Don't commit to Git (add to `.gitignore`)
✅ Use environment variables to reference it
✅ Rotate the key regularly
✅ Use the smallest scope needed (read-only, not admin)

### DON'T:
❌ Share the JSON file publicly
❌ Commit to GitHub
❌ Post it in Slack/email
❌ Use overly broad permissions
❌ Keep old keys around

---

## File Location Summary

```
em-ai-ecosystem/
├── config/
│   └── google-credentials.json  ← Your credentials file goes here
├── .env
└── docker-compose.yml
```

---

## What the Credentials Enable

Once set up, your system can:

✅ Read emails from both founder inboxes
✅ Classify and analyze incoming emails
✅ Generate AI responses in each founder's voice
✅ Access calendar data for scheduling optimization
✅ Track meeting information
✅ Access contact information

---

## Next Steps

1. **Create the Google Cloud Project** (Steps 1-2)
2. **Create the Service Account** (Step 3)
3. **Download and Save the JSON file** (Step 4)
4. **Grant Permissions** (Step 5)
5. **Update .env and Test** (Steps 6-7)

Once complete, your AI Ecosystem will have full access to the founders' Gmail and Calendar data!

---

## Additional Resources

- Google Cloud Console: https://console.cloud.google.com
- Gmail API Docs: https://developers.google.com/gmail/api
- Google Calendar API Docs: https://developers.google.com/calendar/api
- Service Account Docs: https://cloud.google.com/iam/docs/service-accounts

---

## Questions?

The main things to remember:
1. Service accounts are like bot accounts that applications use
2. You create them in Google Cloud Console
3. You download a JSON key file
4. You give that file to your application (Docker container)
5. The application uses it to authenticate with Gmail/Calendar

It's like giving your app a username and password to access Google services!
