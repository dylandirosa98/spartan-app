# 🚀 Quick Deployment - TL;DR

Deploy Spartan CRM in 5 minutes:

## 1️⃣ Create Supabase Project
- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- New Project → Name it → Wait 2 min

## 2️⃣ Run SQL Schema
- Supabase → SQL Editor → New Query
- Copy `/supabase/schema.sql` → Paste → Run

## 3️⃣ Deploy to Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import GitHub repo → Deploy
- Wait 2 min

## 4️⃣ Connect Supabase
- Vercel → Settings → Integrations → Add Supabase
- Or manually add env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `JWT_SECRET` (generate: `openssl rand -base64 32`)

## 5️⃣ Update Mobile App
```bash
# In spartan-mobile/.env.local
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

## ✅ Done!
- **Login**: username `admin`, password `admin123`
- **Web**: Your Vercel URL
- **Mobile**: Update and restart Expo

Full guide: See [DEPLOYMENT.md](./DEPLOYMENT.md)
