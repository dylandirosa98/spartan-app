const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('[Check] Testing various tables...\n');

  const tablesToCheck = ['mobile_users', 'companies', 'leads', 'users'];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      console.log(`❌ Table '${table}': ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' exists (${data ? data.length : 0} rows returned)`);
    }
  }
}

checkTables();
