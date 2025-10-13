# Spartan CRM Type Definitions

This directory contains all TypeScript type definitions and Zod validation schemas for the Spartan CRM application.

## Files

### lead.ts
Complete Lead type definitions with Zod schemas for validation.

**Exports:**
- `Lead` - Main lead interface
- `LeadSource` - Lead source type union
- `LeadMedium` - Marketing medium type union
- `LeadStatus` - Lead pipeline status type union
- `PropertyType` - Property type enum
- `SyncStatus` - Twenty CRM sync status
- `CreateLead` - Type for creating new leads
- `UpdateLead` - Type for updating existing leads
- `LeadFilters` - Filter criteria for lead queries
- `LeadSort` - Sort configuration
- `LeadSchema` - Zod validation schema for leads
- `CreateLeadSchema` - Zod schema for lead creation
- `UpdateLeadSchema` - Zod schema for lead updates

**Usage:**
```typescript
import { Lead, LeadSchema, CreateLead } from '@/types/lead';

// Validate lead data
const result = LeadSchema.safeParse(leadData);
if (result.success) {
  const lead: Lead = result.data;
}

// Create new lead
const newLead: CreateLead = {
  name: 'John Doe',
  phone: '555-1234',
  address: '123 Main St',
  city: 'Denver',
  state: 'CO',
  zipCode: '80202',
  source: 'google_ads',
  medium: 'cpc',
  status: 'new',
};
```

### api.ts
Twenty CRM API types and response structures.

**Exports:**
- `TwentyCRMConfig` - API configuration
- `APIResponse<T>` - Generic API response wrapper
- `TwentyPerson` - Person object from Twenty CRM
- `TwentyOpportunity` - Opportunity object
- `TwentyCompany` - Company object
- `TwentyActivity` - Activity/note object
- `APIError` - Error response structure
- `SyncResult` - Single sync operation result
- `BatchSyncResult` - Batch sync results
- `GraphQLVariables` - GraphQL query variables
- Type guards: `isAPIError()`, `isGraphQLError()`

**Usage:**
```typescript
import { TwentyCRMConfig, SyncResult, isAPIError } from '@/types/api';

const config: TwentyCRMConfig = {
  apiUrl: 'https://api.twenty.com',
  apiKey: 'your-api-key',
  workspaceId: 'workspace-id',
};

try {
  const result = await syncLead(lead);
} catch (error) {
  if (isAPIError(error)) {
    console.error('API Error:', error.message);
  }
}
```

### app.ts
Application state, configuration, and UI types.

**Exports:**
- `APIConfig` - Complete API configuration
- `UserPreferences` - User settings and preferences
- `AppState` - Global application state
- `DBStats` - Database statistics
- `User` - User account information
- `Toast` - Toast notification
- `ModalState` - Modal dialog state
- `Analytics` - Analytics data structure
- `DEFAULT_USER_PREFERENCES` - Default preference values
- `DEFAULT_APP_STATE` - Default app state
- Type guards: `isValidUser()`, `isValidUserPreferences()`, `isValidAPIConfig()`

**Usage:**
```typescript
import { UserPreferences, DEFAULT_USER_PREFERENCES, Toast } from '@/types/app';

// Initialize with defaults
const preferences: UserPreferences = {
  ...DEFAULT_USER_PREFERENCES,
  theme: 'dark',
  leadsPerPage: 50,
};

// Show toast notification
const toast: Toast = {
  id: crypto.randomUUID(),
  type: 'success',
  title: 'Lead Created',
  message: 'New lead has been added successfully',
  duration: 3000,
};
```

### index.ts
Central export file for convenient imports.

**Usage:**
```typescript
// Import everything from one place
import {
  Lead,
  LeadSchema,
  APIConfig,
  UserPreferences,
  SyncResult
} from '@/types';
```

## Validation with Zod

All schemas use Zod for runtime validation:

```typescript
import { LeadSchema, CreateLeadSchema } from '@/types';

// Validate existing lead
const parseResult = LeadSchema.safeParse(data);
if (!parseResult.success) {
  console.error('Validation errors:', parseResult.error.flatten());
}

// Validate lead creation
const createResult = CreateLeadSchema.safeParse(formData);
if (createResult.success) {
  await createLead(createResult.data);
}
```

## Type Safety

All types are strictly typed with TypeScript. Use type guards for runtime checks:

```typescript
import { isValidUser, isAPIError } from '@/types';

if (isValidUser(userData)) {
  // userData is now typed as User
  console.log(userData.email);
}

if (isAPIError(error)) {
  // error is now typed as APIError
  console.error(error.statusCode);
}
```

## Integration with React Hook Form

These schemas work seamlessly with React Hook Form and @hookform/resolvers:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLeadSchema, CreateLead } from '@/types';

const { register, handleSubmit, formState: { errors } } = useForm<CreateLead>({
  resolver: zodResolver(CreateLeadSchema),
});
```

## Lead Lifecycle

```
new -> contacted -> qualified -> proposal_sent -> won/lost
```

## Lead Sources & Mediums

**Sources:**
- `google_ads` - Google Ads campaigns
- `google_lsa` - Google Local Services Ads
- `facebook_ads` - Facebook/Meta advertising
- `canvass` - Door-to-door canvassing
- `referral` - Customer referrals
- `website` - Website inquiries

**Mediums:**
- `cpc` - Cost-per-click (Google Ads)
- `lsas` - Local Services Ads
- `social_ads` - Social media advertising
- `canvass` - Direct canvassing
- `referral` - Referral program
- `organic` - Organic website traffic
