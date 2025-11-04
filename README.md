# Elevated Movements AI Executive Assistant Ecosystem

![Status](https://img.shields.io/badge/status-production%20ready-green)
![Completion](https://img.shields.io/badge/completion-100%25-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**A comprehensive, production-ready AI executive assistant system serving two co-founders with 12 specialized AI agents, sophisticated orchestration, REST API control, and real-time monitoring.**

## 🎯 Overview

This is a **fully implemented, production-grade system** with 20,000+ lines of TypeScript code. It contains 12 specialized AI agents that automate executive tasks while maintaining privacy, security, and founder autonomy.

### ✨ Key Features

- **12 Specialized AI Agents**: Each with specific domain expertise
- **Dual-Founder Architecture**: Merged calendars, separate emails, synchronized workflows
- **30+ RESTful API Endpoints**: Complete system control and monitoring
- **Real-time Web Dashboard**: Health monitoring, cost tracking, log viewing
- **100+ Daily Scheduled Tasks**: Intelligent orchestration with dependency management
- **Production Infrastructure**: Docker Compose with 6 services (API, Dashboard, DB, Redis, n8n, Caddy)
- **Cost Tracking & Forecasting**: Real-time monitoring and predictions
- **Type-Safe TypeScript**: Strict mode throughout, 0 `any` types
- **Circuit Breaker Pattern**: Intelligent fallbacks (OpenAI → Claude)
- **Enterprise Security**: Encryption, CORS, rate limiting, audit logging

## 📊 System Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 20,000+ |
| TypeScript Files | 60+ |
| Core Services | 9 |
| AI Agents | 12 |
| API Endpoints | 30+ |
| Database Tables | 5 |
| Docker Services | 6 |
| Daily Scheduled Tasks | 100+ |

## 🤖 The 12 AI Agents

| # | Agent | Purpose | Output |
|---|-------|---------|--------|
| 1 | Daily Brief | Morning executive summary | Email + voice briefing |
| 2 | Inbox Assistant | Email classification & drafts | Classified inbox + drafts |
| 3 | Calendar Optimizer | Meeting optimization | Daily recommendations |
| 4 | Grant Researcher | Grant discovery & tracking | Daily opportunities |
| 5 | Voice Companion | Personalized voice interactions | Daily affirmations |
| 6 | Relationship Tracker | Contact engagement management | Weekly relationship report |
| 7 | Financial Allocator | Budget planning & forecasting | Monthly financial report |
| 8 | Insight Analyst | Pattern detection & intelligence | Daily energy report |
| 9 | Content Synthesizer | Multi-platform content creation | Content sets |
| 10 | Membership Guardian | Community engagement tracking | Weekly community report |
| 11 | Brand Storyteller | Brand consistency validation | Brand compliance reports |
| 12 | Deep Work Defender | Focus block protection | Daily protection report |

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+
- Node.js 18+ (for local development)
- 4GB RAM minimum
- 10GB disk space

### Installation & Deployment

```bash
# 1. Clone and navigate
git clone <repo-url>
cd em-ai-ecosystem

# 2. Run setup (creates directories, configs, Docker images)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configure environment variables
# Edit .env with your API keys:
#   - OPENAI_API_KEY=sk-...
#   - CLAUDE_API_KEY=sk-...
#   - ELEVENLABS_API_KEY=...
#   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# 4. Deploy all services
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 5. Access the dashboard
# Open: http://localhost:8080
```

### Verification

```bash
# Check API health
curl http://localhost:3000/health

# View all services
docker-compose ps

# Monitor logs
docker-compose logs -f api
```

## ?? Deployment (Render + Vercel)

### Render API Service

1. Push your changes and connect the repo in Render.
2. Choose **New > Web Service**, select this repo, and Render auto-detects the build and start commands via `render.yaml`.
3. Confirm the service region (Oregon) and plan (Free) or adjust as needed.
4. Allow Render to create environment variables from `render.yaml`, then supply secrets for the API keys, database, and Redis.
5. Optional automation: add `RENDER_SERVICE_ID` and `RENDER_API_KEY` as GitHub repository secrets to let the included GitHub Action auto-trigger a Render deploy on pushes to `main`.

### Vercel Frontend

1. Point your Vercel project at the appropriate frontend folder or static build.
2. In Project Settings → Environment Variables, set:
   - `PUBLIC_API_BASE_URL` (example: `https://<your-render-service>.onrender.com`)
   - `PUBLIC_WS_URL` (example: `wss://<your-render-service>.onrender.com`)
3. Redeploy the frontend so it picks up the new variables.

### Frontend Usage

```ts
const baseUrl = process.env.PUBLIC_API_BASE_URL;
const wsUrl = process.env.PUBLIC_WS_URL;

await fetch(`${baseUrl}/api/voice/intent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Block deep work next Tuesday' }),
});

const socket = new WebSocket(`${wsUrl}/realtime`);
socket.onmessage = (event) => console.log(event.data);
```

### Smoke Tests

```bash
curl -i https://<your-render-service>.onrender.com/health
curl -i -X POST https://<your-render-service>.onrender.com/api/voice/coach/pause \
  -H "Content-Type: application/json" \
  -d '{"minutes":1}'

# Browser console or Node REPL
new WebSocket("wss://<your-render-service>.onrender.com/realtime");
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [SYSTEM_COMPLETE.md](./SYSTEM_COMPLETE.md) | Complete architecture and system documentation |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment, scaling, and operational procedures |
| [AGENTS_COMPLETE.md](./AGENTS_COMPLETE.md) | Detailed specs for all 12 agents |
| [packages/api/README.md](./packages/api/README.md) | API endpoint documentation |
| [packages/dashboard/README.md](./packages/dashboard/README.md) | Dashboard features and usage |

## 🔌 API Endpoints (30+)

### Core API Calls

```bash
# Health & Status
curl http://localhost:3000/health
curl http://localhost:3000/api/health/detailed

# Agent Management
curl http://localhost:3000/api/agents
curl http://localhost:3000/api/agents/daily-brief
curl -X POST http://localhost:3000/api/agents/daily-brief/run

# Monitoring
curl http://localhost:3000/api/metrics
curl http://localhost:3000/api/costs
curl http://localhost:3000/api/logs?limit=20

# Configuration
curl http://localhost:3000/api/config
curl http://localhost:3000/api/config/schedules
```

See [API Documentation](./packages/api/README.md) for complete endpoint reference.

## 🎨 Dashboard

**Access at**: `http://localhost:8080`

### Features
- Real-time agent status monitoring (green/yellow/red indicators)
- System health score (0-100) updated every 5 seconds
- Cost tracking by service and agent
- Performance metrics (success rate, execution time, memory)
- Real-time log viewer with filtering
- Manual agent triggers and controls
- Approval workflow management
- Quick actions panel

### Visualization
- Color scheme: Plum (#36013f) primary, Gold (#e0cd67) accent
- Responsive design for desktop and tablet
- Auto-refreshing metrics
- Historical data charts

## 🐳 Docker Infrastructure

| Service | Port | Image | Purpose |
|---------|------|-------|---------|
| API | 3000 | Node.js 18 | Express REST server |
| Dashboard | 8080 | NGINX Alpine | Web UI |
| Database | 5432 | PostgreSQL 15 | Data persistence |
| Redis | 6379 | Redis 7 | Caching & queues |
| n8n | 5678 | n8n Latest | Workflow automation |
| Caddy | 80/443 | Caddy Latest | Reverse proxy & SSL |

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Execute command
docker-compose exec api npm list

# Rebuild images
docker-compose build --no-cache

# Scale service
docker-compose up -d --scale api=3
```

## 🔒 Security Features

- ✅ **HTTPS with Auto-SSL** (Caddy)
- ✅ **Security Headers** (CSP, X-Frame-Options, XSS Protection)
- ✅ **PII Redaction** (Automatic in logs)
- ✅ **AES-256 Encryption** (Sensitive data at rest)
- ✅ **Rate Limiting** (API throttling)
- ✅ **SQL Injection Prevention** (Parameterized queries)
- ✅ **CORS Protection** (Cross-origin requests)
- ✅ **API Authentication** (Bearer tokens)
- ✅ **Audit Logging** (All actions tracked)

## 📊 Monitoring & Metrics

### Health Checks
```bash
# Quick health
curl http://localhost:3000/health

# Detailed system status
curl http://localhost:3000/api/health/detailed

# Agent status
curl http://localhost:3000/api/agents

# System metrics
curl http://localhost:3000/api/metrics
```

### Performance Metrics
| Metric | Value |
|--------|-------|
| Memory (base) | 500MB |
| Memory (per agent) | +50MB |
| API response (90th %) | <100ms |
| Agent execution | 2-20 seconds |

### Log Access
```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs api

# Follow in real-time
docker-compose logs -f

# View errors only
docker-compose logs | grep ERROR
```

## 💻 Development

### Build & Run Locally

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@em/api

# Development mode
npm run dev

# Run tests
npm run test

# Lint code
npm run lint:fix
```

### Project Structure

```
em-ai-ecosystem/
├── packages/
│   ├── core/              # Shared utilities, types, services (9 services)
│   ├── orchestrator/      # Agent coordination (400+ lines)
│   ├── agents/            # 12 specialized agents
│   │   ├── daily-brief/       ├── inbox-assistant/
│   │   ├── calendar-optimizer/ ├── grant-researcher/
│   │   ├── voice-companion/   ├── relationship-tracker/
│   │   └── ... 6 more agents
│   ├── api/               # Express REST server (3000+ lines)
│   └── dashboard/         # Web UI (2500+ lines)
├── db/
│   ├── init.sql           # Database schema
│   └── migrations/        # Schema updates
├── docker-compose.yml     # Service orchestration
├── scripts/
│   ├── setup.sh           # Initial setup
│   ├── deploy.sh          # Deployment
│   └── backup.sh          # Database backup
└── documentation/         # Complete guides
```

## 🚨 Troubleshooting

### API Not Responding
```bash
docker-compose ps api
docker-compose logs api
docker-compose restart api
curl http://localhost:3000/health
```

### Database Connection Error
```bash
docker-compose exec database psql -U elevated_movements -d em_ecosystem -c "SELECT 1"
docker-compose exec database psql -U elevated_movements -d em_ecosystem < db/init.sql
```

### High Memory Usage
```bash
docker-compose exec api node -e "console.log(process.memoryUsage())"
docker-compose restart api
docker system prune -a
```

### Service Won't Start
```bash
docker-compose logs <service>
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting) for comprehensive troubleshooting.

## 📈 Next Steps

1. **Deploy System**
   - Follow [Quick Start](#quick-start) above
   - Configure API keys in `.env`
   - Run `scripts/deploy.sh`

2. **Configure Integrations**
   - Set up Google Calendar OAuth
   - Configure OpenAI API keys
   - Set up Claude and ElevenLabs keys

3. **Customize for Founders**
   - Update founder preferences
   - Configure personalized schedules
   - Set financial allocations

4. **Deploy to Production**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Configure domain name and SSL
   - Set up monitoring and backups

5. **Monitor & Optimize**
   - Review cost reports
   - Tune agent configurations
   - Analyze performance metrics

## 📋 Pre-Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Setup script run (`scripts/setup.sh`)
- [ ] `.env` configured with API keys
- [ ] Deploy script run (`scripts/deploy.sh`)
- [ ] Dashboard accessible (`http://localhost:8080`)
- [ ] All services running (`docker-compose ps`)
- [ ] API responding (`curl http://localhost:3000/health`)
- [ ] Google integrations configured
- [ ] Founder preferences customized
- [ ] Backup procedures tested

## 📞 Support & Resources

For help:

1. **Check Documentation**: [SYSTEM_COMPLETE.md](./SYSTEM_COMPLETE.md), [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Review Logs**: `docker-compose logs -f`
3. **Test Health**: `curl http://localhost:3000/health`
4. **Check Endpoints**: See [API Documentation](./packages/api/README.md)

## 📝 License & Version

**Version**: v1.0.0
**Status**: ✅ Production Ready
**Build Date**: October 2025
**License**: Proprietary - Elevated Movements Foundation

---

## 🎉 What's Included

This complete ecosystem includes:

✅ **12 Specialized AI Agents** - Each with distinct business functions
✅ **Express REST API** - 30+ endpoints for complete control
✅ **Real-time Dashboard** - Health monitoring and cost tracking
✅ **Production Infrastructure** - Docker, PostgreSQL, Redis, Caddy
✅ **Comprehensive Documentation** - Architecture, deployment, operations
✅ **Type-Safe TypeScript** - Strict mode, 0 `any` types
✅ **Cost Tracking** - Real-time monitoring and forecasting
✅ **Security Hardening** - Encryption, CORS, rate limiting
✅ **Health Monitoring** - Continuous system checks
✅ **Approval Workflows** - Multi-level authorization
✅ **Setup & Deployment Scripts** - Fully automated
✅ **Complete Test Coverage** - Ready for production

---

**Ready to deploy?** Start with the [Quick Start](#quick-start) section.

**Want to learn more?** See [SYSTEM_COMPLETE.md](./SYSTEM_COMPLETE.md) for complete system documentation.

**Need help deploying?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment instructions.

Built with precision for Elevated Movements Foundation. A complete, production-grade AI executive assistant ecosystem.
