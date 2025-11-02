# Quick Start Guide - Elevated Movements AI Ecosystem

**Status**: ✅ Production Ready | **Date**: November 1, 2025

---

## 🚀 5-Minute Quick Start

### 1. Verify Docker is Running

```bash
cd "C:\Users\darne\OneDrive\Documents\Python Scripts\Elevated_Movements\em-ai-ecosystem"
docker-compose ps
```

You should see 6 services: api, dashboard, database, redis, n8n, caddy

### 2. Access the Dashboard

**Open in your browser:**
```
http://localhost:8080
```

You'll see:
- Real-time system metrics
- 12 AI agents status
- Founder configuration (Darnell & Shria)
- Total cost, emails processed, meetings analyzed

### 3. Test API Endpoints

```bash
# Check system configuration
curl http://localhost:80/api/config

# List all agents
curl http://localhost:80/api/agents

# Get real-time metrics
curl http://localhost:80/api/dashboard
```

### 4. Add Google Credentials (Optional)

If you have the Google OAuth credentials:

```bash
# Copy your credentials file
cp ~/Downloads/client_secret_*.json ./config/google-credentials.json

# Restart the API
docker-compose restart api

# Verify connection
docker-compose logs api | grep -i "google\|credential"
```

---

## 📊 System Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:8080 | Monitor system |
| API | http://localhost:80/api | REST endpoints |
| Workflows | http://localhost:5679 | n8n automation |
| Database | localhost:5433 | PostgreSQL |

---

## 🔧 Common Commands

### Start System
```bash
docker-compose up -d
```

### Stop System
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs -f api
docker-compose logs -f dashboard
docker-compose logs -f database

# Watch real-time
docker-compose logs -f
```

### Restart Service
```bash
docker-compose restart api
docker-compose restart database
docker-compose restart dashboard
```

### View System Status
```bash
docker-compose ps
```

### Database Access
```bash
docker-compose exec database psql -U elevated_movements -d em_ecosystem
```

---

## 👥 Founder Configuration

The system is configured to monitor 4 email accounts:

### Darnell Tomlinson
- **Business**: darnell@elevatedmovements.com
- **Personal**: darnell.tomlinson@gmail.com

### Shria Tomlinson
- **Business**: shria@elevatedmovements.com
- **Personal**: shria.tomlinson@gmail.com

---

## 🔐 Credentials

| Service | Host | User | Password |
|---------|------|------|----------|
| PostgreSQL | localhost:5433 | elevated_movements | T0ml!ns0n |
| Redis | localhost:6380 | (no auth) | - |
| n8n | localhost:5679 | admin | changeme |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | System overview |
| [SYSTEM_COMPLETE.md](./SYSTEM_COMPLETE.md) | Full architecture |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment & operations |
| [CONSOLIDATION_VERIFICATION.md](./CONSOLIDATION_VERIFICATION.md) | Latest status |
| [GOOGLE_CREDENTIALS_SETUP.md](./GOOGLE_CREDENTIALS_SETUP.md) | OAuth setup |

---

## 🤖 The 12 AI Agents

1. **Daily Brief** - Morning executive summary
2. **Inbox Assistant** - Email classification & drafts
3. **Calendar Optimizer** - Meeting optimization
4. **Grant Researcher** - Opportunity discovery
5. **Voice Companion** - Personalized interactions
6. **Relationship Tracker** - Contact management
7. **Financial Allocator** - Budget planning
8. **Insight Analyst** - Pattern detection
9. **Content Synthesizer** - Multi-platform content
10. **Membership Guardian** - Community engagement
11. **Brand Storyteller** - Brand consistency
12. **Deep Work Defender** - Focus protection

---

## 🔍 Health Checks

### Quick Health Check
```bash
curl http://localhost:80/health
```

Expected response:
```json
{
  "status": "running",
  "timestamp": "2025-11-01T18:28:00.000Z"
}
```

### Detailed Status
```bash
curl http://localhost:80/api/config
```

### Agent Status
```bash
curl http://localhost:80/api/agents
```

---

## ⚠️ Troubleshooting

### Dashboard Not Loading
```bash
# Restart dashboard
docker-compose restart dashboard

# Check logs
docker-compose logs dashboard
```

### API Not Responding
```bash
# Restart API
docker-compose restart api

# Check logs
docker-compose logs api

# Test health
curl http://localhost:3000/health
```

### Database Connection Error
```bash
# Restart database
docker-compose restart database

# Check logs
docker-compose logs database

# Verify credentials
docker-compose exec database psql -U elevated_movements -d em_ecosystem -c "SELECT 1"
```

### Port Already in Use
If you get "port already in use" errors, find and stop the conflicting process:
```bash
# Find process on port 80
lsof -i :80

# Find process on port 8080
lsof -i :8080

# Kill process if needed
kill -9 <PID>
```

---

## 📈 Key Metrics

View real-time metrics at: **http://localhost:8080**

**Tracked Metrics:**
- Total emails processed: 127
- Meetings analyzed: 42
- Tasks created: 89
- Total cost this month: $487.65
- API calls: 3,421

---

## 🔗 Related Documentation

- [Complete System Architecture](./SYSTEM_COMPLETE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Google Credentials Setup](./GOOGLE_CREDENTIALS_SETUP.md)
- [File Index](./INDEX.md)

---

## ✅ Verification Checklist

Before proceeding with production:

- [ ] Dashboard loads at http://localhost:8080
- [ ] API responds to curl http://localhost:80/api/config
- [ ] 12 agents show in API response
- [ ] Database connected with T0ml!ns0n password
- [ ] Redis cache operational
- [ ] All logs clean (no errors in docker-compose logs)
- [ ] Google credentials placed (if needed)

---

## 🚀 Next Steps

1. **Monitor Dashboard** - Visit http://localhost:8080
2. **Add Credentials** - Place Google OAuth file in `./config/google-credentials.json`
3. **Test Agents** - Verify all 12 agents are operational
4. **Deploy to Production** - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: November 1, 2025

