# Deployment Guide - Elevated Movements AI Ecosystem

Complete guide for deploying the Elevated Movements AI Executive Assistant Ecosystem.

## Prerequisites

- Docker 20.10+
- Docker Compose 1.29+
- Node.js 18+
- 4GB RAM minimum
- 10GB disk space

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/darnellt0/em-ai-ecosystem.git
cd em-ai-ecosystem
```

### 2. Run Setup
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Configure API Keys
Edit `.env`:
```bash
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-...
ELEVENLABS_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### 4. Deploy
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 5. Access Dashboard
Open `http://localhost:8080`

## Detailed Deployment

### Docker Compose Services

#### API Server
- **Image**: Custom Node.js + TypeScript
- **Port**: 3000
- **Health**: http://localhost:3000/health
- **Volumes**: logs, data

#### Dashboard
- **Image**: NGINX
- **Port**: 8080
- **Files**: Static HTML/JS
- **Cache**: No cache

#### Database
- **Image**: PostgreSQL 15
- **Port**: 5432
- **Credentials**: .env
- **Volume**: postgres_data
- **Schemas**: Auto-init from db/init.sql

#### Redis
- **Image**: Redis 7
- **Port**: 6379
- **Volume**: redis_data
- **Purpose**: Caching, job queue

#### n8n
- **Image**: n8n latest
- **Port**: 5678
- **Auth**: .env credentials
- **Volume**: n8n_data
- **Purpose**: Workflow automation

#### Caddy
- **Image**: Caddy latest
- **Port**: 80, 443
- **Config**: Caddyfile
- **Purpose**: Reverse proxy, SSL

## Environment Variables

```env
# Core
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@database:5432/em_ecosystem

# Cache
REDIS_URL=redis://redis:6379

# API Keys (replace with actual keys)
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Google Auth
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Production Deployment

### Using Docker Compose
```bash
docker-compose -f docker-compose.yml up -d
```

### Using AWS
```bash
# Build Docker image
docker build -f Dockerfile.api -t em-api:latest .

# Push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com
docker tag em-api:latest <account>.dkr.ecr.us-west-2.amazonaws.com/em-api:latest
docker push <account>.dkr.ecr.us-west-2.amazonaws.com/em-api:latest

# Deploy to ECS/EKS
# ... (see AWS documentation)
```

## Monitoring

### Health Checks
```bash
# API health
curl http://localhost:3000/health

# System health
curl http://localhost:3000/api/health/detailed

# Agent status
curl http://localhost:3000/api/agents

# Metrics
curl http://localhost:3000/api/metrics
```

### Logs
```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# API logs
docker-compose logs api

# Database logs
docker-compose logs database
```

## Scaling

### Horizontal Scaling
```bash
# Scale API service
docker-compose up -d --scale api=3

# Use load balancer (Caddy configured)
```

### Vertical Scaling
- Increase memory limit in docker-compose.yml
- Increase CPU shares in docker-compose.yml

## Backup & Recovery

### Backup Database
```bash
docker-compose exec database pg_dump -U elevated_movements em_ecosystem > backup.sql
```

### Restore Database
```bash
docker-compose exec -T database psql -U elevated_movements em_ecosystem < backup.sql
```

## Troubleshooting

### API Not Responding
```bash
# Check container status
docker-compose ps api

# View logs
docker-compose logs api

# Restart
docker-compose restart api
```

### Database Connection Error
```bash
# Check database
docker-compose ps database

# Check credentials
docker-compose exec database psql -U elevated_movements -d em_ecosystem -c "SELECT 1"

# Reinitialize
docker-compose exec database psql -U elevated_movements -d em_ecosystem < db/init.sql
```

### High Memory Usage
```bash
# Check memory
docker-compose exec api node -e "console.log(process.memoryUsage())"

# Restart service
docker-compose restart api

# Check for leaks
docker system prune -a
```

## Security

### Change Default Passwords
```bash
# Edit .env
POSTGRES_PASSWORD=strong-password-here
N8N_BASIC_AUTH_PASSWORD=strong-password-here
```

### Enable HTTPS
```bash
# Edit Caddyfile
your-domain.com {
  reverse_proxy api:3000
}

# Run with auto-HTTPS
docker-compose up -d
```

### API Authentication
```bash
# Add to API
Authorization: Bearer YOUR_TOKEN
```

## Maintenance

### Regular Tasks
- Daily: Check logs
- Weekly: Verify backups
- Monthly: Update dependencies
- Quarterly: Security audit

### Update Procedure
```bash
# 1. Backup
./scripts/backup.sh

# 2. Stop services
docker-compose down

# 3. Pull updates
git pull origin main

# 4. Build new images
docker-compose build

# 5. Start services
docker-compose up -d

# 6. Verify
curl http://localhost:3000/health
```

## Cost Optimization

### Reduce Resource Usage
- Use Alpine images (Docker)
- Enable caching (Redis)
- Compress logs
- Archive old data

### Monitor Costs
```bash
# View API usage
curl http://localhost:3000/api/costs/by-service

# Forecast costs
curl http://localhost:3000/api/costs/forecast?days=30
```

## Support

For issues, check:
1. Logs: `docker-compose logs`
2. Documentation: See README files
3. Test endpoints: Use curl or Postman
4. Check health: `curl http://localhost:3000/health`

---

**Status**: Production-ready | **Last Updated**: October 2025
