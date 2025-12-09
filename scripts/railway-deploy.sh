#!/usr/bin/env bash
# Railway deployment helper for em-ai-ecosystem
# Usage:
#   ./scripts/railway-deploy.sh
#
# What it does:
# 1. Checks for Railway CLI
# 2. Logs in (if needed)
# 3. Links this repo to a Railway project (creates if missing)
# 4. Uses railway.toml + Dockerfile.production to deploy the API service

set -euo pipefail

PROJECT_NAME="em-ai-ecosystem"
# Optional: match whatever service name you used in railway.toml (if set)
# SERVICE_NAME="api"

echo "🚂 EM-AI Ecosystem – Railway Deployment"

# 0) Ensure we're in repo root
if [ ! -f "railway.toml" ]; then
  echo "❌ railway.toml not found. Run this from the em-ai-ecosystem root."
  exit 1
fi

# 1) Check Railway CLI
if ! command -v railway >/dev/null 2>&1; then
  echo "❌ Railway CLI not found."
  echo "   Install with: npm install -g @railway/cli"
  exit 1
fi

# 2) Login (no-op if already logged in)
echo "🔐 Checking Railway login status..."
railway status >/dev/null 2>&1 || railway login

# 3) Link or init project
echo "🔗 Linking to Railway project..."

# Try to link to an existing project; if that fails, init a new one
if ! railway link --project "$PROJECT_NAME" >/dev/null 2>&1; then
  echo "ℹ️ No existing project named '$PROJECT_NAME' found. Creating a new one..."
  railway init --name "$PROJECT_NAME"
fi

echo "✅ Project linked: $PROJECT_NAME"

# 4) Show current environment
echo "🌱 Current Railway environments:"
railway environments

echo
echo "⚠️ IMPORTANT: Make sure your production environment variables are set in Railway"
echo "   Use .env.production and docs/DEPLOYMENT_READINESS.md as your source of truth."
echo "   You can set variables via:"
echo "     railway variables set KEY=VALUE"
echo "   or via the Railway dashboard (Recommended for secrets)."
echo

read -p "Have you configured the necessary env vars in Railway? (y/N) " CONFIRM
if [[ "${CONFIRM:-n}" != "y" && "${CONFIRM:-n}" != "Y" ]]; then
  echo "❌ Aborting deploy. Configure env vars first, then re-run this script."
  exit 1
fi

# 5) Deploy using railway.toml + Dockerfile.production
echo "🚀 Deploying using railway.toml and Dockerfile.production..."

# If you have multiple services defined in railway.toml, you can narrow with:
#   railway up --service "$SERVICE_NAME"
# For now we let railway.toml drive it.
railway up

echo
echo "✅ Deployment triggered."
echo "   Check Railway dashboard for build logs and the public URL."
echo "   Once live, verify health endpoints (from DEPLOYMENT_READINESS.md):"
echo "     GET /api/health"
echo "     GET /api/orchestrator/health"
echo "     GET /api/orchestrator/agents/health"
echo "     POST /api/orchestrator/qa/phase6"
