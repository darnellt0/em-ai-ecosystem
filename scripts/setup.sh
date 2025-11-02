#!/bin/bash

# Elevated Movements AI Ecosystem Setup Script

set -e

echo "🚀 Elevated Movements AI Ecosystem - Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs data db

# Create environment file
echo -e "${YELLOW}Creating .env file...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo "⚠️  Update .env with your API keys before running deploy"
else
    echo "⚠️  .env file already exists"
fi

# Pull images
echo -e "${YELLOW}Pulling Docker images...${NC}"
docker-compose pull || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build || true

# Create initial containers (don't start yet)
echo -e "${YELLOW}Creating containers...${NC}"
docker-compose up -d --no-start || true

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Run: chmod +x scripts/deploy.sh"
echo "3. Run: ./scripts/deploy.sh"
echo "4. Visit: http://localhost:8080"
echo ""
echo "Services will be available at:"
echo "  - API: http://localhost:3000/api"
echo "  - Dashboard: http://localhost:8080"
echo "  - n8n: http://localhost:5678"
echo ""
