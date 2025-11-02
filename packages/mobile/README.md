# Elevated Movements AI - Mobile App

React Native mobile application for the Elevated Movements AI Ecosystem.

## Features

- **Voice Commands**: Real-time voice recording and command processing
- **Analytics Dashboard**: Productivity charts and metrics
- **Multi-User Support**: Team management and user roles
- **Offline Mode**: Local data persistence with background sync
- **Machine Learning**: Predictive scheduling and task prioritization
- **Cross-Platform**: iOS and Android support via Expo

## Tech Stack

- **React Native** with Expo SDK 50
- **TypeScript** for type safety
- **React Navigation** for routing
- **AsyncStorage** for offline persistence
- **React Native Voice** for audio recording
- **Socket.io** for real-time sync
- **TensorFlow.js** for ML predictions
- **React Native Chart Kit** for analytics visualization

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
cd packages/mobile
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update API_URL in `.env`:
```
API_URL=http://YOUR_API_URL:3000/api
```

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── VoiceButton.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── AnalyticsChart.tsx
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── AnalyticsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── SignupScreen.tsx
│   ├── services/         # API and business logic
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── voice.ts
│   │   ├── offlineSync.ts
│   │   └── mlPrediction.ts
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useVoice.ts
│   │   ├── useOfflineSync.ts
│   │   └── useAnalytics.ts
│   ├── store/           # State management
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── styles/          # Theme and styles
│   │   ├── theme.ts
│   │   └── globalStyles.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── App.tsx          # Main app component
├── assets/              # Images, fonts, etc.
├── app.json            # Expo configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Building for Production

### Build APK (Android)

```bash
npm run build:android
```

### Build IPA (iOS)

```bash
npm run build:ios
```

## Features Implementation

### Voice Commands

The app uses React Native Voice library for speech recognition and Expo Audio for recording:

```typescript
import { useVoice } from '@hooks/useVoice';

const { startRecording, stopRecording, isRecording } = useVoice();
```

### Offline Sync

Automatic background synchronization with offline queue:

```typescript
import { useOfflineSync } from '@hooks/useOfflineSync';

const { syncStatus, triggerSync } = useOfflineSync();
```

### Analytics

Real-time charts and productivity metrics:

```typescript
import { useAnalytics } from '@hooks/useAnalytics';

const { data, insights, loading } = useAnalytics('week');
```

### ML Predictions

Simple machine learning for scheduling suggestions:

```typescript
import mlPredictionService from '@services/mlPrediction';

const prediction = await mlPredictionService.predictScheduleTime('email');
```

## API Integration

The app connects to the Elevated Movements AI backend:

- **Base URL**: Configured in `.env`
- **Authentication**: Bearer token
- **Rate Limiting**: Handled automatically
- **Offline Support**: Queued requests sync when online

## Troubleshooting

### iOS Permissions

Add to `Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice commands</string>
```

### Android Permissions

Already configured in `app.json`:
- `RECORD_AUDIO`
- `INTERNET`
- `ACCESS_NETWORK_STATE`

### Network Issues

For local development, use your machine's IP address instead of `localhost` in `.env`.

## Contributing

This is part of the Elevated Movements AI Ecosystem Phase 3 implementation.

## License

Proprietary - Elevated Movements AI
