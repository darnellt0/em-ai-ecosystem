#!/bin/bash
#
# Health Check Script for Elevated Movements AI Ecosystem
# Checks the health of all services and reports status
#

set -e

echo "=== Elevated Movements AI Ecosystem Health Check ==="
echo ""

# Check API health
echo "Checking API health..."
API_URL="${API_URL:-http://localhost:3000}"
if curl -sf "${API_URL}/health" > /dev/null 2>&1; then
    echo "✓ API is healthy"
else
    echo "✗ API is not responding"
    exit 1
fi

# Check if Docker services are running
if command -v docker-compose &> /dev/null; then
    echo ""
    echo "Checking Docker services..."
    if docker-compose ps | grep -q "Up"; then
        echo "✓ Docker services are running"
        docker-compose ps
    else
        echo "⚠ Docker services may not be running"
    fi
fi

# Check database connectivity
echo ""
echo "Checking database..."
if [ -n "$DATABASE_URL" ]; then
    echo "✓ DATABASE_URL is configured"
else
    echo "⚠ DATABASE_URL is not set"
fi

# Check required environment variables
echo ""
echo "Checking environment variables..."
REQUIRED_VARS=("OPENAI_API_KEY" "CLAUDE_API_KEY" "ELEVENLABS_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✓ $var is set"
    else
        echo "⚠ $var is not set"
    fi
done

echo ""
echo "=== Health Check Complete ==="
