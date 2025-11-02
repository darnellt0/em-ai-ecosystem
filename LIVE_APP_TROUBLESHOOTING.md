# Live App Troubleshooting Guide

**App URL**: https://em-ai-mobile.vercel.app
**API Endpoint**: https://nonlevel-promilitarism-lorita.ngrok-free.dev/api
**Status**: ✅ LIVE AND DEPLOYED

---

## Common Issues & Solutions

### Issue 1: Blank White Screen

**Symptom**: App loads but shows blank white screen

**Possible Causes**:
1. Page is still loading (normal for first load)
2. JavaScript bundle didn't load
3. API connection issue

**Solutions**:
1. **Wait 3-5 seconds** - First load can take time
2. **Refresh the page** (Ctrl+R or Cmd+R)
3. **Clear cache** (Ctrl+Shift+Delete)
4. **Check browser console** (F12 → Console tab)
5. **Check if ngrok is still running** - Look at ngrok terminal

**Debug Steps**:
```javascript
// In browser console (F12), type:
console.log('API URL:', process.env.API_URL)
// Should show: API_URL: https://nonlevel-promilitarism-lorita.ngrok-free.dev/api
```

---

### Issue 2: Login Fails with "Network Error"

**Symptom**: Can't login, see "Network Error" message

**Likely Cause**: ngrok is not running or API isn't responding

**Check**:
```bash
# Terminal 1: Is ngrok running?
# Look at your ngrok window - should show "Forwarding" line

# Terminal 2: Is API running?
curl http://localhost:3000/health
# Should return: {"status":"running",...}

# Terminal 3: Can we reach via ngrok?
curl https://nonlevel-promilitarism-lorita.ngrok-free.dev/health
# Should return: {"status":"running",...}
```

**Fix**:
1. If ngrok isn't running: Open new terminal and run `ngrok http 3000`
2. If API isn't running: Open another terminal and run `npm run dev` in packages/api
3. Refresh the app and try again

---

### Issue 3: "CORS Error" in Console

**Symptom**: Browser console shows "Access to XMLHttpRequest blocked by CORS"

**Cause**: API CORS settings don't allow the Vercel domain

**Fix**: Need to update API CORS configuration at `packages/api/src/index.ts`

Add to CORS whitelist:
```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://*.vercel.app',  // Add this line
    'https://em-ai-mobile.vercel.app'  // Add this line
  ]
}
```

Then restart API:
```bash
cd packages/api
npm start
```

---

### Issue 4: Page Loads But Can't Sign Up

**Symptom**: Can see login screen but signup button doesn't work

**Check**:
1. Open browser console (F12)
2. Look for red error messages
3. Try the login page instead of signup first

**Common Errors**:
- "POST /auth/signup 401" - API requires authentication headers
- "POST /auth/signup 400" - Invalid email/password format
- "TypeError: Cannot read property 'x'" - JavaScript error in app

---

### Issue 5: Voice Commands Not Working

**Symptom**: Microphone button present but no audio recording

**Possible Causes**:
1. Browser microphone permission not granted
2. ngrok tunnel disconnected
3. WebRTC not supported in browser

**Solutions**:
1. **Allow microphone**: When browser asks "Allow microphone access?" → Click "Allow"
2. **Check microphone permissions**:
   - Chrome: Click lock icon → Site settings → Microphone → Allow
3. **Try different browser**: Chrome, Edge, Firefox all support Web Audio API
4. **Check ngrok status**: Make sure tunnel is still active

**Test microphone**:
```javascript
// In browser console:
navigator.mediaDevices.enumerateDevices().then(devices => {
  devices.forEach(d => console.log(d.kind, d.label));
});
```

---

### Issue 6: Analytics/Profile Page Shows "Loading..."

**Symptom**: Analytics or Profile page stuck on loading spinner

**Cause**: API request to `/analytics` or `/user/profile` is timing out

**Check**:
1. Open browser Network tab (F12 → Network)
2. Refresh the page
3. Look for requests to ngrok URL
4. Check if they're timing out (red) or pending (yellow)

**Fix**:
1. Verify ngrok is still running
2. Restart ngrok if needed: `ngrok http 3000`
3. Check that local API is still running
4. Verify firewall isn't blocking the connection

---

## Health Checks

### Check 1: API is Running Locally
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"running",...}`

### Check 2: ngrok Tunnel is Active
```bash
curl https://nonlevel-promilitarism-lorita.ngrok-free.dev/health
```
Expected: `{"status":"running",...}`

### Check 3: App is Deployed on Vercel
```bash
curl https://em-ai-mobile.vercel.app
```
Expected: HTML page with `<title>Elevated Movements AI</title>`

### Check 4: App Bundle is Loading
```bash
curl https://em-ai-mobile.vercel.app/_expo/static/js/web/App-*.js
```
Expected: HTTP 200 with JavaScript code

---

## Quick Restart Guide

If something breaks, follow this in order:

**Step 1: Restart ngrok** (if it crashed)
```bash
ngrok http 3000
# Wait for "Forwarding" line to appear
```

**Step 2: Restart API** (if it's not responding)
```bash
cd packages/api
npm start
# Wait for "Server running on port 3000"
```

**Step 3: Refresh browser**
- Press Ctrl+R or Cmd+R
- Or Ctrl+Shift+R for hard refresh (clears cache)

**Step 4: Clear browser cache if needed**
- Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
- Choose "All time" and check "Cookies and cached images"
- Click "Clear data"

**Step 5: Check console for errors**
- Open F12 Developer Tools
- Go to Console tab
- Look for red error messages
- Take note of the error and check this guide

---

## Important Notes

### ngrok URL Format
Your ngrok URL: `https://nonlevel-promilitarism-lorita.ngrok-free.dev`

This URL changes **each time you restart ngrok**! To keep it consistent:
1. Upgrade to ngrok paid plan (~$15/month) for custom domain
2. Or, document the new URL and update environment variables when it changes

Current URL set in Vercel: `https://nonlevel-promilitarism-lorita.ngrok-free.dev/api`

### Available Test Accounts
Once signup works, you can create test accounts:
- Email: `test@example.com` or `user@example.com`
- Password: Any password (at least 6 characters)
- Name: Any name

### Data Persistence
- User data is stored in PostgreSQL (local)
- Auth tokens stored in browser localStorage
- Voice commands cached in Redis

---

## Contact Information

If you need to debug further:
1. Check these files for error logs:
   - Browser console (F12)
   - Terminal where API is running
   - Terminal where ngrok is running

2. Common files to check:
   - `packages/api/src/index.ts` - API CORS config
   - `packages/mobile/src/services/api.ts` - Mobile API client
   - `packages/mobile/.env.production` - API URL config

---

## Success Indicators

You know everything is working when:
- ✅ App loads without blank screen
- ✅ Login/Signup page visible
- ✅ Can create a new account
- ✅ Can login with that account
- ✅ Profile page shows your name
- ✅ Analytics page loads with data
- ✅ Microphone icon visible on home screen
- ✅ Can record and send voice commands

---

**Status**: Your app is LIVE! 🚀

Keep ngrok running in a terminal window, and everything should work smoothly.
