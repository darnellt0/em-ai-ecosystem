# Elevated Movements AI - Production Deployment Guide

**Version:** 1.0.0 (Phase 4 Complete)
**Last Updated:** November 6, 2025

This guide covers the complete deployment process for the Elevated Movements AI ecosystem, including the API backend, database, and mobile applications.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [API Backend Deployment](#api-backend-deployment)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

1. **Cloud Provider** (Choose one):
   - Railway.app (Recommended for quick deployment)
   - Heroku
   - AWS/GCP/Azure
   - DigitalOcean

2. **Database**:
   - PostgreSQL 14+ (Managed service recommended)
   - Options: Railway PostgreSQL, Supabase, AWS RDS, Heroku Postgres

3. **External APIs**:
   - Google Cloud Console (Calendar, Gmail, OAuth)
   - OpenAI API (GPT-4)
   - ElevenLabs API (Voice synthesis)
   - Slack Workspace (optional)

4. **Mobile Deployment** (optional):
   - Expo EAS Account (for mobile builds)
   - Apple Developer Account (iOS)
   - Google Play Console (Android)

### Required Tools

```bash
# Node.js & npm
node --version  # v20.x or later
npm --version   # v10.x or later

# PostgreSQL client
psql --version  # 14.x or later

# Expo CLI (for mobile)
npm install -g expo-cli
npm install -g eas-cli

# Optional: Docker
docker --version
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/darnellt0/em-ai-ecosystem.git
cd em-ai-ecosystem
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all package dependencies
npm install --workspaces

# Or manually:
cd packages/api && npm install
cd ../mobile && npm install
cd ../core && npm install
cd ../ml && npm install
cd ../team && npm install
```

### 3. Configure Environment Variables

Create `.env` files for each package:

#### **API Backend** (`packages/api/.env`)

```bash
# Server
NODE_ENV=production
PORT=8080
API_URL=https://your-api-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/em_ai_production

# OpenAI
OPENAI_API_KEY=sk-...

# Google APIs
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://your-api-domain.com/auth/google/callback
GOOGLE_REFRESH_TOKEN=1//...

# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...

# ElevenLabs
ELEVENLABS_API_KEY=...

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app.com
```

#### **Mobile App** (`packages/mobile/.env`)

```bash
# API
EXPO_PUBLIC_API_URL=https://your-api-domain.com
EXPO_PUBLIC_API_TIMEOUT=30000

# Features
EXPO_PUBLIC_ENABLE_OFFLINE=true
EXPO_PUBLIC_ENABLE_VOICE=true
EXPO_PUBLIC_ENABLE_ML=true
```

### 4. Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Elevated Movements AI"
3. Enable APIs:
   - Google Calendar API
   - Gmail API
   - Google+ API (for OAuth)
4. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-api-domain.com/auth/google/callback`
5. Download credentials and extract:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Generate Refresh Token:
   ```bash
   # Use OAuth Playground or run this script
   node packages/api/src/scripts/get-google-refresh-token.js
   ```

### 5. Set Up ElevenLabs

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Go to Profile → API Keys
3. Create new API key
4. Copy to `ELEVENLABS_API_KEY`

### 6. Set Up Slack (Optional)

1. Create Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add Bot Token Scopes:
   - `chat:write`
   - `users:read`
   - `channels:read`
3. Install app to workspace
4. Copy Bot User OAuth Token to `SLACK_BOT_TOKEN`
5. Get channel ID from Slack (right-click channel → View channel details)

---

## Database Deployment

### Option A: Railway PostgreSQL (Recommended)

1. **Create Database**:
   ```bash
   # Go to railway.app
   # Click "New Project" → "Provision PostgreSQL"
   # Copy connection string
   ```

2. **Run Migrations**:
   ```bash
   # Set DATABASE_URL
   export DATABASE_URL="postgresql://..."

   # Run migrations
   cd packages/api
   npm run db:migrate
   ```

### Option B: Supabase

1. **Create Project**:
   - Go to [supabase.com](https://supabase.com/)
   - Create new project
   - Copy connection string (Connection Pooling → Transaction mode)

2. **Run Migrations**:
   ```bash
   export DATABASE_URL="postgresql://..."
   cd packages/api
   npm run db:migrate
   ```

### Option C: Self-Hosted PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql@14
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres psql

   CREATE DATABASE em_ai_production;
   CREATE USER em_ai_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE em_ai_production TO em_ai_user;
   \q
   ```

3. **Run Migrations**:
   ```bash
   export DATABASE_URL="postgresql://em_ai_user:secure_password@localhost:5432/em_ai_production"
   cd packages/api
   npm run db:migrate
   ```

### Verify Migrations

```bash
# Check tables were created
psql $DATABASE_URL -c "\dt"

# Should show:
# - tasks
# - task_history
# - activities
# - notifications
# - calendar_events
# - users
# - organizations
# - team_members
# - shared_calendars
# - api_keys
```

---

## API Backend Deployment

### Option A: Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create Project**:
   ```bash
   cd packages/api
   railway init
   ```

3. **Add Environment Variables**:
   ```bash
   # Copy all variables from .env
   railway variables set NODE_ENV=production
   railway variables set PORT=8080
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set OPENAI_API_KEY="sk-..."
   # ... add all other variables
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get Domain**:
   ```bash
   railway domain
   # Your API will be at: https://your-project.up.railway.app
   ```

### Option B: Heroku

1. **Create Heroku App**:
   ```bash
   heroku create em-ai-api
   heroku addons:create heroku-postgresql:mini
   ```

2. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set OPENAI_API_KEY="sk-..."
   # ... set all other variables
   ```

3. **Deploy**:
   ```bash
   git subtree push --prefix packages/api heroku main
   # Or use Heroku Git
   ```

### Option C: Docker (Any Cloud)

1. **Build Image**:
   ```bash
   cd packages/api
   docker build -t em-ai-api .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     -p 8080:8080 \
     --env-file .env \
     em-ai-api
   ```

3. **Deploy to Cloud**:
   ```bash
   # Push to container registry
   docker tag em-ai-api:latest your-registry/em-ai-api:latest
   docker push your-registry/em-ai-api:latest

   # Deploy to cloud provider (AWS ECS, GCP Cloud Run, etc.)
   ```

### Verify API Deployment

```bash
# Health check
curl https://your-api-domain.com/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2025-11-06T...",
#   "database": "connected"
# }

# Test agent
curl -X POST https://your-api-domain.com/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you do?"}'
```

---

## Mobile App Deployment

### Expo Configuration

1. **Update `app.json`**:
   ```json
   {
     "expo": {
       "name": "Elevated Movements AI",
       "slug": "em-ai-mobile",
       "version": "1.0.0",
       "extra": {
         "apiUrl": "https://your-api-domain.com",
         "eas": {
           "projectId": "your-eas-project-id"
         }
       }
     }
   }
   ```

2. **Configure EAS**:
   ```bash
   cd packages/mobile
   eas login
   eas init
   ```

### Web Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd packages/mobile
   vercel --prod
   ```

3. **Configure**:
   - Build Command: `npm run build:web`
   - Output Directory: `dist`
   - Environment Variables: Add `EXPO_PUBLIC_API_URL`

### iOS Deployment (App Store)

1. **Prerequisites**:
   - Apple Developer Account ($99/year)
   - Mac with Xcode

2. **Build**:
   ```bash
   cd packages/mobile
   eas build --platform ios --profile production
   ```

3. **Submit**:
   ```bash
   eas submit --platform ios
   ```

4. **App Store Connect**:
   - Review build
   - Add screenshots & description
   - Submit for review

### Android Deployment (Play Store)

1. **Prerequisites**:
   - Google Play Console Account ($25 one-time)

2. **Build**:
   ```bash
   cd packages/mobile
   eas build --platform android --profile production
   ```

3. **Submit**:
   ```bash
   eas submit --platform android
   ```

4. **Play Console**:
   - Upload AAB
   - Add store listing
   - Submit for review

### Development/Testing Build

For internal testing without app stores:

```bash
# iOS (TestFlight)
eas build --platform ios --profile preview

# Android (APK for direct install)
eas build --platform android --profile preview
```

---

## Post-Deployment Verification

### 1. API Tests

```bash
# Set API URL
export API_URL="https://your-api-domain.com"

# Test all major endpoints
curl $API_URL/health
curl $API_URL/api/analytics/metrics?founder=test@example.com
curl -X POST $API_URL/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Block 2 hours for deep work tomorrow"}'
```

### 2. Database Tests

```bash
# Connect to production database
psql $DATABASE_URL

# Check data
SELECT COUNT(*) FROM tasks;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM organizations;

# Test queries
SELECT * FROM tasks WHERE founder_email = 'test@example.com' LIMIT 5;
```

### 3. Integration Tests

Test each integration:

```bash
# Google Calendar
curl -X POST $API_URL/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Schedule a meeting tomorrow at 2pm"}'

# Email
curl -X POST $API_URL/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Send email to test@example.com"}'

# Voice
curl -X POST $API_URL/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test"}'
```

### 4. Mobile App Tests

1. **Install App**:
   - Web: Visit your Vercel URL
   - iOS: TestFlight or App Store
   - Android: Play Store or APK

2. **Test Features**:
   - [ ] Login/Signup
   - [ ] Voice command recording
   - [ ] View analytics dashboard
   - [ ] Check settings
   - [ ] Offline mode
   - [ ] Push notifications

---

## Monitoring & Maintenance

### 1. Logging

**API Logs**:
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Docker
docker logs -f container_id
```

**Database Logs**:
```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 2. Monitoring Setup

**Recommended Tools**:
- **Sentry** - Error tracking
- **Datadog** - Performance monitoring
- **LogRocket** - Session replay
- **Uptime Robot** - Health checks

**Basic Health Check**:
```bash
# Add to cron (every 5 minutes)
*/5 * * * * curl -f https://your-api-domain.com/health || echo "API DOWN" | mail -s "Alert" admin@example.com
```

### 3. Backup Strategy

**Database Backups**:
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/em-ai-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "em-ai-*.sql.gz" -mtime +30 -delete
```

**Restore from Backup**:
```bash
gunzip -c /backups/em-ai-20251106.sql.gz | psql $DATABASE_URL
```

### 4. Performance Optimization

**Database Indexes**:
```sql
-- Add if needed for performance
CREATE INDEX idx_tasks_founder_email ON tasks(founder_email);
CREATE INDEX idx_activities_timestamp ON activities(timestamp);
CREATE INDEX idx_calendar_events_start ON calendar_events(start_time);
```

**API Caching**:
- Enable Redis for session storage
- Cache analytics queries (5-minute TTL)
- Use CDN for static assets

### 5. Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] Environment variables secured (not in git)
- [ ] Database connections encrypted
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] JWT tokens rotated regularly
- [ ] Dependencies updated monthly
- [ ] Security headers configured

### 6. Cost Monitoring

**Monthly Cost Estimate**:
- Database (Railway/Supabase): $5-20
- API Hosting (Railway): $5-20
- OpenAI API: $50-200 (depends on usage)
- ElevenLabs: $5-50 (depends on voice usage)
- Mobile Hosting (Vercel): $0 (free tier)
- **Total**: ~$65-290/month

**Cost Optimization**:
- Cache OpenAI responses when possible
- Batch database queries
- Use Vercel free tier for mobile web
- Optimize voice synthesis usage

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error**: `ECONNREFUSED` or `Connection timeout`

**Solution**:
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check SSL requirement (Heroku/Railway)
DATABASE_URL="${DATABASE_URL}?sslmode=require"
```

#### 2. Google Calendar API Errors

**Error**: `invalid_grant` or `Token expired`

**Solution**:
```bash
# Regenerate refresh token
node packages/api/src/scripts/get-google-refresh-token.js

# Update environment variable
railway variables set GOOGLE_REFRESH_TOKEN="new-token"
```

#### 3. OpenAI Rate Limits

**Error**: `rate_limit_exceeded`

**Solution**:
- Upgrade OpenAI tier
- Implement request queuing
- Add retry with exponential backoff

#### 4. Mobile App Build Failures

**Error**: `Build failed` on EAS

**Solution**:
```bash
# Clear cache
eas build --clear-cache

# Check logs
eas build:list

# Validate app.json
npx expo-cli doctor
```

#### 5. Voice API Not Working

**Error**: `Microphone permission denied`

**Solution**:
- iOS: Check `Info.plist` has `NSMicrophoneUsageDescription`
- Android: Check `AndroidManifest.xml` has `RECORD_AUDIO` permission
- Web: Ensure HTTPS (required for mic access)

---

## Next Steps

After successful deployment:

1. **User Onboarding**:
   - Create user documentation
   - Record tutorial videos
   - Set up support channels

2. **Marketing**:
   - Create landing page
   - Set up analytics (Google Analytics, Mixpanel)
   - Launch announcement

3. **Iteration**:
   - Monitor user feedback
   - Track feature usage
   - Plan Phase 5 enhancements

4. **Scaling**:
   - Add horizontal scaling for API
   - Implement Redis caching
   - Set up CDN for assets
   - Consider multi-region deployment

---

## Support

For deployment assistance:
- **Email**: support@elevatedmovements.com
- **GitHub**: [github.com/darnellt0/em-ai-ecosystem](https://github.com/darnellt0/em-ai-ecosystem)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: November 6, 2025
**Maintained By**: Elevated Movements Team
