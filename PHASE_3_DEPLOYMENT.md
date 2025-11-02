# Phase 3 Deployment Guide
## Elevated Movements AI Mobile App

**Version**: 1.0.0
**Platform**: React Native with Expo
**Target**: iOS and Android

---

## Deployment Overview

This guide covers deploying the Elevated Movements AI mobile app to both iOS (App Store) and Android (Google Play Store).

---

## Prerequisites

### Required Accounts

1. **Expo Account** (Free tier works)
   - Sign up at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Apple Developer Account** (for iOS)
   - Cost: $99/year
   - Sign up at https://developer.apple.com
   - Required for TestFlight and App Store

3. **Google Play Developer Account** (for Android)
   - One-time cost: $25
   - Sign up at https://play.google.com/console

### Development Tools

- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI
- Git

---

## Environment Configuration

### 1. Create Production Environment File

```bash
cd packages/mobile
cp .env.example .env.production
```

Edit `.env.production`:
```bash
API_URL=https://api.elevatedmovements.ai/api
NODE_ENV=production
```

### 2. Update app.json

Ensure `app.json` has correct values:

```json
{
  "expo": {
    "name": "Elevated Movements AI",
    "slug": "em-ai-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "bundleIdentifier": "com.elevatedmovements.ai",
      "buildNumber": "1",
      "supportsTablet": true
    },
    "android": {
      "package": "com.elevatedmovements.ai",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      }
    }
  }
}
```

---

## Building the App

### Initialize EAS

```bash
cd packages/mobile
eas build:configure
```

This creates `eas.json` with build configurations.

### Android Build

#### 1. Build APK for Testing

```bash
eas build --platform android --profile preview
```

This creates an APK you can install directly on Android devices.

#### 2. Build AAB for Play Store

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (.aab) for Play Store submission.

#### 3. Download Build

After build completes:
- Visit the build URL provided
- Download the APK or AAB
- Keep the signing keys safe (EAS stores them securely)

### iOS Build

#### 1. Configure Apple Developer Account

```bash
eas credentials
```

Follow prompts to:
- Link Apple Developer account
- Create/select App Store Connect API key
- Configure push notification certificates

#### 2. Build for TestFlight

```bash
eas build --platform ios --profile production
```

#### 3. Submit to TestFlight

```bash
eas submit --platform ios
```

Or manually:
1. Download the .ipa file
2. Open Transporter app (Mac)
3. Upload .ipa to TestFlight
4. Add testers in App Store Connect

---

## App Store Submission

### iOS (App Store)

#### 1. Prepare Assets

**App Icon**: 1024x1024px PNG
- No transparency
- No rounded corners (iOS adds them)
- High quality, recognizable

**Screenshots**:
- iPhone 6.5" (1284x2778px): 3-5 screenshots
- iPhone 5.5" (1242x2208px): 3-5 screenshots
- iPad Pro 12.9" (2048x2732px): 3-5 screenshots

**Preview Video** (Optional):
- 15-30 seconds
- Shows key features

#### 2. App Store Connect Setup

1. Create new app in App Store Connect
2. Fill in app information:
   - **Name**: Elevated Movements AI
   - **Subtitle**: AI Executive Assistant
   - **Category**: Productivity
   - **Description**: Full description of features
   - **Keywords**: AI, voice, assistant, productivity, automation
   - **Support URL**: Your support website
   - **Privacy Policy URL**: Required

3. Upload screenshots and preview

4. Set pricing:
   - Free or paid
   - In-app purchases (if applicable)

5. Submit for review:
   - Answer App Store questions
   - Provide test account credentials
   - Submit

#### 3. Review Process

- Typical review time: 24-48 hours
- Address any rejection issues
- Resubmit if needed

### Android (Google Play Store)

#### 1. Prepare Assets

**App Icon**: 512x512px PNG
- High quality, recognizable
- Follows Material Design guidelines

**Feature Graphic**: 1024x500px PNG
- Shows app branding
- Used in store listing

**Screenshots**:
- Phone: 1080x1920px (min), 4-8 screenshots
- Tablet: 1600x2560px (min), 4-8 screenshots

**Promotional Video** (Optional):
- YouTube link
- Shows app features

#### 2. Google Play Console Setup

1. Create new app in Play Console
2. Fill in store listing:
   - **App name**: Elevated Movements AI
   - **Short description**: 80 characters max
   - **Full description**: Up to 4000 characters
   - **Category**: Productivity
   - **Tags**: AI, voice assistant, productivity

3. Upload graphics:
   - App icon
   - Feature graphic
   - Screenshots (phone & tablet)

4. Set content rating:
   - Complete questionnaire
   - Get rating (likely "Everyone")

5. Select pricing & distribution:
   - Free or paid
   - Countries to distribute
   - Consent to policies

#### 3. Create Release

1. Production track → Create new release
2. Upload AAB file from EAS build
3. Add release notes
4. Set version number
5. Review and rollout

#### 4. Review Process

- Automated checks: Minutes
- Manual review (if triggered): 1-3 days
- Address any issues
- Publish

---

## Over-The-Air (OTA) Updates

Expo allows pushing updates without app store review for JavaScript/assets changes.

### Configure OTA Updates

```bash
# Install expo-updates if not already
npm install expo-updates
```

### Publish Update

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"
```

### What Can Be Updated OTA

✅ JavaScript code changes
✅ React components
✅ Styles and layouts
✅ Assets (images, fonts)
✅ Configuration

❌ Native code changes (requires new build)
❌ Permissions changes
❌ Native dependencies

---

## Continuous Integration / Deployment

### GitHub Actions Workflow

Create `.github/workflows/mobile-deploy.yml`:

```yaml
name: Mobile Deploy

on:
  push:
    branches: [main]
    paths:
      - 'packages/mobile/**'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd packages/mobile
          npm install

      - name: Build Android
        run: |
          cd packages/mobile
          eas build --platform android --non-interactive --no-wait

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: |
          cd packages/mobile
          npm install

      - name: Build iOS
        run: |
          cd packages/mobile
          eas build --platform ios --non-interactive --no-wait
```

### Required Secrets

Add to GitHub repository secrets:
- `EXPO_TOKEN`: From `eas whoami`

---

## Version Management

### Semantic Versioning

Follow semver: `MAJOR.MINOR.PATCH`

**Examples**:
- `1.0.0` - Initial release
- `1.0.1` - Bug fix
- `1.1.0` - New feature
- `2.0.0` - Breaking changes

### Updating Version

**app.json**:
```json
{
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

**Increment rules**:
- iOS `buildNumber`: Increment for every build
- Android `versionCode`: Increment for every build
- `version`: Semantic version string

---

## Testing Before Release

### 1. Internal Testing

**TestFlight (iOS)**:
```bash
eas submit --platform ios
```
- Add internal testers
- Test all features
- Gather feedback

**Google Play Internal Testing**:
- Upload AAB to internal testing track
- Add testers via email
- Test and iterate

### 2. Beta Testing

**TestFlight Public Beta**:
- Configure in App Store Connect
- Share public link
- Gather feedback

**Google Play Open Beta**:
- Create open beta track
- Configure % rollout
- Monitor crashes and feedback

### 3. Staged Rollout

**iOS**:
- Phased Release in App Store Connect
- Start at 1% of users
- Increase gradually

**Android**:
- Staged rollout in Play Console
- Start at 5-10%
- Monitor and increase

---

## Post-Deployment Monitoring

### Analytics Setup

1. **Expo Analytics**:
```bash
npx expo install expo-analytics-amplitude
```

2. **Firebase Analytics**:
```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

3. **Sentry for Errors**:
```bash
npx expo install sentry-expo
```

### Key Metrics to Track

- **Crashes**: Monitor crash rate
- **ANR (Android Not Responding)**: Keep below 1%
- **User Retention**: Track 1-day, 7-day, 30-day
- **Feature Usage**: Voice commands, analytics views
- **API Errors**: Track failed requests
- **Offline Queue**: Monitor sync failures

### Monitoring Tools

1. **Expo Dashboard**:
   - Build history
   - Update deployments
   - Error tracking

2. **App Store Connect**:
   - Sales and trends
   - Crash reports
   - Reviews and ratings

3. **Google Play Console**:
   - Statistics
   - Crashes and ANRs
   - Reviews and ratings

---

## Rollback Procedures

### OTA Update Rollback

```bash
# Publish previous version
eas update --branch production --message "Rollback to v1.0.0"
```

### App Store Rollback

**iOS**:
- Cannot rollback after release
- Submit bug fix update immediately
- Use OTA update if possible

**Android**:
- Cannot rollback published release
- Promote previous release from archive
- Or publish bug fix update

---

## Maintenance

### Regular Updates

**Weekly**:
- Monitor crash reports
- Review user feedback
- Check analytics

**Monthly**:
- Update dependencies
- Security patches
- Performance optimizations

**Quarterly**:
- Major feature releases
- API version updates
- Design refreshes

### Dependency Updates

```bash
cd packages/mobile

# Check outdated packages
npm outdated

# Update Expo SDK
expo upgrade

# Update other packages
npm update

# Test thoroughly
npm test
npm run type-check
```

---

## Troubleshooting

### Build Failures

**EAS Build Errors**:
```bash
# Clear cache and retry
eas build --platform android --clear-cache
```

**Native Module Issues**:
- Rebuild from scratch
- Check compatibility with Expo SDK
- Review native dependencies

### Submission Rejections

**iOS Common Rejections**:
- Privacy policy missing
- Microphone permission not justified
- Crashes during review
- Missing test account

**Android Common Rejections**:
- Privacy policy missing
- Permissions not justified
- Crashes on specific devices
- Content policy violations

### User-Reported Issues

1. **Cannot record voice**:
   - Check permissions in device settings
   - Verify microphone hardware
   - Check API connectivity

2. **App crashes**:
   - Review crash logs in console
   - Test on affected device/OS
   - Push hotfix via OTA

3. **Sync not working**:
   - Verify API endpoints
   - Check network connectivity
   - Review offline queue logs

---

## Security Checklist

Before deploying:

- ✅ API keys in environment variables (not hardcoded)
- ✅ HTTPS for all API endpoints
- ✅ Token expiration handling
- ✅ Secure storage (AsyncStorage)
- ✅ Input validation
- ✅ No sensitive data in logs
- ✅ Certificate pinning (production)
- ✅ ProGuard/obfuscation (Android)
- ✅ Code signing (iOS)

---

## Support & Resources

### Documentation

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Policies**: https://play.google.com/about/developer-content-policy/

### Support Channels

- **Expo Forums**: https://forums.expo.dev
- **Expo Discord**: https://chat.expo.dev
- **Stack Overflow**: Tag with `expo`, `react-native`

---

## Deployment Checklist

### Pre-Deployment

- ✅ All features tested
- ✅ No critical bugs
- ✅ Performance optimized
- ✅ Analytics integrated
- ✅ Crash reporting setup
- ✅ Environment configured
- ✅ Assets prepared (icons, screenshots)
- ✅ App Store descriptions written
- ✅ Privacy policy published
- ✅ Support contact configured

### Deployment

- ✅ Build completed successfully
- ✅ Internal testing passed
- ✅ Beta testing feedback addressed
- ✅ App Store submission completed
- ✅ Review approved
- ✅ Staged rollout started

### Post-Deployment

- ✅ Monitor crash rates
- ✅ Review user feedback
- ✅ Check analytics
- ✅ Respond to reviews
- ✅ Plan next update

---

## Conclusion

The Elevated Movements AI mobile app is ready for production deployment. Follow this guide to successfully publish to both iOS App Store and Google Play Store.

**Estimated Timeline**:
- Build preparation: 1-2 days
- Store listing setup: 1 day
- Review process: 2-7 days
- Total: 4-10 days

**Need Help?** Contact the development team or refer to the comprehensive documentation.

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: November 1, 2025
**Team**: Elevated Movements AI
