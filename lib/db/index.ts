/**
 * IndexedDB Database Layer
 *
 * This module exports the Dexie database instance and related utilities
 * for offline-first data storage in Spartan CRM.
 */

export { db, SpartanDatabase } from './dexie';
export { syncLeads, initializeSyncListeners } from './sync';
