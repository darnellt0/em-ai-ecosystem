# Fix Voice Recording Error

The issue is that `expo-av` package is not properly installed. Follow these steps EXACTLY:

## Step 1: Stop Expo
In your terminal where Expo is running, press `Ctrl+C` to stop it.

## Step 2: Navigate to mobile package
```bash
cd ~/OneDrive/Documents/Python\ Scripts/Elevated_Movements/em-ai-ecosystem/packages/mobile
```

## Step 3: Delete node_modules and reinstall
```bash
rm -rf node_modules
rm -rf ../../node_modules
npm install --legacy-peer-deps
```

## Step 4: Verify expo-av is installed
```bash
ls node_modules/expo-av
```
You should see files like: `CHANGELOG.md`, `README.md`, `android`, `ios`, etc.

If you DON'T see these files, run:
```bash
npm install expo-av@~13.10.4 --legacy-peer-deps --force
```

## Step 5: Clear ALL caches
```bash
rm -rf .expo
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
npx expo start --clear
```

Or if you're on Windows:
```powershell
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
npx expo start --clear
```

## Step 6: On your Android phone
1. **Completely close** Expo Go (don't just minimize - swipe it away)
2. Reopen Expo Go
3. Reconnect to your app

## Step 7: Test
Tap the "Tap to Speak" button. You should see a permission prompt asking for microphone access. Grant it, and voice recording should work!

## If it STILL doesn't work:

Run this nuclear option:
```bash
# Stop everything
pkill -f expo
pkill -f metro

# Delete everything
rm -rf node_modules
rm -rf ../../node_modules
rm -rf .expo
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# Reinstall from scratch
cd ../..
npm install --legacy-peer-deps
cd packages/mobile
npm install --legacy-peer-deps

# Start fresh
npx expo start -c
```

## What was fixed:
1. ✅ Replaced `navigator.mediaDevices.getUserMedia()` (web API) with `expo-av` Audio.Recording (React Native API)
2. ✅ Added missing Text import in App.tsx
3. ✅ Added audio permissions handling
4. ✅ Installed expo-av package

The error `"Cannot read property 'getUserMedia' of undefined"` happened because the code was trying to use a browser API that doesn't exist in React Native.
