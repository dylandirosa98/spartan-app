import { createClient } from '@supabase/supabase-js';

// Supabase client - gets credentials from Vercel environment variables
// These will be automatically set when you connect Supabase integration in Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase credentials not found. Make sure to:\n' +
    '1. Connect Supabase integration in Vercel dashboard\n' +
    '2. Or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema types for TypeScript
export interface MobileUser {
  id: string;
  username: string;
  password_hash: string;
  email: string;
  role: 'sales_rep' | 'canvasser' | 'office_manager' | 'project_manager';
  sales_rep: string | null;
  canvasser: string | null;
  office_manager: string | null;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MobileUserInsert {
  username: string;
  password_hash: string;
  email: string;
  role: 'sales_rep' | 'canvasser' | 'office_manager' | 'project_manager';
  sales_rep?: string | null;
  canvasser?: string | null;
  office_manager?: string | null;
  company_id?: string;
  workspace_id?: string;
  twenty_api_key?: string | null;
  is_active?: boolean;
}

export interface MobileUserUpdate {
  username?: string;
  password_hash?: string;
  email?: string;
  sales_rep?: string | null;
  canvasser?: string | null;
  office_manager?: string | null;
  is_active?: boolean;
}
