# Finding "Third-Party Apps" - Troubleshooting Guide

If you don't see "Add an app" or "Third-party apps with account access", try these alternative methods:

---

## Method 1: Direct URL (Most Reliable)

Go directly to the permissions page:

### For Google Accounts:
**https://myaccount.google.com/permissions**

This page shows all third-party apps that have access to your Google account. You should see a button like:
- **+ Add an app** or
- **+ Grant access** or
- **Connect app**

Just paste your service account email there.

---

## Method 2: Alternative Security Settings Page

1. Go to: https://myaccount.google.com/security
2. Scroll down to find:
   - "Your connections"
   - "Connected apps and sites"
   - "Apps with account access"
3. Click on it
4. Look for "+ Add" or "+ Allow"

---

## Method 3: Using Google Account Settings

1. Go to: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", scroll down
4. Look for:
   - "Third-party apps with account access" or
   - "Connected apps and sites" or
   - "Your connections"
5. Click **Manage all third-party apps** or **Manage connected apps**

---

## Method 4: Gmail Settings (Sometimes shows there)

1. Open: https://mail.google.com
2. Click the **gear icon** (top right) → **See all settings**
3. Click **Forwarding and POP/IMAP** tab
4. Look for sections about connected apps or OAuth access
5. Sometimes there's an "Edit" or "Manage" button

---

## Method 5: Using OAuth Consent Screen

If the above methods don't work, use this approach:

1. Go to your **Google Cloud Console**: https://console.cloud.google.com
2. Go to **APIs & Services** → **OAuth Consent Screen**
3. Click on your app (should be there from setup)
4. Look for "Test the app" or "+ Test app"
5. This will open a dialog where you can grant access to your test account

---

## If STILL Not Seeing Options

Sometimes Google Workspace or organization accounts have different settings. Try:

### Option A: Contact Google Support
- Go to: https://support.google.com
- Search: "How to grant third-party app access"
- Choose your account type (Workspace, Personal, etc.)

### Option B: Use Google Cloud Console OAuth Flow

This is more technical but always works:

1. In Google Cloud Console: https://console.cloud.google.com
2. Go to **APIs & Services** → **OAuth Consent Screen**
3. Make sure your app is listed
4. Click on your app name
5. Look for "Test users" or "+ Add users"
6. Add the email addresses you want to grant access:
   - darnell@elevatedmovements.com
   - shria@elevatedmovements.com
   - darnell.tomlinson@gmail.com
   - shria.tomlinson@gmail.com
7. Click "Save"
8. Click "+ Create Credentials" → "OAuth 2.0 Client ID" → "Desktop"
9. Download the new JSON file
10. Use this new JSON file instead of your service account JSON

---

## What You Should See (Different Variations)

### Variation 1: "Manage all third-party apps" button
```
Connected apps and sites
├── Google Play Games
├── Slack
└── + Manage all third-party apps ← Click here
    └── + Add an app ← Then click here
```

### Variation 2: Direct "+ Grant access" button
```
Third-party apps with account access
├── Spotify
├── Slack
└── + Grant access to more apps ← Click here
```

### Variation 3: "Edit" under a category
```
Your connections
├── Applications
│   └── Manage applications
│       └── + Add application ← Click here
```

### Variation 4: Under "Security" in left menu
```
Security
├── Your devices
├── Your activity
├── Your notifications
└── App & website access ← Click here
    └── + Add app ← Click here
```

---

## Screenshots Location

The exact location varies by:
- 🌍 Region (US vs EU vs Asia)
- 📱 Account type (Personal vs Workspace vs Education)
- 🔄 Gmail version (new vs classic)
- 🌐 Browser used

This is why the interface might look different!

---

## Quickest Solution

**Just use this direct URL:**
```
https://myaccount.google.com/permissions
```

This always works because it's the canonical URL for managing app permissions. You should see an option to add your service account there.

---

## What to Do If You Still Can't Find It

1. **Screenshot it** - Take a screenshot of what you see
2. **Tell me** - Describe what options you DO see
3. **I'll help** - I can give you exact instructions for your specific account type

Just let me know what the Security/Connections page actually shows, and I'll guide you step-by-step!

---

## Example: What You're Looking For

You need to find a place where you can:
- See a list of connected apps
- Add a new app by email
- Grant permissions to that app

It might say:
- "Manage apps"
- "Connected apps"
- "Third-party access"
- "App permissions"
- "OAuth access"

Any of these pages should have a way to add your service account!
