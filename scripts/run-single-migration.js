#!/usr/bin/env node
/**
 * Run a single database migration
 * Usage: node scripts/run-single-migration.js <migration-file-name>
 */

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSingleMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Please provide a migration file name');
    console.error('Usage: node scripts/run-single-migration.js <migration-file-name>');
    process.exit(1);
  }

  const host = process.env.POSTGRES_HOST;
  const database = process.env.POSTGRES_DATABASE;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    console.error('❌ Missing database credentials!');
    console.error('Required: POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD');
    process.exit(1);
  }

  const client = new Client({
    host,
    database,
    user,
    password,
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const filePath = path.join(migrationsDir, migrationFile);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`\n📝 Running migration: ${migrationFile}\n`);

    await client.query(sql);
    console.log(`✅ ${migrationFile} completed successfully\n`);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

runSingleMigration();
