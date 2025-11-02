#!/bin/bash

# Backup script for Elevated Movements AI Ecosystem

set -e

echo "📦 Backing up Elevated Movements AI Ecosystem"
echo "==========================================="

# Create backups directory
mkdir -p backups

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
echo "Backing up database..."
docker-compose exec -T database pg_dump -U elevated_movements em_ecosystem > "backups/database_${TIMESTAMP}.sql"
echo "✓ Database backed up to backups/database_${TIMESTAMP}.sql"

# Backup volumes
echo "Backing up volumes..."
docker run --rm -v em-ai-ecosystem_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  busybox tar czf "/backup/postgres_volume_${TIMESTAMP}.tar.gz" /data
echo "✓ PostgreSQL volume backed up"

docker run --rm -v em-ai-ecosystem_redis_data:/data \
  -v $(pwd)/backups:/backup \
  busybox tar czf "/backup/redis_volume_${TIMESTAMP}.tar.gz" /data
echo "✓ Redis volume backed up"

# Backup application data
echo "Backing up application data..."
tar -czf "backups/app_data_${TIMESTAMP}.tar.gz" data/ logs/ 2>/dev/null || true
echo "✓ Application data backed up"

echo ""
echo "✓ Backup Complete!"
echo "All backups saved to: backups/"
echo ""
