# Spartan CRM

Enterprise-grade Progressive Web App (PWA) for Spartan Exteriors - A comprehensive roofing sales CRM with offline support and Twenty CRM integration.

![Spartan Exteriors](./public/spartan-logo.png)

## Features

### 🚀 Core Functionality
- **Lead Management**: Full CRUD operations with advanced filtering and search
- **Analytics Dashboard**: Real-time insights with interactive charts (Recharts)
- **Calendar & Follow-ups**: Organize and track customer follow-ups
- **Settings Management**: Configure API keys, sync status, and database

### 📱 Progressive Web App
- **Offline-First**: Works without internet using IndexedDB
- **Bidirectional Sync**: Automatic sync with Twenty CRM
- **Service Worker**: Smart caching strategies for optimal performance
- **Mobile Responsive**: Optimized for all devices

### 🔒 Security
- **Encrypted Storage**: API keys encrypted with AES encryption
- **Secure Authentication**: Bearer token authentication with Twenty CRM
- **Environment Variables**: Sensitive data stored securely

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Database**: Dexie.js (IndexedDB wrapper)
- **UI Components**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PWA**: next-pwa
- **API Client**: Axios
- **Encryption**: crypto-js

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Twenty CRM instance with API access

## Installation

1. **Clone the repository**
   ```bash
   cd spartan-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   The `.env.local` file has been created with:
   ```env
   NEXT_PUBLIC_TWENTY_API_URL=https://crm.thespartanexteriors.com/rest
   NEXT_PUBLIC_ENCRYPTION_KEY=SpartanCRM2024SecureKey!@#$%^&*
   ```

4. **Add the Spartan logo**

   Save the Spartan Exteriors logo image to:
   ```
   public/spartan-logo.png
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
spartan-app/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication routes
│   │   └── setup/           # Initial API configuration
│   ├── (dashboard)/         # Main application routes
│   │   ├── leads/           # Lead management
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── calendar/        # Follow-up calendar
│   │   └── settings/        # App settings
│   ├── layout.tsx           # Root layout
│   └── providers.tsx        # React Query provider
├── components/              # React components
│   ├── layout/              # Layout components
│   ├── leads/               # Lead-specific components
│   └── ui/                  # Reusable UI components (Radix)
├── lib/                     # Utility libraries
│   ├── api/                 # API clients and encryption
│   └── db/                  # Database (Dexie) and sync
├── store/                   # Zustand stores
│   ├── useAppStore.ts       # App state
│   ├── useAuthStore.ts      # Authentication
│   └── useLeadStore.ts      # Lead management
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
└── styles/                  # Global styles
```

## Twenty CRM Configuration

### Getting Your API Key

1. Log in to your Twenty CRM instance at: https://crm.thespartanexteriors.com
2. Navigate to Settings → API Keys
3. Generate a new API key with the following permissions:
   - Read/Write access to Leads
   - Read access to Companies (if needed)

### API Endpoints

The application uses the following Twenty CRM endpoints:

- **GET** `/rest/leads` - Fetch all leads
- **GET** `/rest/leads/:id` - Fetch single lead
- **POST** `/rest/leads` - Create new lead
- **PATCH** `/rest/leads/:id` - Update lead
- **DELETE** `/rest/leads/:id` - Delete lead

## Application Features

### 1. Lead Management (`/leads`)
- Search and filter leads by status, source, date range
- Create, edit, and delete leads
- View sync status (synced, pending, error)
- Mobile-responsive card layout
- Real-time statistics

### 2. Analytics Dashboard (`/analytics`)
- Key metrics: Total Leads, Conversion Rate, Revenue, Win Rate
- Lead source breakdown (Pie chart)
- Lead status funnel (Bar chart)
- Leads over time (Line chart)
- Revenue by month (Area chart)

### 3. Calendar (`/calendar`)
- Follow-up scheduling and tracking
- Organized by: Today, Tomorrow, This Week, Later
- Mark follow-ups as complete
- Overdue detection

### 4. Settings (`/settings`)
- View/edit API configuration
- Manual sync with Twenty CRM
- Sync statistics (total, synced, pending, errors)
- Database management (clear local data)
- App information

## Offline Support

The application features a robust offline-first architecture:

1. **Local Database**: All leads stored in IndexedDB via Dexie
2. **Sync Queue**: Changes queued when offline
3. **Auto-sync**: Automatic sync when connection restored
4. **Sync Status**: Visual indicators for each lead
   - ✅ Synced - Successfully synced with Twenty CRM
   - 🕐 Pending - Waiting to sync
   - ❌ Error - Sync failed

## Sync Behavior

- **Online**: Changes immediately sync to Twenty CRM
- **Offline**: Changes saved locally, queued for sync
- **Reconnection**: Automatic sync when connection restored
- **Periodic**: Background sync every 5 minutes (when online)
- **Manual**: Sync button in navigation and settings

## Color Scheme

The application uses Spartan Exteriors brand colors:

- **Primary Red**: `#C41E3A` - Main brand color
- **Hover Red**: `#A01828` - Darker shade for hover states
- **Status Colors**:
  - New: Blue (`#3B82F6`)
  - Contacted: Purple (`#A855F7`)
  - Qualified: Yellow (`#EAB308`)
  - Proposal Sent: Orange (`#F97316`)
  - Won: Green (`#10B981`)
  - Lost: Gray (`#6B7280`)

## Troubleshooting

### API Connection Issues

If you encounter "Connection Failed" errors:

1. Verify your API key in Settings
2. Check that the API URL is correct
3. Ensure your Twenty CRM instance is accessible
4. Check browser console for detailed error messages

### Sync Problems

If leads aren't syncing:

1. Check online status indicator in top navigation
2. Go to Settings → Sync tab to view sync statistics
3. Click "Sync Now" to manually trigger sync
4. Check for error status on individual lead cards

### Database Issues

To clear the local database:

1. Go to Settings → About tab
2. Click "Clear Local Database"
3. Confirm the action
4. This will remove all local data (changes not yet synced will be lost)

## Development

### Adding New Fields to Leads

1. Update `Lead` interface in `types/lead.ts`
2. Update `LeadSchema` Zod validation
3. Update database indexes in `lib/db/dexie.ts` (if needed)
4. Update transformation functions in `lib/api/twenty.ts`
5. Update UI components to display new field

### Environment Variables

All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser:

- `NEXT_PUBLIC_TWENTY_API_URL` - Twenty CRM API base URL
- `NEXT_PUBLIC_ENCRYPTION_KEY` - AES encryption key (32+ characters)

## License

Proprietary - Spartan Exteriors

## Support

For support, please contact your system administrator or refer to the CLAUDE.md file for development guidance.
