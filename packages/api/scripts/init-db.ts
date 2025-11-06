#!/usr/bin/env ts-node

/**
 * Database Initialization Script
 * Runs migrations and sets up the database schema
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/em_ecosystem';

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Initializing database...');
    console.log(`📊 Database: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

    // Test connection
    console.log('\n1️⃣  Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Connection successful');

    // Check if tables already exist
    console.log('\n2️⃣  Checking existing tables...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log('   📋 Existing tables:', tablesResult.rows.map(r => r.table_name).join(', '));

      // Check if users table exists
      const hasUsers = tablesResult.rows.some(r => r.table_name === 'users');
      const hasSessions = tablesResult.rows.some(r => r.table_name === 'sessions');

      if (hasUsers && hasSessions) {
        console.log('   ⚠️  Authentication tables already exist. Skipping migration.');
        console.log('   💡 To recreate tables, drop them first: DROP TABLE sessions, users CASCADE;');
        return;
      }
    } else {
      console.log('   📋 No existing tables found');
    }

    // Run migration
    console.log('\n3️⃣  Running migration 001_create_auth_tables.sql...');
    const migrationPath = path.join(__dirname, '../migrations/001_create_auth_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migrationSQL);
    console.log('   ✅ Migration completed successfully');

    // Verify tables
    console.log('\n4️⃣  Verifying tables...');
    const verifyResult = await pool.query(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'sessions')
      ORDER BY table_name
    `);

    for (const row of verifyResult.rows) {
      console.log(`   ✅ Table '${row.table_name}' exists with ${row.column_count} columns`);
    }

    // Verify indexes
    console.log('\n5️⃣  Verifying indexes...');
    const indexesResult = await pool.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'sessions')
      ORDER BY tablename, indexname
    `);

    for (const row of indexesResult.rows) {
      console.log(`   ✅ Index '${row.indexname}' on table '${row.tablename}'`);
    }

    console.log('\n✅ Database initialization completed successfully!\n');
    console.log('📊 Database is ready for authentication');
    console.log('🚀 You can now start the API server\n');

  } catch (error: any) {
    console.error('\n❌ Database initialization failed:');
    console.error(`   Error: ${error.message}`);

    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }

    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }

    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check DATABASE_URL environment variable');
    console.error('   2. Ensure PostgreSQL is running');
    console.error('   3. Verify database exists and user has permissions');
    console.error('   4. Check if migrations have already been run\n');

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export default initializeDatabase;
