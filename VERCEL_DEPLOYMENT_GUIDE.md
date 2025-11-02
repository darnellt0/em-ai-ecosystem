# Vercel Deployment Guide - Mobile App

**Status**: Ready to Deploy
**Date**: November 2, 2025
**ngrok URL**: https://nonlevel-promilitarism-lorita.ngrok-free.dev/api
**Local API**: Running on http://localhost:3000

---

## Overview

Your mobile app is configured to deploy on Vercel with the ngrok tunnel pointing to your local API server. This means:

- **Frontend**: Hosted on Vercel (globally distributed, always available)
- **Backend**: Running locally on your machine via ngrok tunnel (free access)
- **Cost**: $0/month (both Vercel free tier and ngrok free tier)

---

## Prerequisites

Before deploying to Vercel, ensure:

1. ✅ ngrok is running: `ngrok http 3000` (you already have this running)
2. ✅ Local API is running on `http://localhost:3000` (verify with: `npm run dev`)
3. ✅ GitHub repository is up to date with latest commits
4. ✅ Vercel account created (or create one at https://vercel.com)

---

## Step-by-Step Deployment

### Step 1: Push Latest Code to GitHub

Your code is already committed. Push it to GitHub:

```bash
git push origin main
```

**Expected**: Code pushed successfully

---

### Step 2: Create Vercel Project

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select your GitHub repository `em-ai-ecosystem`
4. Framework preset: Select "Expo"
5. Root directory: `packages/mobile`
6. Click "Deploy"

**Option B: Via Vercel CLI**

```bash
npm install -g vercel
cd packages/mobile
vercel
# Follow the interactive prompts
```

---

### Step 3: Configure Environment Variables

After creating the project on Vercel:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add these variables:

```
API_URL = https://nonlevel-promilitarism-lorita.ngrok-free.dev/api
NODE_ENV = production
```

4. Click "Save"

**Important**: Make sure these variables are set for:
- ✅ Production
- ✅ Preview
- ✅ Development

---

### Step 4: Deploy

Once environment variables are set, Vercel will automatically:

1. Pull your code from GitHub
2. Install dependencies
3. Build the web version: `npm run build:web`
4. Deploy to Vercel's CDN
5. Provide you with a live URL

**Deployment URL Format**:
```
https://[project-name].vercel.app
```

---

## Verify Deployment

Once deployed, test your mobile app:

### Test 1: Check Health
```bash
curl -X GET https://nonlevel-promilitarism-lorita.ngrok-free.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T..."
}
```

### Test 2: Visit Your App

1. Open your Vercel URL in a browser
2. You should see the login screen
3. Try signing up with test credentials
4. Verify the voice commands work
5. Check the analytics and profile screens

### Test 3: Verify API Connection

Once logged in:

1. Go to Settings/Profile
2. Try fetching user data (should hit ngrok → localhost:3000)
3. Check browser console for any CORS or connection errors
4. Verify voice command features work

---

## Important Notes

### About ngrok

- **Tunnel URL Changes**: Each time you restart ngrok, you get a new URL
- **Solution**: Use ngrok's custom domain feature (paid) OR update environment variables when URL changes
- **Free Alternative**: Keep ngrok running continuously (restart your PC less often)

If your ngrok URL changes:
1. Get new ngrok URL: Look at ngrok terminal output
2. Update Vercel environment variable `API_URL`
3. Redeploy on Vercel (automatic if using git)

### About Authentication

Your API requires Bearer token authentication:

1. When user signs up: Backend returns auth token
2. Mobile app stores token in `AsyncStorage`
3. All API requests include: `Authorization: Bearer [token]`
4. Token expires after configured time (usually 24 hours)

---

## Troubleshooting

### Issue 1: "Cannot connect to API"

**Symptom**: Login fails with "Network error"

**Check**:
1. Is ngrok running? Check terminal window
2. Is local API running? Check `http://localhost:3000/health`
3. Is ngrok URL correct in Vercel env vars?

**Fix**:
```bash
# Restart ngrok if needed
ngrok http 3000

# Restart local API
cd packages/api
npm start
```

---

### Issue 2: "CORS Error"

**Symptom**: "Access to XMLHttpRequest blocked by CORS policy"

**Check**: API CORS configuration at `packages/api/src/index.ts`

**Fix**: Vercel app should be in whitelist:
```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://*.vercel.app'  // This allows your Vercel domain
  ]
}
```

---

### Issue 3: "Build Failed on Vercel"

**Symptom**: Vercel deployment shows red X with build error

**Common Causes**:
- Missing dependencies
- TypeScript errors
- Babel configuration issues

**Fix**:
1. Check Vercel build logs (shown in dashboard)
2. Run build locally first: `npm run build:web`
3. Fix any errors locally
4. Push to GitHub
5. Vercel will auto-redeploy

---

### Issue 4: "White/Blank Screen on Load"

**Symptom**: App URL loads but shows nothing

**Check**:
1. Browser console for JavaScript errors
2. Network tab for failed API requests
3. API_URL environment variable is correct

**Debug**:
```javascript
// In browser console:
console.log('API URL:', process.env.API_URL)
```

---

## Performance Tips

### Optimize Bundle Size

The mobile web app is React Native with Web support. To optimize:

1. **Use Dynamic Imports**: Load screens only when needed
2. **Remove Unused Dependencies**: Keep package.json clean
3. **Enable Gzip Compression**: Vercel does this automatically

### Cache API Responses

The app already implements:
- AsyncStorage for offline data
- Offline sync queue
- Automatic retry on connection loss

This means users have a responsive experience even during network issues.

---

## Next Steps After Deployment

### Day 1: Verification
- [ ] Test all screens (Home, Analytics, Profile, Settings)
- [ ] Try voice commands
- [ ] Check authentication flow
- [ ] Verify data persists across refreshes

### Week 1: Monitoring
- [ ] Check Vercel analytics
- [ ] Monitor API performance
- [ ] Test from different devices
- [ ] Share with Shria for testing

### Week 2+: Improvements
- [ ] Gather user feedback
- [ ] Monitor error logs
- [ ] Plan Phase 5 features
- [ ] Optimize performance based on usage

---

## Quick Reference

```bash
# Check ngrok status
# (Look at your ngrok terminal window)

# Get current ngrok URL
# Shown in ngrok output: "Forwarding https://xxx.ngrok-free.dev"

# Restart local API if needed
cd packages/api
npm start

# Rebuild web version locally
cd packages/mobile
npm run build:web

# View Vercel dashboard
# https://vercel.com/dashboard

# View API logs
# Check Terminal/PowerShell where you ran: npm run dev
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Expo Web**: https://docs.expo.dev/clients/expo-web/
- **ngrok Docs**: https://ngrok.com/docs

---

## Important: Keep ngrok Running

⚠️ **CRITICAL**: Your deployed app will only work while ngrok is running!

The architecture is:
```
Browser (Vercel)
    ↓ (HTTPS)
ngrok Tunnel
    ↓ (HTTP)
Local API (localhost:3000)
```

If ngrok stops:
- Frontend stays live on Vercel
- API calls will fail
- Users will see "Network Error"

**Solution**: Keep ngrok running continuously, or set up a persistent tunnel with ngrok's paid plan.

---

**Created**: November 2, 2025
**Status**: Ready to Deploy
**Time to Deploy**: 10-15 minutes
**Cost**: $0/month

Good luck! 🚀
