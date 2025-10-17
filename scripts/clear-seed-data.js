#!/usr/bin/env node
/**
 * Clear seed data from database
 */

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function clearSeedData() {
  const host = process.env.POSTGRES_HOST;
  const database = process.env.POSTGRES_DATABASE;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

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

    // Delete all users first (due to foreign key)
    console.log('\n🗑️  Deleting users...');
    const { rowCount: userCount } = await client.query('DELETE FROM users');
    console.log(`   Deleted ${userCount} users`);

    // Delete all companies
    console.log('🗑️  Deleting companies...');
    const { rowCount: companyCount } = await client.query('DELETE FROM companies');
    console.log(`   Deleted ${companyCount} companies`);

    console.log('\n✅ Seed data cleared successfully!');
    console.log('💡 You can now create companies through the admin UI');

  } catch (error) {
    console.error('\n❌ Failed to clear seed data:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

clearSeedData();
