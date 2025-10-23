// Simple migration script using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[Migration] Testing if sales_rep column exists...');

  try {
    // Test if column exists by trying to select it
    const { data, error } = await supabase
      .from('mobile_users')
      .select('sales_rep')
      .limit(1);

    if (error && error.message.includes('column "sales_rep" does not exist')) {
      console.log('[Migration] ❌ Column sales_rep does NOT exist');
      console.log('[Migration] ⚠️  Please run the SQL manually in Supabase dashboard');
      console.log('[Migration] See MIGRATION_INSTRUCTIONS.md for details\n');
      process.exit(1);
    } else if (error) {
      console.log('[Migration] Error checking column:', error.message);
      process.exit(1);
    } else {
      console.log('[Migration] ✅ Column sales_rep already exists!');
      console.log('[Migration] Migration appears to be complete');
    }
  } catch (err) {
    console.error('[Migration] Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
