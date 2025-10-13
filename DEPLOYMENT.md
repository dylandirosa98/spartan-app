# Spartan CRM - Vercel + Supabase Deployment Guide

This guide will help you deploy your Spartan CRM app to Vercel with Supabase in minutes.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase account (sign up at [supabase.com](https://supabase.com))

---

## Step 1: Push Code to GitHub

1. Make sure your code is committed:
```bash
git add .
git commit -m "Ready for deployment"
```

2. Create a new GitHub repository and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/spartan-app.git
git push -u origin main
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `spartan-crm` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

---

## Step 3: Run SQL Schema in Supabase

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `/supabase/schema.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** (bottom right)
6. You should see "Success" - your `mobile_users` table is now created!

---

## Step 4: Get Supabase Credentials

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (looks like: `eyJhbGc...` - long string)
3. Keep this tab open - you'll need these for Vercel

---

## Step 5: Deploy to Vercel

### Option A: Using Vercel Integration (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will detect Next.js automatically
4. Click **"Deploy"** (don't add env vars yet)
5. Wait for deployment (~2 minutes)
6. Once deployed, click **"Continue to Dashboard"**

### Option B: Using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, select your project settings
```

---

## Step 6: Connect Supabase Integration in Vercel

### Automatic Method (Recommended):

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Integrations"**
3. Search for **"Supabase"**
4. Click **"Add Integration"**
5. Select your Supabase project
6. Click **"Connect"**
7. Vercel will automatically add environment variables!
8. Redeploy: Go to **"Deployments"** → Click **"..."** on latest → **"Redeploy"**

### Manual Method (if integration doesn't work):

1. In Vercel dashboard, go to **"Settings"** → **"Environment Variables"**
2. Add these variables:

| Variable Name | Value | Where to get it |
|--------------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Supabase → Settings → API |
| `JWT_SECRET` | Generate random string | Use: `openssl rand -base64 32` |
| `TWENTY_API_KEY` | Your Twenty CRM API key | Twenty CRM settings |

3. Click **"Save"** for each
4. Redeploy your project

---

## Step 7: Configure Mobile App

1. Copy your Vercel URL (looks like: `https://spartan-app-xxxxx.vercel.app`)

2. Update your mobile app's `.env.local`:
```env
EXPO_PUBLIC_API_URL=https://spartan-app-xxxxx.vercel.app
```

3. Rebuild your mobile app:
```bash
cd /path/to/spartan-mobile
npm start
```

---

## Step 8: Test Everything

### Test Web App:

1. Go to your Vercel URL
2. Navigate to **"Mobile Users"** page
3. You should see the default admin user
4. Try creating a new user
5. ✅ Success if user appears in the table!

### Test Mobile App:

1. Open Expo Go on your phone
2. Scan QR code
3. Try logging in with:
   - **Username**: `admin`
   - **Password**: `admin123`
4. ✅ Success if you see the app dashboard!

---

## Troubleshooting

### ❌ "Supabase credentials not found" error

**Fix**: Make sure environment variables are set in Vercel:
1. Go to Vercel → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are there
3. Redeploy the project

### ❌ Mobile app can't connect to API

**Fix**: Check your mobile app env file:
1. Verify `EXPO_PUBLIC_API_URL` points to your Vercel URL (with https://)
2. Make sure there's no `/` at the end
3. Restart Expo: `npm start`

### ❌ "relation mobile_users does not exist"

**Fix**: SQL schema wasn't run:
1. Go to Supabase → SQL Editor
2. Run the schema from `/supabase/schema.sql`
3. Verify table exists: `SELECT * FROM mobile_users;`

### ❌ Login fails with "Invalid credentials"

**Fix**: Default user might not be created:
1. Go to Supabase → Table Editor → `mobile_users`
2. Check if admin user exists
3. If not, run this SQL:
```sql
INSERT INTO mobile_users (
  username, password_hash, email, role, workspace_id, is_active
) VALUES (
  'admin',
  '$2a$10$rZJ5PfZ0OvGKvLqGxGxR4.WQJ5vGKL0nqO5nJ5YqFqZJ5vGKL0nqO',
  'admin@spartanexteriors.com',
  'admin',
  'default',
  true
);
```

### ❌ "Failed to create user" errors

**Fix**: Check Supabase logs:
1. Supabase → Logs → Postgres Logs
2. Look for error messages
3. Common issues:
   - Duplicate username/email (try different values)
   - RLS policies blocking (our schema allows all for now)

---

## Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `crm.spartanexteriors.com`)
3. Update DNS records as instructed
4. Update mobile app's `EXPO_PUBLIC_API_URL` to use your custom domain

---

## Security Checklist

Before going to production:

- [ ] Change default admin password in Supabase
- [ ] Generate strong JWT_SECRET
- [ ] Enable Row Level Security (RLS) policies in Supabase
- [ ] Add rate limiting to API routes
- [ ] Enable Vercel firewall if available
- [ ] Review Supabase auth policies
- [ ] Set up database backups in Supabase

---

## Monitoring & Maintenance

### View Logs:

- **Vercel Logs**: Dashboard → Your Project → Functions
- **Supabase Logs**: Database logs in Supabase dashboard

### Database Management:

- **View Users**: Supabase → Table Editor → `mobile_users`
- **Run Queries**: Supabase → SQL Editor
- **Backups**: Automatic with Supabase (free plan: daily, paid: point-in-time)

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Quick Reference

### Default Credentials:
- **Username**: `admin`
- **Password**: `admin123`

### Important URLs:
- **Web App**: Your Vercel URL
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

### Key Files:
- `/supabase/schema.sql` - Database schema
- `/lib/db/supabase.ts` - Database connection
- `/.env.example` - Environment variables template
- `/app/api/mobile-users/route.ts` - User management API
- `/app/api/auth/login/route.ts` - Authentication API

---

**Deployment complete!** 🎉

You now have:
- ✅ Web app on Vercel with HTTPS
- ✅ Mobile user management system
- ✅ Postgres database on Supabase
- ✅ Secure authentication with bcrypt
- ✅ Mobile app ready to connect

Your sales team can now log in to the mobile app from anywhere!
