const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('[Migration] Connected to Supabase');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/003_add_sales_rep_to_mobile_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('[Migration] Executing migration: 003_add_sales_rep_to_mobile_users.sql');
    console.log('[Migration] SQL:');
    console.log(migrationSQL);

    // Execute each SQL statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`\n[Migration] Executing: ${statement.substring(0, 80)}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('[Migration] ❌ Error executing statement:', error);
        throw error;
      }
    }

    console.log('\n[Migration] ✅ Migration completed successfully!');
    console.log('[Migration] Added sales_rep and company_id columns to mobile_users table');
  } catch (error) {
    console.error('[Migration] ❌ Error:', error);
    process.exit(1);
  }
}

runMigration();
