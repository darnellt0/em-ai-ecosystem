# Content Pipeline v1 (PLAN-only)

Generates a structured ContentPack from P0 + P1 and stores it on disk. Actions are planned (requiresApproval=true) and remain PLAN-only by default.

## Types
- ContentPack { packId, createdAt, userId, topic, assets[], plannedActionIds[], status }
- Assets cover linkedin, email, video_script, web_copy.

## Endpoints (API on port 3000)
- POST `/api/content/packs/generate`
  - Body: `{ "userId": "darnell", "topic": "...", "includeP0": true }`
  - Returns: `{ success: true, pack }`
- GET `/api/content/packs?limit=50`
- GET `/api/content/packs/:packId`

## Persistence
- Stored under `packages/api/.data/content-packs/` (JSON per pack) and `index.json` for listings.

## Safety
- All planned actions are requiresApproval=true and PLAN-only unless approvals/flags are enabled.
- No email/calendar/posts are executed by default.

## Dashboard
- Visit `/tools/content-pipeline` (dashboard) to generate, view, and download packs.

## Scripts (PowerShell)
```powershell
# Verify API endpoints (Docker API on 3000)
pwsh ./scripts/verify-docker-endpoints.ps1

# Generate a PLAN-only content pack
pwsh ./scripts/generate-content-pack.ps1

# Optional approve+execute first pending action in PLAN mode
pwsh ./scripts/generate-content-pack.ps1 -ApproveFirstOne
```
