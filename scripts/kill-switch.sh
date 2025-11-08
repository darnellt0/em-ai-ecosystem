#!/bin/bash
#
# Kill Switch Script for Elevated Movements AI Ecosystem
# Emergency stop for all services
#

set -e

echo "=== EMERGENCY KILL SWITCH ACTIVATED ==="
echo ""
echo "Stopping all services..."

# Stop Docker services if running
if command -v docker-compose &> /dev/null; then
    echo "Stopping Docker containers..."
    docker-compose down --remove-orphans
    echo "✓ Docker containers stopped"
fi

# Kill any running Node processes related to the project
echo "Stopping Node.js processes..."
pkill -f "node.*em-ai-ecosystem" || true
pkill -f "npm.*start" || true
echo "✓ Node.js processes stopped"

# Clear any locks
echo "Clearing lock files..."
find . -name "*.lock" -type f -delete || true
echo "✓ Lock files cleared"

echo ""
echo "=== All services stopped ==="
echo "To restart, run: npm run docker:up or npm run dev"
