/**
 * Delta Sync System
 * Efficiently syncs only changed data from Twenty CRM
 * Uses updatedAt timestamps to detect changes
 */

import { db } from '@/lib/db/dexie';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';

interface SyncMetadata {
  lastSyncedAt: string;
  companyId: string;
}

export class DeltaSyncService {
  private twentyClient: TwentyCRMClient;
  private companyId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor(twentyClient: TwentyCRMClient, companyId: string) {
    this.twentyClient = twentyClient;
    this.companyId = companyId;
  }

  /**
   * Get the last sync timestamp for this company
   */
  private async getLastSyncTimestamp(): Promise<Date> {
    const key = `lastSync_${this.companyId}`;
    const lastSync = localStorage.getItem(key);

    if (lastSync) {
      return new Date(lastSync);
    }

    // If no last sync, start from 30 days ago to avoid pulling everything
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  }

  /**
   * Save the last sync timestamp
   */
  private async setLastSyncTimestamp(timestamp: Date): Promise<void> {
    const key = `lastSync_${this.companyId}`;
    localStorage.setItem(key, timestamp.toISOString());
  }

  /**
   * Perform delta sync - fetch only changes since last sync
   */
  async performDeltaSync(): Promise<{
    leadsUpdated: number;
    notesUpdated: number;
    errors: string[];
  }> {
    if (this.isSyncing) {
      console.log('[Delta Sync] Sync already in progress, skipping...');
      return { leadsUpdated: 0, notesUpdated: 0, errors: [] };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let leadsUpdated = 0;
    let notesUpdated = 0;

    try {
      const lastSync = await this.getLastSyncTimestamp();
      console.log(`[Delta Sync] Fetching changes since ${lastSync.toISOString()}`);

      // Fetch changed leads
      try {
        const allLeads = await this.twentyClient.getLeads({ limit: 1000 });

        // Filter leads updated since last sync
        const changedLeads = allLeads.filter(lead => {
          if (!lead.updatedAt) return false;
          const leadUpdatedAt = new Date(lead.updatedAt);
          return leadUpdatedAt > lastSync;
        });

        console.log(`[Delta Sync] Found ${changedLeads.length} changed leads out of ${allLeads.length} total`);

        // Update local database with changed leads
        for (const lead of changedLeads) {
          await db.leads.put({
            ...lead,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          } as any);
          leadsUpdated++;
        }
      } catch (error) {
        const errorMsg = `Failed to sync leads: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Delta Sync] ${errorMsg}`);
        errors.push(errorMsg);
      }

      // TODO: Add note syncing when we have a way to query notes by updatedAt
      // For now, notes are synced individually when viewing a lead

      // Update last sync timestamp
      await this.setLastSyncTimestamp(new Date());

      console.log(`[Delta Sync] Complete - ${leadsUpdated} leads updated, ${notesUpdated} notes updated`);

      return { leadsUpdated, notesUpdated, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start automatic polling every 5 minutes
   */
  startPolling(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      console.log('[Delta Sync] Polling already active');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`[Delta Sync] Starting polling every ${intervalMinutes} minutes`);

    // Run initial sync
    this.performDeltaSync();

    // Set up interval
    this.syncInterval = setInterval(() => {
      console.log('[Delta Sync] Automatic sync triggered');
      this.performDeltaSync();
    }, intervalMs);
  }

  /**
   * Stop automatic polling
   */
  stopPolling(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[Delta Sync] Polling stopped');
    }
  }

  /**
   * Force a manual sync
   */
  async forceSync(): Promise<void> {
    console.log('[Delta Sync] Manual sync triggered');
    await this.performDeltaSync();
  }

  /**
   * Check if currently syncing
   */
  getSyncStatus(): boolean {
    return this.isSyncing;
  }
}

/**
 * Global delta sync service instance
 */
let deltaSyncService: DeltaSyncService | null = null;

/**
 * Initialize delta sync service
 */
export function initializeDeltaSync(
  twentyClient: TwentyCRMClient,
  companyId: string
): DeltaSyncService {
  if (!deltaSyncService) {
    deltaSyncService = new DeltaSyncService(twentyClient, companyId);
  }
  return deltaSyncService;
}

/**
 * Get current delta sync service instance
 */
export function getDeltaSyncService(): DeltaSyncService | null {
  return deltaSyncService;
}
