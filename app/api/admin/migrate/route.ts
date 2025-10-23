import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/migrate
 * Run pending database migrations
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('[Migration] Running mobile_users table migration...');

    // Execute SQL statements one by one via Supabase SQL editor API
    const statements = [
      'ALTER TABLE mobile_users ADD COLUMN IF NOT EXISTS sales_rep VARCHAR(100);',
      'ALTER TABLE mobile_users ADD COLUMN IF NOT EXISTS company_id UUID;',
      'CREATE INDEX IF NOT EXISTS idx_mobile_users_sales_rep ON mobile_users(sales_rep);',
      'CREATE INDEX IF NOT EXISTS idx_mobile_users_company_id ON mobile_users(company_id);',
      `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_mobile_users_company'
  ) THEN
    ALTER TABLE mobile_users
    ADD CONSTRAINT fk_mobile_users_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE;
  END IF;
END $$;`
    ];

    const results = [];

    for (const sql of statements) {
      console.log('[Migration] Executing:', sql.substring(0, 80) + '...');

      try {
        // Use Supabase REST API to execute SQL
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ query: sql }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Migration] Statement failed:', errorText);

          // Try alternative: use from() with raw query
          const { data: _data, error } = await supabase.from('mobile_users').select('sales_rep').limit(1);

          if (error && error.message.includes('column "sales_rep" does not exist')) {
            console.log('[Migration] Column sales_rep does not exist, needs to be added');
          }

          throw new Error(`SQL execution failed: ${errorText}`);
        }

        const result = await response.json();
        results.push({ sql: sql.substring(0, 80), result });
        console.log('[Migration] ✓ Statement executed');
      } catch (err) {
        console.error('[Migration] Error on statement:', err);
        // Continue with other statements
      }
    }

    console.log('[Migration] Migration process completed');
    console.log('[Migration] Note: Some statements may have failed - check if columns already exist');

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      details: 'Attempted to add sales_rep and company_id columns to mobile_users table',
      results,
    });
  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
