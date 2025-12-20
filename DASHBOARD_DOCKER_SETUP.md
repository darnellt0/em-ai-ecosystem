# Dashboard Docker Service Setup

## Overview

The dashboard has been added as a Docker service! Now you can run the entire Elevated Movements AI Ecosystem, including the web dashboard, using Docker Compose.

## What Changed

### New Files Created

1. **`packages/dashboard/Dockerfile`** - Multi-stage Docker build for the Next.js dashboard
2. **`packages/dashboard/.dockerignore`** - Optimizes Docker builds by excluding unnecessary files
3. **Updated `packages/dashboard/next.config.mjs`** - Added `output: 'standalone'` for Docker compatibility

### Modified Files

1. **`docker-compose.yml`** - Added dashboard service
2. **`packages/dashboard/.env.example`** - Updated environment variable documentation

## Docker Compose Services

Your system now runs **7 services**:

| Service | Port | Description |
|---------|------|-------------|
| **api** | 3000 | Express API with Voice & AI Agents |
| **dashboard** | 3001 | Next.js Web Dashboard |
| **database** | 5433 | PostgreSQL Database |
| **redis** | 6380 | Redis Cache |
| **worker** | - | BullMQ Job Worker |
| **n8n** | 5679 | Workflow Automation |
| **caddy** | 80, 443 | Reverse Proxy |

## How to Use

### Starting Everything

```powershell
# Stop existing containers
docker compose down

# Build and start all services (including dashboard)
docker compose up -d --build

# Or build just the dashboard
docker compose up -d --build dashboard
```

### Accessing the Dashboard

Once running, open your browser to:

**http://localhost:3001**

The dashboard will automatically connect to the API at `http://localhost:3000`

### Viewing Logs

```powershell
# View dashboard logs
docker compose logs -f dashboard

# View all service logs
docker compose logs -f
```

### Checking Status

```powershell
# Check all containers
docker compose ps

# Should show dashboard as "Up"
```

## Dashboard Features

When you access http://localhost:3001, you'll have access to:

- **Home** (`/`) - System overview
- **AI Agents** (`/agents`) - View all 12 AI agents
- **Executive Admin**
  - P0 Priority Journal (`/exec-admin/p0`)
  - Daily Brief (`/exec-admin/daily-brief`)
  - Journal Entries (`/exec-admin/journal`)
- **Growth Agents** (`/agents/growth`) - Growth automation controls
- **Tools**
  - Voice Growth (`/tools/voice-growth`)
  - Content Pipeline (`/tools/content-pipeline`)
  - Actions (`/tools/actions`)

## Architecture

### How It Works

1. **Dashboard Container** runs Next.js on port 3001
2. **API Container** runs Express on port 3000
3. Dashboard makes API calls to `http://localhost:3000` (from the host browser)
4. Both containers are on the `em-network` Docker network

### Network Flow

```
Browser (You)
    ↓
    ├─→ http://localhost:3001 → Dashboard Container (Next.js)
    └─→ http://localhost:3000 → API Container (Express)
```

The dashboard is a client-side application, so API calls happen from your browser to `localhost:3000`, not from inside the Docker network.

## Environment Variables

The dashboard uses these environment variables (set in docker-compose.yml):

```yaml
NODE_ENV=production                      # Production mode
PORT=3001                                # Dashboard port
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000  # API URL for browser
```

## Troubleshooting

### Dashboard Container Not Starting

```powershell
# Check logs
docker compose logs dashboard

# Rebuild without cache
docker compose build --no-cache dashboard
docker compose up -d dashboard
```

### Dashboard Shows "Cannot Connect to API"

1. Verify API is running:
   ```powershell
   curl http://localhost:3000/health
   ```

2. Check browser console for CORS errors

3. Verify environment variables:
   ```powershell
   docker compose exec dashboard env | grep NEXT_PUBLIC
   ```

### Build Errors

If you see build errors:

```powershell
# Clean everything
docker compose down -v
docker system prune -f

# Rebuild
docker compose build --no-cache
docker compose up -d
```

## Development vs Production

### Development (Local)

```powershell
cd packages/dashboard
npm run dev
# Runs on http://localhost:3000 with hot reload
```

### Production (Docker)

```powershell
docker compose up -d dashboard
# Runs on http://localhost:3001 as optimized build
```

## Quick Commands Reference

```powershell
# Start dashboard only
docker compose up -d dashboard

# Rebuild and restart dashboard
docker compose up -d --build dashboard

# Stop dashboard
docker compose stop dashboard

# View dashboard logs
docker compose logs -f dashboard

# Restart dashboard
docker compose restart dashboard

# Remove dashboard container
docker compose rm -f dashboard
```

## Build Details

The dashboard Dockerfile uses a **3-stage build**:

1. **deps** - Install npm dependencies
2. **builder** - Build Next.js application with standalone output
3. **runner** - Minimal production image with only necessary files

This results in a small, optimized image (~150MB vs ~1GB+ for development).

## Next Steps

1. Access the dashboard at http://localhost:3001
2. Explore the AI agents and tools
3. Test the P0 Journal and Daily Brief features
4. Monitor system health and metrics

---

**All services are now Dockerized!** 🎉

You can start the entire Elevated Movements AI Ecosystem with a single command:

```powershell
docker compose up -d
```

Then access:
- Dashboard: http://localhost:3001
- API: http://localhost:3000
- n8n: http://localhost:5679
