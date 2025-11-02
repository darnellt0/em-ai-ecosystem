# Grant Permissions to All 4 Email Accounts - Checklist

Your system needs to monitor and manage emails from 4 different Gmail accounts:

## 📋 Accounts That Need Permission

| Account | Type | Email |
|---------|------|-------|
| 1 | Business | darnell@elevatedmovements.com |
| 2 | Business | shria@elevatedmovements.com |
| 3 | Personal | darnell.tomlinson@gmail.com |
| 4 | Personal | shria.tomlinson@gmail.com |

---

## 🔑 Your Service Account Email

You'll need this for all 4 accounts (find it in your `google-credentials.json` file):

```
elevated-movements-ai@elevated-movements-ai-xxxxx.iam.gserviceaccount.com
```

**Get it with:**
```bash
cat config/google-credentials.json | grep "client_email"
```

---

## ✅ Step-by-Step: Grant Permissions to All 4 Accounts

### Account 1️⃣ : Darnell's Business Email

1. **Open Gmail**: https://mail.google.com
2. **Sign in**: darnell@elevatedmovements.com
3. **Go to Security**:
   - Click profile picture (top right)
   - Click "Manage your Google Account"
   - Click "Security" tab
4. **Add Service Account**:
   - Scroll to "Third-party apps with account access"
   - Click "Manage all third-party apps"
   - Click "+ Add an app"
   - Paste your service account email
   - Click it in the dropdown
   - Click "Allow"
5. **Grant Permissions**:
   - ✅ Read Gmail messages
   - ✅ Access Calendar
   - ✅ Access Contacts
   - Click "Grant"
6. **Verify**: You should see the app listed as connected

---

### Account 2️⃣ : Shria's Business Email

1. **Open Gmail**: https://mail.google.com
2. **Sign in**: shria@elevatedmovements.com (log out of Darnell's account first)
3. **Go to Security**:
   - Click profile picture (top right)
   - Click "Manage your Google Account"
   - Click "Security" tab
4. **Add Service Account**:
   - Scroll to "Third-party apps with account access"
   - Click "Manage all third-party apps"
   - Click "+ Add an app"
   - Paste your service account email
   - Click it in the dropdown
   - Click "Allow"
5. **Grant Permissions**:
   - ✅ Read Gmail messages
   - ✅ Access Calendar
   - ✅ Access Contacts
   - Click "Grant"
6. **Verify**: You should see the app listed as connected

---

### Account 3️⃣ : Darnell's Personal Email

1. **Open Gmail**: https://mail.google.com
2. **Sign in**: darnell.tomlinson@gmail.com (log out of Shria's account first)
3. **Go to Security**:
   - Click profile picture (top right)
   - Click "Manage your Google Account"
   - Click "Security" tab
4. **Add Service Account**:
   - Scroll to "Third-party apps with account access"
   - Click "Manage all third-party apps"
   - Click "+ Add an app"
   - Paste your service account email
   - Click it in the dropdown
   - Click "Allow"
5. **Grant Permissions**:
   - ✅ Read Gmail messages
   - ✅ Access Calendar
   - ✅ Access Contacts
   - Click "Grant"
6. **Verify**: You should see the app listed as connected

---

### Account 4️⃣ : Shria's Personal Email

1. **Open Gmail**: https://mail.google.com
2. **Sign in**: shria.tomlinson@gmail.com (log out of Darnell's account first)
3. **Go to Security**:
   - Click profile picture (top right)
   - Click "Manage your Google Account"
   - Click "Security" tab
4. **Add Service Account**:
   - Scroll to "Third-party apps with account access"
   - Click "Manage all third-party apps"
   - Click "+ Add an app"
   - Paste your service account email
   - Click it in the dropdown
   - Click "Allow"
5. **Grant Permissions**:
   - ✅ Read Gmail messages
   - ✅ Access Calendar
   - ✅ Access Contacts
   - Click "Grant"
6. **Verify**: You should see the app listed as connected

---

## ✔️ Completion Checklist

- [ ] **Account 1** (darnell@elevatedmovements.com) - Service account added with read permissions
- [ ] **Account 2** (shria@elevatedmovements.com) - Service account added with read permissions
- [ ] **Account 3** (darnell.tomlinson@gmail.com) - Service account added with read permissions
- [ ] **Account 4** (shria.tomlinson@gmail.com) - Service account added with read permissions
- [ ] `google-credentials.json` file is in `em-ai-ecosystem/config/`
- [ ] `.env` file has all email addresses configured
- [ ] Docker containers restarted: `docker-compose restart api`

---

## 🧪 Test After Granting Permissions

```bash
# 1. Restart the API
cd em-ai-ecosystem
docker-compose restart api

# 2. Check for successful connection
sleep 5
docker-compose logs api | grep -i "google\|gmail\|credential"

# 3. Verify all emails are configured
curl http://localhost:80/api/config | grep -i "email"
```

You should see in the output:
```json
"founders": [
  {"name": "Darnell", "email": "darnell@elevatedmovements.com"},
  {"name": "Shria", "email": "shria@elevatedmovements.com"}
],
"personal_emails": [
  "darnell.tomlinson@gmail.com",
  "shria.tomlinson@gmail.com"
]
```

---

## 📊 What This Enables

Once all 4 accounts have permissions:

✅ Monitor Darnell's business emails (darnell@elevatedmovements.com)
✅ Monitor Shria's business emails (shria@elevatedmovements.com)
✅ Monitor Darnell's personal emails (darnell.tomlinson@gmail.com)
✅ Monitor Shria's personal emails (shria.tomlinson@gmail.com)
✅ Access both business calendars
✅ Access both personal calendars
✅ Generate AI responses in their voice
✅ Optimize schedules across all accounts
✅ Track costs and productivity

---

## ⏱️ Time Estimate

- ~5-10 minutes per account to add service account and grant permissions
- 40-50 minutes total for all 4 accounts
- 5 minutes to test and verify

**Total time: ~1 hour**

---

## 🆘 If You Get Stuck

**Problem**: "Can't find third-party apps section"
- Try: https://myaccount.google.com/permissions
- Or: https://myaccount.google.com/security

**Problem**: "Service account not found"
- Copy the EXACT email from your JSON file
- Don't modify or shorten it

**Problem**: Can't add service account to a specific account
- Make sure you're logged into the correct email
- Try logging out completely and back in
- Try in an incognito/private window

**Problem**: "Insufficient permissions" after granting
- Wait 5-10 minutes for permissions to propagate
- Log out of Gmail completely and back in
- Restart Docker: `docker-compose restart api`

---

## ✨ You're Done When...

After completing all 4 accounts and restarting Docker, your system will:
1. Automatically monitor all 4 email accounts
2. Generate AI responses in each founder's voice
3. Optimize schedules across all accounts
4. Track productivity and costs
5. Manage approvals for all founders

That's it! Your AI Ecosystem is now fully operational with complete access to all founder emails and calendars!
