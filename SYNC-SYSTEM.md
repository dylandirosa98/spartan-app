# Spartan CRM Sync System

## Overview

Spartan CRM uses a **hybrid sync system** combining **delta sync** (active now) and **webhooks** (ready for production deployment).

## How It Works

### 1. **Delta Sync** (Active in Development & Production)

Delta sync only fetches changes since the last sync, making it highly efficient.

#### How Delta Sync Detects Changes

When you change a phone number from `8563057016` to `8553057016`:

```typescript
// Twenty CRM automatically updates the timestamp:
{
  id: "abc-123",
  phone: "8553057016",  // ← Your change
  updatedAt: "2025-10-19T03:30:00Z"  // ← Twenty CRM updates this automatically
}
```

The delta sync compares `updatedAt` timestamps:
- Last sync: `2025-10-19T03:00:00Z`
- Lead updated: `2025-10-19T03:30:00Z`
- **Result**: Lead is included in delta sync ✅

#### What Gets Detected

Delta sync will detect ANY field change, including:
- ✅ Phone number changes (even 1 digit)
- ✅ Email changes
- ✅ Name changes
- ✅ Address changes
- ✅ Status changes
- ✅ Custom field changes

### 2. **Webhooks** (Ready for Production)

Webhook endpoint is built and ready at `/api/webhooks/twenty`

**Status**: Inactive until you:
1. Deploy to production (Vercel)
2. Configure webhooks in Twenty CRM settings
3. Point to: `https://your-app.vercel.app/api/webhooks/twenty`

## Sync Schedule

### Bidirectional Sync Happens:

1. **Every 5 minutes** (automatic)
   - Pushes local changes to Twenty CRM
   - Pulls remote changes from Twenty CRM (delta sync)

2. **When connection restored** (after offline)
   - Immediately syncs when internet returns

3. **On app load** (initial sync)
   - Full sync if first time
   - Delta sync if previously synced

### First Sync vs Ongoing Syncs

#### First Time (No Previous Sync)
```
[Sync] Performing FULL sync (no previous sync found)
✅ Full sync complete: 47 leads synced
```

#### Subsequent Syncs (Delta)
```
[Sync] Performing DELTA sync (changes since 2025-10-19T03:00:00Z)
[Sync] Found 3 changed leads out of 47 total
✅ Delta sync complete: 3 leads updated
```

## Current Configuration

```typescript
// Default sync interval: 5 minutes
syncInterval: 5 * 60 * 1000  // 300,000ms
```

### Change Sync Interval

In `lib/db/sync.ts`:

```typescript
// Change from 5 minutes to 2 minutes:
export function initializeSyncListeners(syncInterval: number = 2 * 60 * 1000)
```

## Efficiency Comparison

### Old System (Full Re-pull)
```
Every sync: Fetch 1000 leads = 500KB
Per hour (12 syncs): 6MB
Per day: 144MB
```

### New System (Delta Sync)
```
First sync: Fetch 1000 leads = 500KB
Next sync: Fetch 3 changed leads = 1.5KB  ← 99.7% reduction!
Per hour: ~10KB (assuming 20 changes)
Per day: ~240KB (98% reduction!)
```

## When Webhooks Activate (Production)

Once webhooks are registered in production:

```
User changes phone in Twenty CRM
    ↓
Webhook fires instantly → /api/webhooks/twenty
    ↓
App immediately updates that specific lead
    ↓
Delta sync catches anything webhooks missed (fallback)
```

### Result:
- **Instant updates** from webhooks
- **100% reliability** from delta sync fallback
- **Minimal bandwidth** usage

## Testing Delta Sync

To verify delta sync is working:

1. **Make a change in Twenty CRM**
   - Change a phone number: `555-1234` → `555-5678`

2. **Wait for next sync** (max 5 minutes)
   - Or refresh the page to trigger manual sync

3. **Check browser console**:
   ```
   [Sync] Performing DELTA sync (changes since ...)
   [Sync] Found 1 changed leads out of 47 total
   ✅ Delta sync complete: 1 leads updated
   ```

4. **Verify change appears in Spartan CRM**

## Manual Sync

To force a sync at any time:

```typescript
import { syncLeadsFromTwenty } from '@/lib/db/sync';

// Force full sync
await syncLeadsFromTwenty(true);

// Or delta sync
await syncLeadsFromTwenty();
```

## Files Modified

1. **`lib/db/sync.ts`** - Enhanced with delta sync logic
2. **`app/api/webhooks/twenty/route.ts`** - Webhook endpoint (ready for production)
3. **`lib/sync/delta-sync.ts`** - Standalone delta sync service (optional advanced usage)

## Production Deployment Checklist

When deploying to production:

- [ ] Deploy app to Vercel
- [ ] Get production URL (e.g., `https://spartan-crm.vercel.app`)
- [ ] Log into Twenty CRM
- [ ] Go to Settings → Developers → Webhooks
- [ ] Create webhook:
  - **URL**: `https://your-domain.vercel.app/api/webhooks/twenty`
  - **Events**: `lead.created`, `lead.updated`, `lead.deleted`, `note.created`
- [ ] Test webhook with a test lead change
- [ ] Verify webhook logs in Vercel

## Troubleshooting

### "No changes detected" but I made changes

Check:
1. Was the change made in Twenty CRM? (not just Spartan CRM)
2. Has 5 minutes passed since last sync?
3. Does the lead have an `updatedAt` field?

### Delta sync not running

Check browser console for:
```
[Sync] Running periodic bidirectional sync...
```

Should appear every 5 minutes.

### Force a manual sync

Open browser console and run:
```javascript
// Access the sync function
const sync = await import('./lib/db/sync.js');
await sync.syncLeadsFromTwenty(true);  // Force full sync
```

## Summary

✅ **Delta sync is active** - Only syncs changes every 5 minutes
✅ **Detects ALL field changes** - Including single-digit phone changes
✅ **Webhook infrastructure ready** - Will activate in production
✅ **Efficient & reliable** - 98% bandwidth reduction vs full sync
✅ **Automatic & bidirectional** - Push local changes, pull remote changes

Your sync system is now production-ready! 🚀
