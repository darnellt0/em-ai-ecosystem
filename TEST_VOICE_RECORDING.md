# Voice Recording Test Guide - End User Testing

## ✅ Pre-Test Verification

**Code Status:**
- ✅ expo-av package installed (v13.10.4)
- ✅ Audio.Recording API implemented (replaced browser getUserMedia)
- ✅ Microphone permissions handling added
- ✅ No more web browser APIs in React Native code
- ✅ Expo server running on exp://10.0.0.249:8081

**Expected Behavior:**
- First tap should prompt for microphone permission
- After granting permission, voice recording should work
- NO MORE "getUserMedia undefined" error

---

## 📱 End-User Test Steps

### Step 1: Launch App
1. Open **Expo Go** on your Android phone
2. Make sure your phone is on the same WiFi as your computer
3. Connect to: `exp://10.0.0.249:8081` OR scan the QR code
4. Wait for app to fully load

**✓ Success:** You see "Hello, [Your Name]!" and the main app interface

---

### Step 2: Locate Voice Button
1. Look for a large circular button with gradient colors
2. It should say **"Tap to Speak"**
3. The button should be on the Home screen

**✓ Success:** You can see the "Tap to Speak" button clearly

---

### Step 3: First Time - Grant Permissions
1. **Tap** the "Tap to Speak" button
2. You should see a permission dialog asking for microphone access
3. **Tap "Allow"** or **"While using the app"**

**✓ Success:** Permission granted, no error messages

**❌ If you see an error:**
- Check logs in terminal for specific error
- Make sure you're not denying the permission

---

### Step 4: Start Recording
1. **Tap** the "Tap to Speak" button again
2. The button should change:
   - Color changes to red/warning color
   - Text changes to **"Tap to Stop"**
   - You should see "Recording..." indicator
   - Button may pulse or animate
3. You should feel a **haptic vibration** (phone buzz)

**✓ Success:**
- Button shows "Tap to Stop"
- Recording indicator visible
- Phone vibrated

**❌ If nothing happens:**
- Check terminal logs for errors
- Make sure microphone permission was granted
- Try reloading the app (shake phone → Reload)

---

### Step 5: Speak Your Command
1. While recording (button shows "Tap to Stop"):
2. **Speak clearly** into your phone:
   - "Hello, this is a test"
   - "Schedule a meeting for tomorrow"
   - "What's on my calendar?"
   - Any voice command you want

**✓ Success:** You're speaking and the recording indicator is still showing

---

### Step 6: Stop Recording
1. **Tap** the button again to stop recording
2. The button should:
   - Return to original blue/purple gradient
   - Text changes back to **"Tap to Speak"**
   - You should feel another **haptic vibration**
3. You should see a **processing indicator** (loading spinner)

**✓ Success:**
- Recording stopped
- App is processing your command
- Phone vibrated again

---

### Step 7: Verify in Logs
1. Look at the terminal on your computer
2. You should see logs like:
   ```
   LOG Recording started
   LOG Recording stopped: 3.2 URI: file:///...
   ```
3. NO errors about "getUserMedia"

**✓ Success:** Logs show recording started and stopped with a file URI

**❌ If you see errors:**
- Note the exact error message
- Report back with the error

---

### Step 8: Test Multiple Times
1. Try recording **3-5 more times** in a row
2. Each time should work consistently
3. Try different lengths:
   - Quick tap (1 second)
   - Medium (5 seconds)
   - Long (10+ seconds)

**✓ Success:** All recordings work without errors

---

## 🎯 Expected Results Summary

### ✅ PASS Criteria:
- [ ] No "getUserMedia undefined" error
- [ ] Permission dialog appears on first use
- [ ] Button changes state (Tap to Speak ↔ Tap to Stop)
- [ ] Recording indicator shows while recording
- [ ] Haptic feedback on start/stop
- [ ] Logs show "Recording started" and "Recording stopped" with file URI
- [ ] Can record multiple times without issues

### ❌ FAIL Criteria:
- [ ] "getUserMedia undefined" error still appears
- [ ] Permission dialog never appears
- [ ] Button doesn't respond to taps
- [ ] No haptic feedback
- [ ] Errors in logs
- [ ] App crashes

---

## 🐛 Troubleshooting

**If voice recording still doesn't work:**

1. **Check you're on the right branch:**
   ```bash
   git branch --show-current
   # Should show: claude/debug-issue-01NnRV1fi5RShKQtm563aQ9A
   ```

2. **Verify expo-av is installed:**
   ```bash
   ls node_modules/expo-av
   # Should list files
   ```

3. **Clear everything and restart:**
   ```bash
   # Stop Expo (Ctrl+C)
   rm -rf .expo
   npx expo start -c
   # Then reload app on phone
   ```

4. **Check Android permissions manually:**
   - Go to Phone Settings → Apps → Expo Go → Permissions
   - Make sure Microphone is allowed

---

## 📊 Test Results Template

**Date:** _____________
**Phone Model:** _____________
**Android Version:** _____________

| Test Step | Result (✓/✗) | Notes |
|-----------|--------------|-------|
| App loads | | |
| Voice button visible | | |
| Permission prompt | | |
| Recording starts | | |
| Haptic feedback | | |
| Recording stops | | |
| Logs show file URI | | |
| Multiple recordings | | |

**Overall Status:** PASS / FAIL

**Any errors:**
_____________________________________________

---

## 🎉 Success!

If all tests pass, you can now:
- Talk to your AI agent via voice commands
- Record voice memos
- Use voice-to-text features
- All without the "getUserMedia" error!

The fix successfully replaced the web browser API (navigator.mediaDevices.getUserMedia) with React Native's expo-av Audio.Recording API.
