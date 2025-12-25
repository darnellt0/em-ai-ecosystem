# Elevated Movements AI Ecosystem - Developer Setup Guide

Quick reference for setting up the development environment for the EM AI Ecosystem.

## Prerequisites

- **Node.js**: v20.x or higher
- **Docker & Docker Compose**: Latest stable version
- **Git**: For version control
- **npm**: Comes with Node.js

## Quick Start

### Option A: Full Docker Stack (Recommended for Testing)

```bash
# 1. Clone the repository
git clone <repository-url>
cd em-ai-ecosystem

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d --build

# 4. Check health
curl http://localhost:3000/health

# 5. View logs
docker compose logs -f api
```

**Services Running:**
- API Server: http://localhost:3000
- PostgreSQL: localhost:5433 (external), 5432 (internal)
- Redis: localhost:6380 (external), 6379 (internal)
- n8n: http://localhost:5679

### Option B: Local Development (Faster Iteration)

```bash
# 1. Start only infrastructure services
docker compose up -d database redis

# 2. Copy and configure environment
cp .env.example .env.local
# Edit .env.local - use localhost with mapped ports:
# REDIS_URL=redis://localhost:6380
# DATABASE_URL=postgresql://elevated_movements:changeme@localhost:5433/em_ecosystem

# 3. Install dependencies
npm ci

# 4. Install API package dependencies
cd packages/api
npm ci

# 5. Run development server with auto-reload
npm run dev:watch

# Alternative: Standard dev mode
npm run dev
```

## Environment Configuration

### Docker Environment (.env)
Uses service names and internal ports:
```env
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://elevated_movements:changeme@database:5432/em_ecosystem
```

### Local Development (.env.local)
Uses localhost with mapped ports:
```env
REDIS_URL=redis://localhost:6380
DATABASE_URL=postgresql://elevated_movements:changeme@localhost:5433/em_ecosystem
```

## API Port Conflicts

If port **3000** is already in use on your machine, start the API on an alternate port:

```bash
# Run the API on port 3001 to avoid dashboard clashes
PORT=3001 npm -w packages/api run dev
```

## Development Scripts

```bash
# API Package (packages/api/)
npm run dev          # Start development server
npm run dev:watch    # Start with auto-reload
npm run build        # Build TypeScript to JavaScript
npm run typecheck    # Run type checking without building
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run clean        # Remove build artifacts
```

## Project Structure

```
em-ai-ecosystem/
├── packages/
│   ├── api/              # Main API server
│   │   ├── src/
│   │   │   ├── config/           # Configuration modules
│   │   │   ├── growth-agents/    # Growth agent system
│   │   │   ├── services/         # Business logic services
│   │   │   ├── routes/           # API routes
│   │   │   └── index.ts          # Entry point
│   │   ├── tests/        # Test files
│   │   └── dist/         # Compiled output
│   ├── orchestrator/     # Agent orchestration
│   └── agents/           # Agent implementations
├── .env.example          # Environment template
├── docker-compose.yml    # Docker services
├── Dockerfile            # Production Docker build
└── Dockerfile.optimized  # Multi-stage optimized build
```

## Common Tasks

### Running Tests

```bash
# Run all tests
cd packages/api
npm test

# Run specific test
npm test voice.router.spec.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Database Management

```bash
# Access PostgreSQL
docker compose exec database psql -U elevated_movements -d em_ecosystem

# Reset database (WARNING: Destroys data)
docker compose down -v
docker compose up -d database

# Backup database
docker compose exec database pg_dump -U elevated_movements em_ecosystem > backup.sql
```

### Redis Management

```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Flush all data (WARNING: Destroys data)
docker compose exec redis redis-cli FLUSHALL

# Monitor Redis commands
docker compose exec redis redis-cli MONITOR
```

### Debugging

```bash
# View API logs
docker compose logs -f api

# View all logs
docker compose logs -f

# Check service health
curl http://localhost:3000/health | jq

# Check container status
docker compose ps
```

## Troubleshooting

### Port Conflicts

If ports 3000, 5433, or 6380 are in use:

```bash
# Check what's using a port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Option 1: Stop conflicting service
# Option 2: Change ports in docker-compose.yml
```

### Redis Connection Errors

```
Error: connect ECONNREFUSED ::1:6379
```

**Solution**: Check your REDIS_URL configuration:
- **Docker**: Use `redis://redis:6379`
- **Local**: Use `redis://localhost:6380`

### Database Connection Errors

```
FATAL: database "elevated_movements" does not exist
```

**Solution**: Reset database volume:
```bash
docker compose down -v
docker compose up -d database
```

### TypeScript Errors

```bash
# Clean and rebuild
npm run clean
npm run build

# Run typecheck
npm run typecheck
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# For workspace packages
cd packages/api
rm -rf node_modules
npm ci
```

## Pre-commit Hooks

The project uses Husky for pre-commit hooks:

- **Type checking**: Ensures no TypeScript errors
- **Linting**: Checks code style

To bypass hooks (not recommended):
```bash
git commit --no-verify -m "message"
```

## Health Checks

The `/health` endpoint provides detailed system status:

```bash
curl http://localhost:3000/health | jq
```

Response includes:
- Overall status (healthy/degraded/unhealthy)
- Redis connectivity and response time
- Database connectivity and response time
- Memory usage
- System uptime

## CI/CD

GitHub Actions run on:
- Push to `main` or `claude/**` branches
- Pull requests to `main`

Pipeline includes:
- Type checking
- Linting
- Building
- Testing
- Docker image build
- Agent structure verification

## Additional Resources

- [Main README](./README.md) - Project overview
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [BullMQ Documentation](https://docs.bullmq.io/) - Job queue system

## Getting Help

- Check [GitHub Issues](https://github.com/your-org/em-ai-ecosystem/issues)
- Review logs: `docker compose logs -f api`
- Health check: `curl http://localhost:3000/health`
- Verify environment: Check `.env` file configuration

---

**Quick Reference Card**

```bash
# Start everything
docker compose up -d --build

# Start development (local)
docker compose up -d database redis
cd packages/api && npm run dev:watch

# Run tests
cd packages/api && npm test

# Check health
curl http://localhost:3000/health

# View logs
docker compose logs -f api

# Stop everything
docker compose down

# Reset everything
docker compose down -v && docker compose up -d --build
```
