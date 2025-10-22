import { z } from 'zod';

/**
 * Lead source types - where the lead originated from
 */
export type LeadSource =
  | 'google_ads'
  | 'google_lsa'
  | 'facebook_ads'
  | 'canvass'
  | 'referral'
  | 'website'
  | 'twenty_crm';

/**
 * Lead medium types - the marketing medium
 */
export type LeadMedium =
  | 'cpc'
  | 'lsas'
  | 'social_ads'
  | 'canvass'
  | 'referral'
  | 'organic';

/**
 * Lead status in the sales pipeline
 */
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'proposal_sent'
  | 'won'
  | 'lost';

/**
 * Property type for the lead
 */
export type PropertyType = 'residential' | 'commercial';

/**
 * Sync status for Twenty CRM integration
 */
export type SyncStatus = 'synced' | 'pending' | 'error';

/**
 * Complete Lead interface matching Twenty CRM Lead object
 */
export interface Lead {
  id: string;
  company_id?: string;
  twenty_id?: string | null;
  twentyId?: string | null; // Alias for twenty_id (camelCase)

  // Basic Information
  name: string;
  phone: string | null;
  email?: string | null;
  address: string | null; // Maps to "adress" in Twenty (typo in their schema)
  city: string | null;
  state: string | null;
  zip_code?: string | null;
  zipCode?: string; // Alias for zip_code

  // Lead Details
  source: LeadSource | string;
  medium?: LeadMedium;
  status: LeadStatus;
  stage?: string; // Twenty CRM stage (e.g., "New", "Contacted", "Qualified", "Proposal", "Won", "Lost")
  notes?: string | null;
  estimatedValue?: number; // Maps to "estValue" in Twenty
  roofType?: string;
  propertyType?: PropertyType;
  assignedTo?: string;
  assigned_to?: string | null; // Supabase field
  salesRep?: string; // Twenty CRM salesRep enum

  // UTM Tracking Parameters (from Twenty CRM)
  rawUtmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  gclid?: string | null; // Google Click ID
  fbclid?: string | null; // Facebook Click ID
  wbraid?: string | null; // Google wbraid parameter

  // AI & Appointments (from Twenty CRM)
  aiSummary?: string | null;
  appointmentTime?: string | null;

  // Media
  photos?: string[];
  callPage?: any; // Links type from Twenty CRM

  // Timestamps
  createdAt?: string;
  created_at?: string; // Supabase field
  updatedAt?: string;
  updated_at?: string; // Supabase field
  deletedAt?: string | null; // Twenty CRM soft delete
  nextFollowUp?: string;

  // Sync Status
  syncStatus?: SyncStatus;
  lastSyncedAt?: Date;

  // Relations (from Twenty CRM)
  createdBy?: any; // Actor type
  position?: number; // Position in list
}

/**
 * Zod schema for Lead validation
 */
export const LeadSchema = z.object({
  id: z.string().uuid('Invalid lead ID format'),
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required').max(300, 'Address is too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name is too long'),
  state: z.string().min(2, 'State is required').max(2, 'Use 2-letter state code'),
  zipCode: z.string()
    .min(5, 'ZIP code must be at least 5 digits')
    .max(10, 'ZIP code is too long')
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  source: z.enum([
    'google_ads',
    'google_lsa',
    'facebook_ads',
    'canvass',
    'referral',
    'website',
    'twenty_crm'
  ]),
  medium: z.enum([
    'cpc',
    'lsas',
    'social_ads',
    'canvass',
    'referral',
    'organic'
  ]),
  status: z.enum([
    'new',
    'contacted',
    'qualified',
    'quoted',
    'proposal_sent',
    'won',
    'lost'
  ]),
  stage: z.string().max(100, 'Stage name is too long').optional(),
  notes: z.string().max(5000, 'Notes are too long').optional(),
  estimatedValue: z.number().min(0, 'Estimated value must be positive').optional(),
  roofType: z.string().max(100, 'Roof type is too long').optional(),
  propertyType: z.enum(['residential', 'commercial']).optional(),
  assignedTo: z.string().uuid('Invalid assignedTo ID format').optional(),
  photos: z.array(z.string().url('Invalid photo URL')).optional(),
  createdAt: z.string().datetime('Invalid createdAt date format'),
  updatedAt: z.string().datetime('Invalid updatedAt date format'),
  nextFollowUp: z.string().datetime('Invalid nextFollowUp date format').optional(),
  syncStatus: z.enum(['synced', 'pending', 'error']).optional(),
  lastSyncedAt: z.date().optional(),
});

/**
 * Zod schema for creating a new lead (without id, timestamps)
 */
export const CreateLeadSchema = LeadSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  syncStatus: true,
  lastSyncedAt: true,
});

/**
 * Zod schema for updating a lead (all fields optional except id)
 */
export const UpdateLeadSchema = LeadSchema.partial().required({ id: true });

/**
 * Type for creating a new lead
 */
export type CreateLead = z.infer<typeof CreateLeadSchema>;

/**
 * Type for updating a lead
 */
export type UpdateLead = z.infer<typeof UpdateLeadSchema>;

/**
 * Lead filters for querying
 */
export interface LeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  assignedTo?: string;
  propertyType?: PropertyType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  syncStatus?: SyncStatus[];
}

/**
 * Lead sort options
 */
export type LeadSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'estimatedValue'
  | 'nextFollowUp';

export type LeadSortOrder = 'asc' | 'desc';

export interface LeadSort {
  field: LeadSortField;
  order: LeadSortOrder;
}
