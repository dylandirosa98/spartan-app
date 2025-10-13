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
  | 'website';

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
 * Complete Lead interface
 */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: LeadSource;
  medium: LeadMedium;
  status: LeadStatus;
  stage?: string; // Twenty CRM stage (e.g., "New", "Contacted", "Qualified", "Proposal", "Won", "Lost")
  notes?: string;
  estimatedValue?: number;
  roofType?: string;
  propertyType?: PropertyType;
  assignedTo?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  nextFollowUp?: string;
  syncStatus?: SyncStatus;
  lastSyncedAt?: Date;
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
    'website'
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
