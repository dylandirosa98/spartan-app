/**
 * Background Sync Service for Twenty CRM Integration
 *
 * Handles syncing leads between IndexedDB and Twenty CRM,
 * managing offline/online states and sync status updates.
 */

import { db } from './dexie';
import { twentyApi } from '../api/twenty';
import type { Lead } from '@/types/lead';

/**
 * Sync result interface
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ leadId: string; error: string }>;
}

/**
 * Check if the application is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Transform local lead to Twenty CRM format
 */
function transformLeadForTwenty(lead: Lead): any {
  // Split name into firstName and lastName
  const nameParts = lead.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    name: {
      firstName,
      lastName,
    },
    email: lead.email,
    phone: lead.phone,
    company: '', // Can be mapped from lead data if available
    position: lead.propertyType || '',
    address: {
      street: lead.address,
      city: lead.city,
      state: lead.state,
      postalCode: lead.zipCode,
      country: 'US',
    },
    // Add custom fields for Spartan CRM specific data
    customFields: {
      source: lead.source,
      medium: lead.medium,
      status: lead.status,
      notes: lead.notes,
      estimatedValue: lead.estimatedValue,
      roofType: lead.roofType,
      propertyType: lead.propertyType,
      assignedTo: lead.assignedTo,
      nextFollowUp: lead.nextFollowUp,
    },
  };
}

/**
 * Sync a single lead to Twenty CRM
 */
async function syncLead(lead: Lead): Promise<void> {
  try {
    const payload = transformLeadForTwenty(lead);

    // Check if lead exists in Twenty CRM by attempting to update
    // If it doesn't exist (404), create it instead
    try {
      await twentyApi.updateLead(lead.id, payload);
    } catch (error: any) {
      // If lead doesn't exist (404), create it
      if (error.status === 404) {
        await twentyApi.createLead(payload);
      } else {
        throw error;
      }
    }

    // Update local lead status
    await db.leads.update(lead.id, {
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    });
  } catch (error) {
    console.error(`Failed to sync lead ${lead.id}:`, error);

    // Mark lead as having sync error
    await db.leads.update(lead.id, {
      syncStatus: 'error',
    });

    throw error;
  }
}

/**
 * Sync all pending leads to Twenty CRM
 *
 * This function will:
 * 1. Check if the device is online
 * 2. Fetch all leads with 'pending' or 'error' sync status
 * 3. Attempt to sync each lead to Twenty CRM
 * 4. Update sync status accordingly
 *
 * @returns Promise with sync results
 */
export async function syncLeads(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  // Check if online
  if (!isOnline()) {
    console.log('Device is offline. Sync will be attempted when connection is restored.');
    result.success = false;
    return result;
  }

  try {
    // Get all leads that need syncing
    const pendingLeads = await db.leads
      .where('syncStatus')
      .anyOf(['pending', 'error'])
      .toArray();

    console.log(`Found ${pendingLeads.length} leads to sync`);

    // Sync each lead
    for (const lead of pendingLeads) {
      try {
        await syncLead(lead);
        result.synced++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          leadId: lead.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    // Update overall success status
    result.success = result.failed === 0;

    console.log(`Sync complete: ${result.synced} synced, ${result.failed} failed`);

    return result;
  } catch (error) {
    console.error('Sync operation failed:', error);
    result.success = false;
    return result;
  }
}

/**
 * Get the last sync timestamp from localStorage
 */
function getLastSyncTimestamp(): Date | null {
  if (typeof window === 'undefined') return null;

  const lastSync = localStorage.getItem('lastSyncTimestamp');
  return lastSync ? new Date(lastSync) : null;
}

/**
 * Save the last sync timestamp to localStorage
 */
function setLastSyncTimestamp(timestamp: Date): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('lastSyncTimestamp', timestamp.toISOString());
}

/**
 * Sync leads from Twenty CRM to local database (DELTA SYNC)
 *
 * This function uses delta sync to only fetch leads that have changed
 * since the last sync, making it much more efficient than full sync.
 *
 * @param forceFull - Force a full sync even if delta is available
 * @returns Promise with number of leads synced
 */
export async function syncLeadsFromTwenty(forceFull: boolean = false): Promise<number> {
  if (!isOnline()) {
    console.log('Device is offline. Cannot sync from Twenty CRM.');
    return 0;
  }

  try {
    const lastSync = getLastSyncTimestamp();
    const now = new Date();

    // If no last sync or force full, do a full sync
    if (!lastSync || forceFull) {
      console.log('[Sync] Performing FULL sync (no previous sync found)');

      // Fetch all leads from Twenty CRM
      const leads = await twentyApi.getLeads();
      let syncedCount = 0;

      // Store each lead with sync metadata
      for (const lead of leads) {
        const syncedLead: Lead = {
          ...lead,
          syncStatus: 'synced',
          lastSyncedAt: now,
        };

        await db.leads.put(syncedLead);
        syncedCount++;
      }

      setLastSyncTimestamp(now);
      console.log(`✅ Full sync complete: ${syncedCount} leads synced`);
      return syncedCount;
    }

    // DELTA SYNC: Only fetch leads changed since last sync
    console.log(`[Sync] Performing DELTA sync (changes since ${lastSync.toISOString()})`);

    const allLeads = await twentyApi.getLeads();

    // Filter to only leads updated after last sync
    const changedLeads = allLeads.filter(lead => {
      if (!lead.updatedAt) return false;
      const leadUpdated = new Date(lead.updatedAt);
      return leadUpdated > lastSync;
    });

    console.log(`[Sync] Found ${changedLeads.length} changed leads out of ${allLeads.length} total`);

    let syncedCount = 0;

    // Update only the changed leads
    for (const lead of changedLeads) {
      const syncedLead: Lead = {
        ...lead,
        syncStatus: 'synced',
        lastSyncedAt: now,
      };

      await db.leads.put(syncedLead);
      syncedCount++;
    }

    setLastSyncTimestamp(now);
    console.log(`✅ Delta sync complete: ${syncedCount} leads updated`);
    return syncedCount;
  } catch (error) {
    console.error('Failed to sync leads from Twenty CRM:', error);
    throw error;
  }
}

/**
 * Initialize sync listeners
 *
 * Sets up event listeners for:
 * - Online/offline events to trigger automatic sync
 * - Periodic background sync
 *
 * @param syncInterval - Interval in milliseconds for periodic sync (default: 5 minutes)
 */
export function initializeSyncListeners(syncInterval: number = 5 * 60 * 1000): void {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('Connection restored. Starting bidirectional sync...');
    try {
      // Push local changes to Twenty
      await syncLeads();
      // Pull remote changes from Twenty (delta sync)
      await syncLeadsFromTwenty();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  });

  // Log offline status
  window.addEventListener('offline', () => {
    console.log('Connection lost. Leads will be synced when connection is restored.');
  });

  // Periodic bidirectional sync (only when online)
  setInterval(async () => {
    if (isOnline()) {
      try {
        console.log('[Sync] Running periodic bidirectional sync...');
        // Push local changes to Twenty
        await syncLeads();
        // Pull remote changes from Twenty (delta sync)
        await syncLeadsFromTwenty();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }
  }, syncInterval);

  // Initial sync on load
  if (isOnline()) {
    (async () => {
      try {
        console.log('[Sync] Running initial bidirectional sync...');
        // Push local changes first
        await syncLeads();
        // Then pull remote changes (will be full sync if first time)
        await syncLeadsFromTwenty();
      } catch (error) {
        console.error('Initial sync failed:', error);
      }
    })();
  }

  console.log('Sync listeners initialized');
}

/**
 * Mark a lead as needing sync
 *
 * @param leadId - ID of the lead to mark for sync
 */
export async function markLeadForSync(leadId: string): Promise<void> {
  await db.leads.update(leadId, {
    syncStatus: 'pending',
  });
}

/**
 * Get sync statistics
 *
 * @returns Object with sync statistics
 */
export async function getSyncStats(): Promise<{
  total: number;
  synced: number;
  pending: number;
  error: number;
}> {
  const total = await db.leads.count();
  const synced = await db.leads.where('syncStatus').equals('synced').count();
  const pending = await db.leads.where('syncStatus').equals('pending').count();
  const error = await db.leads.where('syncStatus').equals('error').count();

  return {
    total,
    synced,
    pending,
    error,
  };
}
