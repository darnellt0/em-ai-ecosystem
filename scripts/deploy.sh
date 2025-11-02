#!/bin/bash

# Deployment script for Elevated Movements AI Ecosystem

set -e

echo "🚀 Deploying Elevated Movements AI Ecosystem"
echo "==========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run setup.sh first."
    exit 1
fi

# Load environment
source .env

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down --remove-orphans || true

# Step 2: Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
docker-compose pull || true

# Step 3: Build images
echo -e "${YELLOW}Building images...${NC}"
docker-compose build --no-cache || true

# Step 4: Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Step 5: Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    echo "Waiting for API... ($attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}❌ API failed to start${NC}"
    docker-compose logs api
    exit 1
fi

# Step 6: Verify all services
echo -e "${YELLOW}Verifying services...${NC}"

services=("api" "dashboard" "database" "redis" "n8n")
failed=0

for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up"; then
        echo -e "${GREEN}✓ $service is running${NC}"
    else
        echo -e "${RED}✗ $service is not running${NC}"
        failed=$((failed + 1))
    fi
done

# Step 7: Display summary
echo ""
echo -e "${GREEN}==========================================="
echo "✓ Deployment Complete!"
echo "==========================================${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo "All services are running:"
    echo "  🌐 API: http://localhost:3000"
    echo "  📊 Dashboard: http://localhost:8080"
    echo "  🔄 n8n Workflows: http://localhost:5678"
    echo "  🗄️  Database: postgres://localhost:5432"
    echo "  💾 Redis: redis://localhost:6379"
    echo ""
    echo "Admin credentials:"
    echo "  Database: elevated_movements / (from .env)"
    echo "  n8n: admin / (from .env)"
    echo ""
else
    echo -e "${RED}⚠️  $failed service(s) failed to start${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

# Step 8: Show logs
echo -e "${YELLOW}Recent logs:${NC}"
docker-compose logs --tail=10
