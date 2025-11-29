#!/bin/bash

###############################################################################
# Backup Verification and Restore Testing Script
# Elevated Movements AI Ecosystem
#
# Purpose: Verify backup integrity and test restore procedures
# Usage: ./scripts/verify-backup-restore.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================================================="
echo "Backup Verification and Restore Test"
echo "Elevated Movements AI Ecosystem"
echo "=========================================================================="
echo ""

# Check prerequisites
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
    exit 1
fi

# Extract database name from URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
TEST_DB_NAME="${DB_NAME}_test_restore"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  Backup Directory: $BACKUP_DIR"
echo "  Test Database: $TEST_DB_NAME"
echo ""

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

##############################################################################
# Step 1: Create Backup
##############################################################################

echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
pg_dump $DATABASE_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

echo ""

##############################################################################
# Step 2: Verify Backup Integrity
##############################################################################

echo -e "${YELLOW}Step 2: Verifying backup integrity...${NC}"

# Check if file is valid SQL
if file $BACKUP_FILE | grep -q "ASCII text"; then
    echo -e "${GREEN}✓ Backup file format is valid${NC}"
else
    echo -e "${RED}✗ Backup file format is invalid${NC}"
    exit 1
fi

# Check for common table patterns
TABLES_FOUND=$(grep -c "CREATE TABLE" $BACKUP_FILE || true)
if [ "$TABLES_FOUND" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $TABLES_FOUND table definitions${NC}"
else
    echo -e "${YELLOW}⚠ Warning: No CREATE TABLE statements found${NC}"
fi

# Check for data inserts
INSERTS_FOUND=$(grep -c "INSERT INTO" $BACKUP_FILE || true)
if [ "$INSERTS_FOUND" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $INSERTS_FOUND INSERT statements${NC}"
else
    echo -e "${YELLOW}⚠ Warning: No INSERT statements found${NC}"
fi

echo ""

##############################################################################
# Step 3: Test Restore (Optional - requires confirmation)
##############################################################################

echo -e "${YELLOW}Step 3: Test restore procedure${NC}"
echo ""
echo -e "${RED}WARNING: This will create a test database and restore from backup.${NC}"
echo "Test database name: $TEST_DB_NAME"
echo ""
read -p "Do you want to proceed with restore test? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Skipping restore test${NC}"
    echo ""
    echo -e "${GREEN}=========================================================================="
    echo "Backup verification complete"
    echo "=========================================================================="
    echo "Backup file: $BACKUP_FILE"
    echo "Status: Valid backup created and verified"
    echo ""
    exit 0
fi

# Create test database
echo -e "${YELLOW}Creating test database...${NC}"
createdb -h $(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p') \
         -U $(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p') \
         $TEST_DB_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database created${NC}"
else
    echo -e "${RED}✗ Failed to create test database${NC}"
    exit 1
fi

# Restore backup to test database
echo -e "${YELLOW}Restoring backup to test database...${NC}"
TEST_DB_URL=$(echo $DATABASE_URL | sed "s/${DB_NAME}/${TEST_DB_NAME}/")
psql $TEST_DB_URL < $BACKUP_FILE > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup restored successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    # Cleanup
    dropdb -h $(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p') \
           -U $(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p') \
           $TEST_DB_NAME 2>/dev/null || true
    exit 1
fi

# Verify restored data
echo -e "${YELLOW}Verifying restored data...${NC}"

# Count tables
TABLE_COUNT=$(psql $TEST_DB_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
echo "  Tables restored: $TABLE_COUNT"

# Check if we can query data
psql $TEST_DB_URL -c "\dt" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Can query restored database${NC}"
else
    echo -e "${RED}✗ Cannot query restored database${NC}"
fi

# Cleanup test database
echo -e "${YELLOW}Cleaning up test database...${NC}"
dropdb -h $(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p') \
       -U $(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p') \
       $TEST_DB_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database removed${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Failed to remove test database${NC}"
fi

echo ""

##############################################################################
# Summary
##############################################################################

echo -e "${GREEN}=========================================================================="
echo "Backup Verification Complete"
echo "=========================================================================="
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"
echo "Tables: $TABLES_FOUND"
echo "Inserts: $INSERTS_FOUND"
echo "Restore test: Successful"
echo ""
echo "Recommendation: Store this backup securely in multiple locations"
echo "=========================================================================="${NC}
