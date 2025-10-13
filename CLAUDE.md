# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spartan CRM is an enterprise-grade Progressive Web App (PWA) for Spartan Exteriors, a roofing sales CRM. The application features offline-first architecture with bidirectional sync to Twenty CRM, built with Next.js 14, TypeScript, and Dexie.js (IndexedDB).

## Development Commands

**Development:**
- `npm run dev` - Start Next.js development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server

**Type Checking & Linting:**
- `npm run type-check` - Run TypeScript compiler without emitting files
- `npm run lint` - Run ESLint

**Node Requirements:**
- Node >= 18.0.0
- npm >= 9.0.0

## Architecture Overview

### Offline-First with Bidirectional Sync

The application is built as an offline-first PWA with a sophisticated sync system:

1. **Local Database (Dexie.js)**: All lead data is stored in IndexedDB via lib/db/dexie.ts
2. **Sync Service (lib/db/sync.ts)**: Manages bidirectional sync between local DB and Twenty CRM
3. **Sync Status**: Each lead tracks its sync status ('synced' | 'pending' | 'error')
4. **Automatic Sync**: Triggers on:
   - Online/offline events (automatically syncs when connection restored)
   - Periodic intervals (default: 5 minutes)
   - Manual user-initiated sync

### State Management Architecture

The app uses **Zustand** with persistence for global state:

- **useAppStore** (store/useAppStore.ts): App-level state (online status, sync state, notifications)
- **useLeadStore** (store/useLeadStore.ts): Lead CRUD operations with automatic sync
- **useAuthStore** (store/useAuthStore.ts): Authentication state

All stores use Zustand's `persist` middleware to maintain state across sessions.

### API Integration (Twenty CRM)

Twenty CRM integration is centralized in lib/api/twenty.ts:

- **TwentyApiClient class**: Axios-based API client with interceptors
- **Automatic authentication**: Injects encrypted API key from localStorage
- **Data transformation**: Converts between Twenty CRM "Person" objects and Spartan "Lead" objects
- **Error handling**: Redirects to /setup on 401/403, handles 404/500 errors

### Encryption System

API keys are encrypted in localStorage (lib/api/encryption.ts):

- **AES encryption** via crypto-js
- **Encryption key**: Stored in NEXT_PUBLIC_ENCRYPTION_KEY environment variable
- **Functions**: `storeApiKey()`, `getApiKey()`, `removeApiKey()`

### Data Flow Pattern

1. User creates/updates lead → useLeadStore
2. Lead saved to local IndexedDB (Dexie) with `syncStatus: 'pending'`
3. Automatic sync attempt to Twenty CRM API
4. On success: Update `syncStatus: 'synced'`, `lastSyncedAt: Date`
5. On failure: Update `syncStatus: 'error'`, retry on next sync cycle

### Route Structure (Next.js App Router)

```
app/
├── (auth)/
│   └── setup/          # Initial API key configuration
├── (dashboard)/
│   ├── leads/          # Lead management (main feature)
│   ├── calendar/       # Calendar view
│   ├── analytics/      # Analytics dashboard
│   └── settings/       # App settings
├── layout.tsx          # Root layout with Providers
├── providers.tsx       # React Query setup
└── page.tsx            # Root redirects to /leads
```

### Component Architecture

- **UI Components** (components/ui/): Radix UI-based components with Tailwind styling
- **Layout Components** (components/layout/): Navigation (top-nav, bottom-nav, sidebar, dashboard-layout)
- **Design System**: Uses shadcn/ui patterns with `class-variance-authority` and `tailwind-merge`

### Type System

All types centralized in types/ directory:

- **types/lead.ts**: Lead domain types with Zod schemas for validation
- **types/api.ts**: Twenty CRM API types
- **types/app.ts**: Application-level types (Toast, AppState, etc.)
- **types/index.ts**: Central export file

Use Zod schemas (LeadSchema, CreateLeadSchema, UpdateLeadSchema) for runtime validation.

### PWA Configuration

Configured in next.config.mjs with next-pwa:

- **Service Worker**: Disabled in development, enabled in production
- **Caching Strategy**:
  - Twenty CRM API: NetworkFirst (24h cache, 10s timeout)
  - Images: CacheFirst (30 day cache)
- **Auto-registration**: Service worker registers automatically

### Database Schema (Dexie)

The SpartanDatabase class (lib/db/dexie.ts) defines the IndexedDB schema:

**Leads table indexes**: `id, name, status, source, createdAt, syncStatus`

**Hooks**:
- `creating`: Computes lowercased `name` field from `firstName + lastName`
- `updating`: Updates computed name field when firstName/lastName changes

## Key Development Patterns

### Adding New Fields to Leads

1. Update Lead interface in types/lead.ts
2. Update LeadSchema with Zod validation
3. Add field to Dexie schema if it needs indexing (lib/db/dexie.ts)
4. Update transformation functions in lib/api/twenty.ts (twentyPersonToLead, leadToTwentyPerson)
5. Increment database version if schema changes

### Working with Sync

- Always set `syncStatus: 'pending'` when creating/updating leads locally
- Use `markLeadForSync(leadId)` from lib/db/sync.ts to mark items for re-sync
- Check sync stats with `getSyncStats()` for debugging
- Sync listeners are initialized in useAppStore.ts

### Environment Variables Required

- `NEXT_PUBLIC_TWENTY_API_URL`: Twenty CRM API base URL (defaults to https://crm.thespartanexteriors.com/rest)
- `NEXT_PUBLIC_ENCRYPTION_KEY`: AES encryption key for localStorage

### Testing Offline Functionality

- Use browser DevTools → Network → Offline mode
- Watch for online/offline events triggering auto-sync
- Check IndexedDB in Application tab to verify local storage
- Monitor sync status indicators in the UI

## Common Gotchas

- **firstName/lastName split**: Lead name is stored as single field but Twenty CRM requires firstName/lastName split
- **Sync race conditions**: Lead store operations wait for local DB writes before attempting CRM sync
- **API key redirect loops**: If API key is invalid, user redirects to /setup - ensure setup flow completes
- **Date formats**: Use ISO 8601 strings for dates (new Date().toISOString()), stored as strings in DB
