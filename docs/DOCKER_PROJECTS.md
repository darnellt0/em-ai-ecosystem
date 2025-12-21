# Docker Compose Projects - EM AI Ecosystem

## Overview

This document explains how Docker Compose projects are organized in the EM AI Ecosystem and how to avoid confusion when multiple Docker projects are running on the same machine.

## Current Docker Projects on This Machine

### 1. EM AI Ecosystem (compassionate-pike)

**Project Name:** `compassionate-pike`
**Working Directory:** `C:\Users\darne\.claude-worktrees\em-ai-ecosystem\compassionate-pike`
**Compose File:** `docker-compose.yml`

**Containers:**
- `em-api` - API server (port 3000)
- `em-worker` - Background worker
- `em-dashboard` - Dashboard UI (port 3001)
- `em-database` - PostgreSQL database (port 5433 → 5432)
- `em-redis` - Redis cache (port 6380 → 6379)
- `em-n8n` - n8n workflow automation (port 5679 → 5678)
- `em-caddy` - Reverse proxy (ports 80, 443)

**Access:**
- Dashboard: http://localhost or http://localhost:3001
- API: http://localhost:3000
- n8n: http://localhost:5679

### 2. Standalone n8n (n8n-local)

**Project Name:** `n8n-local`
**Working Directory:** `C:\dev\n8n-local`
**Compose File:** `C:\dev\n8n-local\docker-compose.yml`

**Containers:**
- `n8n` - Standalone n8n instance (port 5678)

**Status:** This is a separate n8n installation NOT part of the EM stack.

### 3. Deal Scout

**Project Name:** `deal-scout`
**Working Directory:** Unknown (not part of EM stack)

**Containers:**
- `deal-scout-postgres-1` - PostgreSQL (port 5432)
- `deal-scout-redis-1` - Redis (port 6379)

**Status:** Separate project. Note port 5432 and 6379 are the standard defaults, which is why EM uses 5433 and 6380 to avoid collisions.

## Why `docker compose ps` Shows Nothing

When you run `docker compose ps` without specifying a project name, Docker Compose:

1. Looks for a `docker-compose.yml` in the current directory
2. Uses the directory name as the default project name
3. Only shows containers matching that project name

However, the EM containers were created with project name `compassionate-pike` (the git worktree name), not the directory name.

## How to View EM Containers

### Option 1: Use explicit project name (RECOMMENDED)

```powershell
# From any directory
docker compose -p compassionate-pike ps

# To see all services
docker compose -p compassionate-pike ps -a
```

### Option 2: Set COMPOSE_PROJECT_NAME environment variable

```powershell
# Set for current session
$env:COMPOSE_PROJECT_NAME = "compassionate-pike"

# Now regular commands work
docker compose ps
docker compose logs api
docker compose restart api
```

### Option 3: Navigate to correct directory

```powershell
cd C:\Users\darne\.claude-worktrees\em-ai-ecosystem\compassionate-pike

# Set project name for session
$env:COMPOSE_PROJECT_NAME = "compassionate-pike"

# Now commands work
docker compose ps
```

## Port Collision Avoidance

The EM stack uses non-standard ports to avoid conflicts with other Docker projects:

| Service | Standard Port | EM Port | Reason |
|---------|--------------|---------|---------|
| PostgreSQL | 5432 | 5433 | Avoid conflict with deal-scout-postgres |
| Redis | 6379 | 6380 | Avoid conflict with deal-scout-redis |
| n8n | 5678 | 5679 | Avoid conflict with standalone n8n |

## Identifying Container's Compose Project

To find which compose project a container belongs to:

```powershell
# Get project name
docker inspect <container-name> --format '{{index .Config.Labels "com.docker.compose.project"}}'

# Get full compose info
docker inspect <container-name> --format '{{json .Config.Labels}}' | ConvertFrom-Json |
  Select-Object -ExpandProperty * | Where-Object { $_.Name -like "*compose*" }
```

**Example:**
```powershell
PS> docker inspect em-api --format '{{index .Config.Labels "com.docker.compose.project"}}'
compassionate-pike

PS> docker inspect n8n --format '{{index .Config.Labels "com.docker.compose.project"}}'
n8n-local
```

## Common Docker Compose Commands

All commands should be run with `-p compassionate-pike` or after setting `$env:COMPOSE_PROJECT_NAME`:

```powershell
# Set project name for session
$env:COMPOSE_PROJECT_NAME = "compassionate-pike"

# View running services
docker compose ps

# View all services (including stopped)
docker compose ps -a

# View logs
docker compose logs -f api
docker compose logs -f --tail=100 api

# Restart a service
docker compose restart api

# Rebuild and restart a service
docker compose up -d --build api

# Stop all services
docker compose stop

# Start all services
docker compose start

# Stop and remove all containers
docker compose down

# Stop, remove containers, and remove volumes (DESTRUCTIVE)
docker compose down -v
```

## Managing Multiple n8n Instances

**EM n8n (em-n8n):**
- Port: 5679
- URL: http://localhost:5679
- Part of EM stack
- Managed via: `docker compose -p compassionate-pike`

**Standalone n8n:**
- Port: 5678
- URL: http://localhost:5678
- Separate installation at `C:\dev\n8n-local`
- Managed via: `docker compose -p n8n-local` (from `C:\dev\n8n-local`)

**Recommendation:** If you don't need the standalone n8n instance, stop and remove it to avoid confusion:

```powershell
# Navigate to n8n-local directory
cd C:\dev\n8n-local

# Stop and remove
docker compose down

# Or stop the container directly
docker stop n8n
docker rm n8n
```

## Cleanup Commands

### Remove Standalone n8n (if not needed)

```powershell
# Stop and remove container
docker stop n8n
docker rm n8n

# Optional: Remove unused n8n images
docker images | Select-String "n8nio/n8n" | ForEach-Object {
  $imageId = ($_ -split '\s+')[2]
  docker rmi $imageId
}
```

### Remove Orphaned Containers

```powershell
# Find containers not part of any compose project
docker ps -a --filter "label!=com.docker.compose.project"

# Or find containers from old/removed projects
docker ps -a --format "table {{.Names}}\t{{.Label `"com.docker.compose.project`"}}"
```

## Troubleshooting

### Issue: `docker compose ps` shows nothing

**Solution:** Use explicit project name:
```powershell
docker compose -p compassionate-pike ps
```

Or set environment variable:
```powershell
$env:COMPOSE_PROJECT_NAME = "compassionate-pike"
docker compose ps
```

### Issue: Port already in use

**Cause:** Another container is using the same port.

**Solution:** Find the conflicting container:
```powershell
# Find what's using port 5678
docker ps --format "table {{.Names}}\t{{.Ports}}" | Select-String "5678"

# Check all projects
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Label `"com.docker.compose.project`"}}"
```

### Issue: Container name conflict

**Cause:** Container with same name already exists.

**Solution:** Remove the old container:
```powershell
docker stop <container-name>
docker rm <container-name>
```

## Best Practices

1. **Always use explicit project names** when working with multiple compose projects
2. **Set COMPOSE_PROJECT_NAME** in your PowerShell profile for EM development sessions
3. **Use unique port mappings** for each project to avoid conflicts
4. **Document your Docker projects** and their port usage
5. **Clean up unused containers** regularly to reduce confusion

## Quick Reference

### EM Stack Management

```powershell
# Set project name (add to PowerShell profile for persistence)
$env:COMPOSE_PROJECT_NAME = "compassionate-pike"

# Navigate to project
cd C:\Users\darne\.claude-worktrees\em-ai-ecosystem\compassionate-pike

# View status
docker compose ps

# Restart API after changes
docker compose restart api

# Rebuild API after code changes
docker compose up -d --build api

# View logs
docker compose logs -f api

# Full restart (all services)
docker compose down && docker compose up -d
```

### Quick Container Status

```powershell
# View all running containers with their projects
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Label `"com.docker.compose.project`"}}"

# View only EM containers
docker ps --filter "name=em-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Version History

- **2025-12-20**: Initial documentation
  - Identified three Docker Compose projects on this machine
  - Documented port collision avoidance strategy
  - Explained why `docker compose ps` shows nothing without project name
