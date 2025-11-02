# Add Service Account to Gmail - This Interface

You're on the right page! Here's how to add your service account from this screen.

---

## The Page You're On

You're viewing: **"Third-party apps & services"**
URL: `myaccount.google.com/connections`

This is correct! But to add your service account, you need to use a different method because personal Gmail accounts don't have an "Add App" button on this page.

---

## Solution: Use Google Cloud OAuth Flow

Since you have the service account JSON file, the easiest way is to:

### Step 1: Use the Google Cloud Console

Go to: https://console.cloud.google.com

### Step 2: Set Up OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth Consent Screen**
2. Make sure it's set to **External** (already selected)
3. Your app should be listed

### Step 3: Add Test Users

1. In the OAuth Consent Screen, look for **"Add users"** button
2. Click it
3. Add the email address you're currently logged into:
   - `darnell.tomlinson@gmail.com` (if that's who you're logged in as)
4. Click **Save**

### Step 4: Create an OAuth Client

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. Choose: **Desktop application**
4. Name: `Elevated Movements`
5. Click **CREATE**
6. **Download JSON** - Click the download icon

### Step 5: Use the OAuth JSON File

1. The JSON you just downloaded is an **OAuth client**, not a service account
2. Replace your `google-credentials.json` with this new OAuth JSON file
3. Place it in: `em-ai-ecosystem/config/google-credentials.json`

### Step 6: Restart Docker

```bash
cd em-ai-ecosystem
docker-compose restart api
sleep 5
docker-compose logs api | grep -i "google\|credential"
```

---

## Why This Works Better

- ✅ Service accounts don't show up on the "Third-party apps" page for personal Gmail
- ✅ OAuth clients can be tested with personal Gmail accounts
- ✅ Both methods give the same access to Gmail and Calendar

---

## Alternative Method (If You Want to Use Service Account)

If you prefer using the service account, you need to do this:

### For Personal Gmail Accounts (like yours):

Since you can't add it through the GUI, use the **Google Cloud console approach**:

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Go to **APIs & Services** → **OAuth Consent Screen**
3. Under **Test users**, add:
   - darnell.tomlinson@gmail.com
   - shria.tomlinson@gmail.com
   - darnell@elevatedmovements.com
   - shria@elevatedmovements.com
4. Click **Save**

This grants the service account permission to access those accounts in test mode.

---

## Quick Decision: Which Path?

### Path A: OAuth Client (Recommended for personal Gmail)
- ✅ Simpler setup
- ✅ Works on this page
- ✅ Created in Google Cloud Console
- ⏱️ Takes 5 minutes
- 📝 Download new JSON file

### Path B: Service Account + Test Users
- ✅ Works fine
- ✅ Already have the JSON
- ⚠️ Requires Google Cloud Console
- ⏱️ Takes 5 minutes
- 📝 Use existing JSON file

**I recommend: Path A (OAuth Client)** - it's simpler and this page makes more sense for it.

---

## Step-by-Step for Path A (OAuth Client)

### 1. Go to Google Cloud Console
```
https://console.cloud.google.com
```

### 2. Create OAuth Client
- Left sidebar → **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS**
- Choose: **OAuth 2.0 Client ID**
- Select: **Desktop application**
- Name it: `Elevated Movements Desktop`
- Click **CREATE**

### 3. Download the JSON
- Click the **download icon** next to your new credential
- Save as: `google-credentials.json`

### 4. Copy to Your Project
```bash
# Move the file to your project
cp ~/Downloads/client_secret_*.json ~/em-ai-ecosystem/config/google-credentials.json
```

### 5. Restart Docker
```bash
cd em-ai-ecosystem
docker-compose restart api
docker-compose logs api | grep -i "google"
```

---

## The Difference

**Service Account JSON:**
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "client_email": "elevated-movements-ai@..."
}
```

**OAuth Client JSON:**
```json
{
  "installed": {
    "client_id": "...",
    "project_id": "...",
    "client_secret": "..."
  }
}
```

Both work! But OAuth is simpler for personal Gmail accounts.

---

## Do You Want to...?

**Option 1**: Use OAuth Client (recommended)
→ Go to Google Cloud Console and create an OAuth 2.0 Desktop client

**Option 2**: Use Service Account with Test Users
→ Go to Google Cloud Console and add test users to OAuth Consent Screen

Let me know which you prefer and I'll give you exact steps!

---

## TL;DR

The page you're on doesn't have an "Add App" button for personal Gmail accounts. Instead:

1. Go to **Google Cloud Console**
2. Create an **OAuth 2.0 Client ID** (Desktop)
3. Download the JSON
4. Use that JSON in your `em-ai-ecosystem/config/google-credentials.json`
5. Restart Docker

That's it! Ready?
