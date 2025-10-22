# Twenty CRM Integration Setup Guide

This guide walks you through setting up the bidirectional sync between your Spartan CRM application and Twenty CRM.

## Overview

The integration works as follows:
- **Twenty CRM** is the source of truth for lead data
- **Supabase** acts as a cache layer with real-time capabilities
- **Webhooks** keep Supabase in sync when leads change in Twenty
- **Real-time subscriptions** push updates instantly to all connected users

## Prerequisites

1. A Twenty CRM account with API access
2. Your Spartan CRM application deployed on Vercel
3. Admin access to both systems

## Step 1: Configure Company in Spartan Admin

1. Log in to your Spartan CRM admin panel: `https://your-app.vercel.app/admin`
2. Navigate to **Companies** in the sidebar
3. Find or create the roofing company you want to integrate
4. Click **Edit** on the company
5. Fill in the Twenty CRM settings:
   - **Twenty API URL**: Your Twenty instance URL (e.g., `https://your-workspace.twenty.com/rest`)
   - **Twenty API Key**: Generate this in Twenty CRM (see next step)
6. Save the company

## Step 2: Generate Twenty CRM API Key

1. Log in to your Twenty CRM workspace
2. Go to **Settings** → **Developers** → **API Keys**
3. Click **Create New API Key**
4. Name it something like "Spartan CRM Integration"
5. Copy the generated API key
6. Paste it into the Spartan admin panel (Step 1 above)

## Step 3: Set Up Twenty CRM Webhooks

Webhooks allow Twenty to notify Spartan CRM whenever a lead (person) is created, updated, or deleted.

### 3.1 Navigate to Webhooks Settings

1. In Twenty CRM, go to **Settings** → **Developers** → **Webhooks**
2. Click **Create Webhook**

### 3.2 Configure the Webhook

Fill in the webhook details:

**Webhook URL:**
```
https://your-app.vercel.app/api/webhooks/twenty?company=<COMPANY_ID>
```

Replace:
- `your-app.vercel.app` with your actual Vercel domain
- `<COMPANY_ID>` with the UUID of your company from Supabase

**To find your Company ID:**
- Option 1: Check the Supabase dashboard → Companies table → Copy the `id` column
- Option 2: In the admin panel, inspect the company in the browser dev tools

**Events to Subscribe To:**
- ✅ `person.created`
- ✅ `person.updated`
- ✅ `person.deleted`

**HTTP Method:** `POST`

**Headers:** (Optional, but recommended for security)
You can add a custom header for verification:
```
X-Webhook-Secret: your-secret-key-here
```

Then verify this in your webhook handler for additional security.

### 3.3 Save and Test

1. Click **Create** to save the webhook
2. Twenty should send a test event
3. Check your Vercel logs to verify the webhook is being received:
   ```bash
   vercel logs
   ```
4. Look for log entries like:
   ```
   [Twenty Webhook] Received event: person.created
   ```

## Step 4: Initial Sync

After setting up the webhook, you need to do an initial sync to import existing leads from Twenty CRM into Supabase.

### 4.1 Run Initial Sync via API

Use curl or Postman to trigger the initial sync:

```bash
curl -X POST "https://your-app.vercel.app/api/sync/twenty?company=<COMPANY_ID>"
```

Replace `<COMPANY_ID>` with your actual company UUID.

**Expected Response:**
```json
{
  "message": "Sync completed successfully",
  "synced": 42,
  "total": 42
}
```

### 4.2 Verify Sync

1. Go to your Supabase dashboard
2. Open the **Leads** table
3. Filter by your `company_id`
4. You should see all leads from Twenty CRM

## Step 5: Test Real-time Updates

Now test that changes in Twenty CRM flow through to Supabase:

### 5.1 Create a Test Lead in Twenty

1. In Twenty CRM, go to **People**
2. Click **Add Person**
3. Fill in details:
   - First Name: Test
   - Last Name: Lead
   - Email: test@example.com
   - Phone: (555) 123-4567
4. Save the person

### 5.2 Verify in Supabase

1. Within a few seconds, check your Supabase **Leads** table
2. You should see the new lead appear
3. The `twenty_id` field should match the ID from Twenty CRM

### 5.3 Update the Lead in Twenty

1. Edit the test lead in Twenty CRM
2. Change the phone number or email
3. Save the changes
4. Verify the updates appear in Supabase

### 5.4 Delete the Lead in Twenty

1. Delete the test lead from Twenty CRM
2. Verify it's removed from Supabase

## Step 6: Monitor and Troubleshoot

### View Webhook Logs

Check Vercel logs for webhook activity:
```bash
vercel logs --follow
```

Look for:
- `[Twenty Webhook] Received event: person.created`
- `[Twenty Webhook] Lead synced: <twenty_id>`
- `[Twenty Webhook] Lead deleted: <twenty_id>`

### Common Issues

**Issue: Webhook returns 400 "Company not found"**
- **Fix**: Verify the `company` query parameter in your webhook URL matches a valid company ID in Supabase

**Issue: Webhook returns 500 "Database error"**
- **Fix**: Check Supabase logs for RLS policy issues or constraint violations
- Ensure the `leads` table has the anon policy enabled

**Issue: Leads not syncing**
- **Fix**: Verify Twenty API key is correct in company settings
- Check that the webhook is active in Twenty CRM settings
- Look for errors in Vercel logs

**Issue: Duplicate leads appearing**
- **Fix**: The unique constraint on `(company_id, twenty_id)` should prevent this
- Run this SQL to check for duplicates:
  ```sql
  SELECT company_id, twenty_id, COUNT(*)
  FROM leads
  GROUP BY company_id, twenty_id
  HAVING COUNT(*) > 1;
  ```

## Step 7: Enable Real-time for Company Users

Company users will see leads update in real-time via Supabase subscriptions.

### 7.1 Verify Real-time is Enabled

Run this in Supabase SQL Editor:
```sql
-- Check if leads table is in the realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'leads';
```

Should return one row with `leads`.

### 7.2 Test Real-time in the App

1. Log in as a company user (not admin)
2. Navigate to the Leads page
3. Open Twenty CRM in another browser tab
4. Create a new lead in Twenty
5. Watch it appear in real-time in the Spartan CRM app (no refresh needed!)

## Architecture Diagram

```
┌─────────────────┐
│   Twenty CRM    │
│  (Source of     │
│    Truth)       │
└────────┬────────┘
         │
         │ Webhooks (person.created/updated/deleted)
         │
         ▼
┌─────────────────────────────────────────┐
│  Spartan CRM (Vercel)                   │
│  /api/webhooks/twenty                   │
│  ├─ Receives webhook events             │
│  └─ Writes to Supabase                  │
└────────┬────────────────────────────────┘
         │
         │ SQL writes
         │
         ▼
┌─────────────────────────────────────────┐
│  Supabase (PostgreSQL + Real-time)     │
│  ├─ Stores leads in cache               │
│  ├─ Real-time enabled on leads table    │
│  └─ RLS policies for multi-tenancy      │
└────────┬────────────────────────────────┘
         │
         │ Real-time subscriptions
         │
         ▼
┌─────────────────────────────────────────┐
│  Company Users (Browser)                │
│  ├─ Subscribe to company's leads        │
│  └─ Receive instant updates             │
└─────────────────────────────────────────┘
```

## Security Considerations

1. **API Keys**: Stored securely in Supabase, never exposed to client
2. **RLS Policies**: Each company can only see their own leads
3. **Webhook Verification**: Add custom headers to verify webhooks are from Twenty
4. **HTTPS Only**: All webhook endpoints use HTTPS
5. **Anon Key**: Webhook uses Supabase anon key with RLS policies

## Next Steps

- Set up webhooks for additional Twenty objects (companies, opportunities, etc.)
- Add bidirectional sync (Spartan → Twenty)
- Implement conflict resolution for simultaneous edits
- Add webhook retry logic with exponential backoff
- Monitor sync performance with analytics

## Support

For issues with this integration:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs in dashboard
3. Verify webhook is active in Twenty CRM
4. Review the webhook URL and query parameters
