# Supabase Database Setup

This directory contains SQL migration files to set up the Arisys multi-tenant CRM database.

## Quick Setup (For Production)

### 1. Access Your Supabase Dashboard

Go to your Supabase project dashboard at: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

### 2. Run Migrations in Order

Navigate to **SQL Editor** in the left sidebar and run these files in order:

1. **001_create_companies_table.sql** - Creates the companies table
2. **002_create_users_table.sql** - Creates the users table
3. **003_seed_spartan_exteriors.sql** - Seeds Spartan Exteriors company and Dylan user

### 3. Update the Seed Data

Before running `003_seed_spartan_exteriors.sql`, you need to:

1. First, run the first two migrations
2. Log into your admin panel at: https://your-app.vercel.app/admin/dashboard
3. Go to Companies → Add Company
4. Create "Spartan Exteriors" with the Twenty CRM API key
5. The admin panel will encrypt the API key automatically

**OR** you can manually update the seed file:

- Replace `YOUR_ENCRYPTED_API_KEY_HERE` with the encrypted API key
- To encrypt the key, you can use the admin panel's Company form or the encryption functions in `lib/api/encryption.ts`

## Database Schema

### Companies Table

Stores information about roofing companies using the platform.

```sql
companies (
  id                UUID PRIMARY KEY
  name              TEXT UNIQUE
  logo              TEXT
  contact_email     TEXT
  contact_phone     TEXT
  address           TEXT
  city              TEXT
  state             TEXT
  zip_code          TEXT
  twenty_api_url    TEXT
  twenty_api_key    TEXT (encrypted)
  supabase_url      TEXT
  supabase_key      TEXT (encrypted)
  is_active         BOOLEAN
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
)
```

### Users Table

Stores company employees (owners, managers, salespeople).

```sql
users (
  id                UUID PRIMARY KEY
  company_id        UUID REFERENCES companies(id)
  name              TEXT
  email             TEXT UNIQUE
  password_hash     TEXT
  role              TEXT ('owner', 'manager', 'salesperson')
  is_active         BOOLEAN
  last_login        TIMESTAMP
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
)
```

## Row Level Security (RLS)

Both tables have RLS enabled with policies that:
- Allow all operations for authenticated users
- Allow all operations for anon users (needed for API routes)

## Manual Company Creation (Alternative Method)

If you prefer to create the company through the admin UI instead of SQL:

1. Log in as admin: dylandirosa980@gmail.com / Bubs2shiesty$
2. Go to **Companies** → **Add Company**
3. Fill in:
   - **Company Name**: Spartan Exteriors
   - **Contact Email**: dylan@thespartanexteriors.com
   - **Contact Phone**: (your phone number)
   - **Address**: (your address)
   - **City/State/Zip**: (your location)
   - **Twenty CRM API URL**: https://crm.thespartanexteriors.com/rest
   - **Twenty CRM API Key**: (your actual Twenty CRM API key)
4. Click **Create Company**

Then go to **Users** → **Add User**:
   - **Company**: Spartan Exteriors
   - **Name**: Dylan DiRosa
   - **Email**: dylan@thespartanexteriors.com
   - **Password**: Bubs2shiesty$
   - **Role**: Owner
   - **Active**: Yes
5. Click **Create User**

## Vercel Integration

The Supabase integration in Vercel automatically sets these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No manual configuration needed in Vercel if the integration is connected!

## Troubleshooting

### Error: "Failed to fetch companies"

This means the `companies` table doesn't exist yet. Run migrations 001 and 002.

### Error: "relation 'companies' does not exist"

Run the migration files in the Supabase SQL Editor.

### Can't see companies in admin dashboard

1. Check that migrations ran successfully
2. Verify RLS policies are created
3. Check Vercel logs for detailed error messages

## Need Help?

Check the Supabase docs: https://supabase.com/docs
