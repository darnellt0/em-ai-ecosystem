# EM-AI Ecosystem - Production Deployment Guide

## Prerequisites

- Node.js 20+
- Docker Desktop
- PowerShell 7+
- Git

## Quick Start

### 1. Configure Environment

1. Copy and edit the production environment file:
   ```powershell
   # Edit .env.production with your API keys
   notepad .env.production
   ```

2. Add your Google service account credentials:
   ```powershell
   # Copy your downloaded JSON to:
   credentials/google-service-account.json
   ```

### 2. Start Production

```powershell
.\scripts\start-prod.ps1
```

### 3. Verify Health

```powershell
.\scripts\health-monitor.ps1
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3001 | Main API server |
| N8N | http://localhost:5678 | Workflow automation |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & queues |

## Daily Brief Automation

### Option A: Windows Task Scheduler

```powershell
# Run as Administrator
.\scripts\setup-scheduled-tasks.ps1
```

### Option B: N8N Workflow

1. Open N8N: http://localhost:5678
2. Import workflow: n8n/workflows/daily-brief.json
3. Activate the workflow

## Endpoints

### Health Check
```bash
POST http://localhost:3001/api/exec-admin/dispatch
{"intent": "health_check", "payload": {}}
```

### Daily Brief
```bash
POST http://localhost:3001/api/exec-admin/dispatch
{"intent": "daily_brief", "payload": {"userId": "darnell@elevatedmovements.com"}}
```

### Voice Duplex
```bash
POST http://localhost:3001/api/voice/duplex
# Multipart form with audio file
```

## Logs

- API logs: `./logs/em-ecosystem.log`
- Daily Brief logs: `./logs/daily-brief.log`
- Docker logs: `docker-compose logs -f`

## Troubleshooting

### API not responding
```powershell
docker-compose restart api
docker-compose logs api
```

### Database connection failed
```powershell
docker-compose restart postgres
docker-compose logs postgres
```

### N8N workflows not triggering
1. Check N8N is running: http://localhost:5678
2. Verify workflow is activated
3. Check N8N logs: `docker-compose logs n8n`

## Maintenance

### Backup Database
```powershell
docker exec em-postgres pg_dump -U emadmin em_ecosystem > backup.sql
```

### Update System
```powershell
git pull origin main
docker-compose build api
docker-compose up -d api
```

### View Resource Usage
```powershell
docker stats
```
