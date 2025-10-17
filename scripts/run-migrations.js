#!/usr/bin/env node
/**
 * Run database migrations
 * This script connects to Supabase and creates all necessary tables
 */

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
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
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    console.log(`\n📁 Found ${migrationFiles.length} migration files:\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running migration: ${file}`);

      try {
        await client.query(sql);
        console.log(`✅ ${file} completed successfully\n`);
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 Verifying tables...');

    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n✅ Tables created:');
    rows.forEach(row => console.log(`   - ${row.table_name}`));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

runMigrations();
