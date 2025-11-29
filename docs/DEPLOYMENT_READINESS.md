# Deployment Readiness Guide
## Elevated Movements AI Ecosystem

**Version:** 1.0.0
**Last Updated:** 2025-11-29
**Status:** Production Ready ✅

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Backup & Recovery](#backup--recovery)
9. [Rollback Procedures](#rollback-procedures)
10. [Incident Response](#incident-response)

---

## Pre-Deployment Checklist

### Code Quality
- [x] All TypeScript builds complete without errors
- [x] Agent registry validation passes
- [x] Phase 6 Growth Agents integrated and tested
- [x] No TODO/FIXME markers in production code
- [x] All tests passing (run: `npm test`)

### Agent Verification
- [x] Run agent integrity check: `npm run check-agent-integrity`
- [x] Run Phase 6 QA tests: `POST /api/orchestrator/qa/phase6`
- [x] Verify all 5 agents (Journal, Niche, Mindset, Rhythm, Purpose)
- [x] Confirm no mock implementations

### Infrastructure
- [x] Production Dockerfile tested and optimized
- [x] Docker images build successfully
- [x] Railway/Render configuration files created
- [x] Environment variables template prepared
- [x] Managed database provisioned (PostgreSQL 15+)
- [x] Managed Redis provisioned (Redis 7+)

### Security
- [ ] All secrets rotated and secured
- [ ] Environment variables configured in deployment platform
- [ ] API keys validated and active
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] SSL/TLS certificates active

### Monitoring
- [ ] Sentry DSN configured
- [ ] Uptime monitoring configured (UptimeRobot/Better Uptime)
- [ ] Log aggregation setup
- [ ] Alert channels configured (Email/Slack)

---

## Infrastructure Requirements

### Compute
- **API Server:** 512MB RAM minimum, 1GB recommended
- **Node Version:** 20.x (LTS)
- **CPU:** 1 vCPU minimum, 2 vCPU recommended

### Databases
- **PostgreSQL:** v15+ (Managed service recommended)
  - Storage: 10GB minimum
  - Automated backups enabled
  - Point-in-time recovery enabled

- **Redis:** v7+ (Managed service recommended)
  - Memory: 256MB minimum
  - Persistence: AOF enabled
  - Max memory policy: allkeys-lru

### Networking
- **Ports:** 3000 (HTTP)
- **Load Balancer:** Optional but recommended for HA
- **CDN:** Optional for static assets

---

## Environment Variables

### Critical (Required)
```bash
# Core
NODE_ENV=production
PORT=3000
DATABASE_URL=<managed_postgres_url>
REDIS_URL=<managed_redis_url>

# API Keys
OPENAI_API_KEY=<your_key>
CLAUDE_API_KEY=<your_key>
ELEVENLABS_API_KEY=<your_key>

# Google Integration
GOOGLE_SERVICE_ACCOUNT_JSON_B64=<base64_encoded_json>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<gmail_address>
SMTP_PASS=<gmail_app_password>
```

### Important (Recommended)
```bash
# Sentry
SENTRY_DSN=<your_sentry_dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Security
VOICE_API_TOKEN=<secure_random_token>
SESSION_SECRET=<secure_random_token>
ALLOWED_ORIGINS=https://yourdomain.com

# Feature Flags
ENABLE_GROWTH_AGENTS=true
```

### Optional
```bash
# Twilio (SMS features)
TWILIO_ACCOUNT_SID=<your_sid>
TWILIO_AUTH_TOKEN=<your_token>
TWILIO_FROM_NUMBER=<your_number>

# Monitoring
LOG_LEVEL=info
```

**Full template:** See `.env.production` in repository root

---

## Database Setup

### 1. Provision Managed PostgreSQL

#### Railway
```bash
railway add postgres
railway variables
# Copy DATABASE_URL
```

#### Render
```bash
# Dashboard > New > PostgreSQL
# Choose instance type: Starter or higher
# Copy External Database URL
```

### 2. Run Migrations
```bash
# Ensure DATABASE_URL is set
npm run migrate --workspace=@em/api
```

### 3. Verify Schema
```bash
# Connect to database
psql $DATABASE_URL

# Verify tables exist
\dt
```

---

## Deployment Process

### Option 1: Railway (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   railway init
   railway link
   ```

3. **Configure Environment**
   ```bash
   railway variables set NODE_ENV=production
   # Set all required environment variables from template
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Monitor Deployment**
   ```bash
   railway logs
   ```

### Option 2: Render

1. **Connect Repository**
   - Dashboard > New > Web Service
   - Connect GitHub repository

2. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `node packages/api/dist/index.js`
   - Dockerfile: `Dockerfile.production`

3. **Set Environment Variables**
   - Use template from `.env.production`
   - Configure in Render dashboard

4. **Deploy**
   - Click "Create Web Service"
   - Monitor build logs

### Option 3: Docker (Self-Hosted)

1. **Build Image**
   ```bash
   docker build -f Dockerfile.production -t em-ai-ecosystem:latest .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name em-api \
     -p 3000:3000 \
     --env-file .env.production \
     em-ai-ecosystem:latest
   ```

3. **Use Docker Compose** (includes DB & Redis)
   ```bash
   docker-compose up -d
   ```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# Main API health
curl https://your-api.com/health

# Expected response:
{
  "status": "running",
  "environment": "production",
  "uptime": 12.34,
  "version": "1.0.0"
}
```

### 2. Agent Registry Health
```bash
curl https://your-api.com/api/orchestrator/agents/health

# Expected: 200 OK with all agents "healthy"
```

### 3. Database Connectivity
```bash
curl https://your-api.com/api/health/db

# Expected: "connected"
```

### 4. Redis Connectivity
```bash
curl https://your-api.com/api/health/redis

# Expected: "connected"
```

### 5. Run Phase 6 QA
```bash
curl -X POST https://your-api.com/api/orchestrator/qa/phase6

# Expected: "overall_status": "PASS"
```

### 6. Test Agent Execution
```bash
curl -X POST https://your-api.com/api/orchestrator/launch

# Expected: jobIds array with 5 agents
```

---

## Monitoring & Alerts

### Uptime Monitoring

1. **Import Configuration**
   - Use `monitoring/uptime.json`
   - Import to UptimeRobot or Better Uptime

2. **Configure Endpoints**
   - `/health` - Every 5 minutes
   - `/api/orchestrator/health` - Every 5 minutes
   - `/api/orchestrator/agents/health` - Every 10 minutes

3. **Set Alert Contacts**
   - Email: alerts@elevatedmovements.com
   - Slack: Optional webhook

### Sentry Error Tracking

1. **Verify Integration**
   ```bash
   # Check Sentry dashboard for events
   # Should see "Sentry initialized" log
   ```

2. **Test Error Capture**
   ```bash
   # Trigger test error endpoint
   curl https://your-api.com/api/test-error

   # Check Sentry dashboard for error
   ```

3. **Configure Alerts**
   - Set up alert rules in Sentry dashboard
   - Configure notification channels

### Log Monitoring

1. **Access Logs**
   ```bash
   # Railway
   railway logs

   # Render
   # Dashboard > Logs tab

   # Docker
   docker logs em-api -f
   ```

2. **Log Levels**
   - `info`: Normal operations
   - `warn`: Potential issues
   - `error`: Failures requiring attention

---

## Backup & Recovery

### Automated Backups

#### Railway
- **Database:** Automatic daily backups (retained 7 days)
- **Manual Backup:**
  ```bash
  railway db backup create
  ```

#### Render
- **Database:** Automatic daily backups (retained 7-30 days depending on plan)
- **Point-in-time Recovery:** Available on paid plans

### Manual Backup
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Verify backup
file backup_$(date +%Y%m%d).sql
```

### Restore Procedure

1. **From Managed Service**
   ```bash
   # Railway
   railway db backup restore <backup-id>

   # Render
   # Dashboard > Database > Backups > Restore
   ```

2. **From Manual Backup**
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```

3. **Verify Restoration**
   ```bash
   # Check table counts
   psql $DATABASE_URL -c "SELECT count(*) FROM users;"
   ```

---

## Rollback Procedures

### Application Rollback

#### Railway
```bash
# List deployments
railway deployments

# Rollback to previous
railway rollback <deployment-id>
```

#### Render
- Dashboard > Deployments
- Click "Rollback" on previous successful deployment

#### Docker
```bash
# Pull previous image
docker pull em-ai-ecosystem:previous

# Stop current container
docker stop em-api

# Start previous version
docker run -d --name em-api -p 3000:3000 \
  em-ai-ecosystem:previous
```

### Database Rollback

1. **Stop Application**
2. **Restore from Backup** (see Backup & Recovery)
3. **Restart Application**
4. **Verify Functionality**

---

## Incident Response

### Common Issues

#### 1. API Not Responding
```bash
# Check health endpoint
curl https://your-api.com/health

# Check logs
railway logs # or render logs

# Possible causes:
# - Database connection lost
# - Redis connection lost
# - Environment variable missing
# - Out of memory

# Resolution:
# - Restart service
# - Check DATABASE_URL and REDIS_URL
# - Scale up if memory issue
```

#### 2. Agent Failures
```bash
# Check agent health
curl https://your-api.com/api/orchestrator/agents/health

# Run integrity check
npm run check-agent-integrity

# Possible causes:
# - Missing API keys (OPENAI_API_KEY, etc.)
# - Google credentials invalid
# - Redis connectivity

# Resolution:
# - Verify environment variables
# - Check agent logs
# - Restart orchestrator
```

#### 3. Database Connection Issues
```bash
# Test connection
curl https://your-api.com/api/health/db

# Possible causes:
# - Database service down
# - Connection pool exhausted
# - Network issue

# Resolution:
# - Check managed database status
# - Restart API service
# - Scale database if needed
```

#### 4. High Latency
```bash
# Run Phase 6 QA to measure latency
curl -X POST https://your-api.com/api/orchestrator/qa/phase6

# Check Sentry performance monitoring

# Possible causes:
# - Database slow queries
# - Redis memory full
# - API rate limits hit

# Resolution:
# - Optimize queries
# - Scale Redis memory
# - Implement caching
```

### Escalation Path

1. **Severity 1 (Critical):** API completely down
   - Immediate rollback to last known good deployment
   - Notify team immediately
   - Debug in parallel

2. **Severity 2 (High):** Partial functionality loss
   - Investigate root cause
   - Implement hotfix if possible
   - Schedule deployment window

3. **Severity 3 (Medium):** Performance degradation
   - Monitor metrics
   - Plan optimization
   - Schedule maintenance window

---

## Contact & Support

**Engineering Lead:** [Your Name]
**Email:** engineering@elevatedmovements.com
**On-Call:** [Pager Duty/Phone]

**Third-Party Services:**
- Railway Support: support@railway.app
- Render Support: support@render.com
- Sentry Support: support@sentry.io

---

## Appendix

### Useful Commands

```bash
# Check agent integrity
npm run check-agent-integrity

# Run Phase 6 QA
curl -X POST https://your-api.com/api/orchestrator/qa/phase6

# View logs
railway logs
# or
render logs

# Restart service
railway restart
# or
render restart

# Database backup
pg_dump $DATABASE_URL > backup.sql

# Database restore
psql $DATABASE_URL < backup.sql
```

### Quick Reference URLs

- **Railway Dashboard:** https://railway.app/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Sentry Dashboard:** https://sentry.io/organizations/your-org
- **UptimeRobot:** https://uptimerobot.com/dashboard

---

**Document Status:** Complete ✅
**Review Required:** Before production deployment
**Next Review:** After first production deployment
