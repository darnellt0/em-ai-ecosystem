# Docker Setup Task - Fix API Container Startup

## Current Status
The `em-api` container is failing to start with the following error:
```
Error: Package subpath './dispatcher' is not defined by "exports"
in /app/node_modules/@em/orchestrator/package.json
```

## Root Causes Identified
1. **Orchestrator package missing dispatcher export** - FIXED in commit `dd42389`
2. **Docker builds using cached layers** - Not picking up latest changes
3. **Container immediately exits** - No logs shown when running

## Required Fixes

### Priority 1: Verify Latest Code is Present
```bash
# Check current commit
git log --oneline -1
# Should show: dd42389 fix(orchestrator): add dispatcher subpath export

# Verify orchestrator package.json has dispatcher export
cat packages/orchestrator/package.json | grep -A 5 '"exports"'
# Should show both "." and "./dispatcher" exports
```

### Priority 2: Ensure Clean Docker Build
The Dockerfile at the root includes these critical steps:
1. Copy package.json files
2. Install dependencies with `npm ci`
3. **Build TypeScript**: `RUN cd packages/api && npm run build`
4. Create non-root user
5. Run compiled code: `CMD ["node", "packages/api/dist/index.js"]`

**Verify the build completes all steps:**
```bash
# Force clean rebuild (no cache)
docker compose build --no-cache --progress=plain api 2>&1 | tee /tmp/build.log

# Check for critical steps in build log
grep "npm run build" /tmp/build.log
grep "Successfully tagged" /tmp/build.log
```

### Priority 3: Fix Common Build Issues

**If build fails at `npm run build`:**
- Check if `packages/api/tsconfig.json` exists
- Check if all TypeScript dependencies are installed
- Look for TypeScript compilation errors in build output

**If build succeeds but container exits immediately:**
```bash
# Check what's in the container
docker compose run --rm api ls -la packages/api/dist/
# Should see compiled .js files including index.js

# Try running manually to see error
docker compose run --rm api node packages/api/dist/index.js
```

### Priority 4: Verify Environment Variables
The container needs these environment variables (from docker-compose.yml):
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_URL=postgresql://postgres:postgres@database:5432/elevated_movements
  - REDIS_URL=redis://redis:6379
  - OPENAI_API_KEY=${OPENAI_API_KEY}
  - CLAUDE_API_KEY=${CLAUDE_API_KEY}
```

**Check if .env file exists and has required keys:**
```bash
test -f .env && echo ".env exists" || echo ".env missing - copy from .env.example"
```

## Expected Successful Startup Logs
```
✅ Agent registry validation passed
✅ Elevated Movements AI Ecosystem API Server
   Port: 3000
   Environment: production
   Status: Running

📊 DASHBOARD ENDPOINTS:
   GET /health                        - Health check
   ...
```

## Testing After Fix

### 1. Container Status
```bash
docker compose ps
# em-api should show "Up" status, not "Restarting" or "Exit"
```

### 2. Health Check
```bash
curl http://localhost:3000/health
# Should return JSON with status: "healthy" or "degraded"
# Should NOT return connection refused
```

### 3. Redis Connection
```bash
# Check health endpoint shows Redis is "up"
curl http://localhost:3000/health | jq '.checks.redis.status'
# Expected: "up"
```

### 4. Database Connection
```bash
# Check health endpoint shows database is "up"
curl http://localhost:3000/health | jq '.checks.database.status'
# Expected: "up"
```

## Acceptance Criteria

- [ ] `git log -1` shows commit dd42389 or later
- [ ] `docker compose build --no-cache api` completes successfully
- [ ] Build log shows "Building TypeScript for production" step
- [ ] `docker compose up -d` starts all services
- [ ] `docker compose ps` shows `em-api` with status "Up"
- [ ] `docker compose logs api` shows successful startup (no errors)
- [ ] `curl http://localhost:3000/health` returns HTTP 200
- [ ] Health check shows `redis.status: "up"`
- [ ] Health check shows `database.status: "up"`
- [ ] No "ERR_PACKAGE_PATH_NOT_EXPORTED" errors in logs
- [ ] No "ECONNREFUSED" Redis errors in logs

## Common Issues and Solutions

### Issue: "dispatcher not defined by exports"
**Solution:** Ensure commit dd42389 is pulled and rebuild without cache

### Issue: "Cannot find module 'packages/api/dist/index.js'"
**Solution:** The TypeScript build step failed - check `npm run build` in Dockerfile

### Issue: "ECONNREFUSED 127.0.0.1:6379"
**Solution:** Container is using wrong Redis URL - check REDIS_URL=redis://redis:6379

### Issue: Build uses old cached layers
**Solution:** Always use `--no-cache` flag: `docker compose build --no-cache`

### Issue: Container exits immediately with no logs
**Solution:** Run manually to see error: `docker compose run --rm api node packages/api/dist/index.js`

## Files to Check

1. **packages/orchestrator/package.json** - Should have dispatcher export
2. **Dockerfile** - Should have `npm run build` step
3. **docker-compose.yml** - Should have correct REDIS_URL and DATABASE_URL
4. **.env** - Should exist and have required API keys
5. **packages/api/dist/index.js** - Should exist after build

## Steps to Execute

```bash
# 1. Verify code is up to date
git pull
git log --oneline -5

# 2. Stop everything
docker compose down -v

# 3. Clean rebuild
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Watch logs for successful startup
docker compose logs -f api

# 6. Test health endpoint
curl http://localhost:3000/health | jq

# 7. Verify all checks pass
docker compose ps  # All should be "Up"
```

## Success Indicators

When everything works, you should see:
1. ✅ All containers running (not restarting)
2. ✅ API logs show "Agent registry validation passed"
3. ✅ API logs show "Server listening on port 3000"
4. ✅ Health endpoint returns `status: "healthy"`
5. ✅ Health endpoint shows `redis.status: "up"`
6. ✅ Health endpoint shows `database.status: "up"`
7. ✅ No errors in any container logs

---

**Priority:** Critical - Blocking Docker development workflow
**Branch:** `claude/setup-docker-services-at8vL`
**Related Commits:** dd42389, 1a7a16c, b9f126a
