# Docker Development (API-first)

Use the Dockerized API as the canonical runtime. Host `node_modules` and `dist` are excluded from the build context so Windows file locks cannot break the image build.

## Build & Run (API on port 3000)
```powershell
cd C:\dev\elevated-movements\em-ai-ecosystem
docker compose down
docker compose build --no-cache api
docker compose up -d api
docker compose logs -f api
```

### Quick endpoint verification (PowerShell)
```powershell
pwsh ./scripts/verify-docker-endpoints.ps1
```

## Verify endpoints (PowerShell)
```powershell
# Health
Invoke-RestMethod http://localhost:3000/health

# Registry
Invoke-RestMethod http://localhost:3000/api/agents/registry

# Actions pending
Invoke-RestMethod http://localhost:3000/api/actions/pending

# P0 Daily Focus
Invoke-RestMethod -Uri "http://localhost:3000/api/exec-admin/p0/daily-focus" `
  -Method Post -ContentType "application/json" `
  -Body '{"userId":"darnell"}'

# P1 example
Invoke-RestMethod -Uri "http://localhost:3000/api/exec-admin/p1/run" `
  -Method Post -ContentType "application/json" `
  -Body '{"userId":"darnell","agentKey":"brand.storyteller.generate","input":{"topic":"Elevated Movements corporate partnerships"}}'
```

### Generate a PLAN-only content pack
```powershell
pwsh ./scripts/generate-content-pack.ps1

# Optional: approve+execute the first pending action in PLAN mode
pwsh ./scripts/generate-content-pack.ps1 -ApproveFirstOne
```

## If build still fails
- Confirm `.dockerignore` is applied: `docker build -f Dockerfile . --progress=plain`
- Look for any `node_modules` paths in the build context; they should be excluded.
- Ensure you are not bind-mounting host `node_modules` or `dist` in `docker-compose.yml`.
