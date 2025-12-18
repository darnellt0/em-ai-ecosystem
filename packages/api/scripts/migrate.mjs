#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, '../migrations');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[migrate] DATABASE_URL is required');
  process.exit(1);
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const res = await client.query('SELECT filename FROM schema_migrations');
  return new Set(res.rows.map((r) => r.filename));
}

function listMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function applyMigration(client, filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`[migrate] Applying ${filename}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename]);
    await client.query('COMMIT');
    console.log(`[migrate] Applied ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await ensureTrackingTable(client);
    const applied = await getApplied(client);
    const all = listMigrations();
    for (const file of all) {
      if (applied.has(file)) continue;
      await applyMigration(client, file);
    }
    console.log('[migrate] Complete');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});
