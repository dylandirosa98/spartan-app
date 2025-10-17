#!/usr/bin/env ts-node
/**
 * Run database migrations
 * This script connects to Supabase and creates all necessary tables
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ No database connection string found!');
    console.error('Make sure POSTGRES_URL or POSTGRES_URL_NON_POOLING is set in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
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
      } catch (error: any) {
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
