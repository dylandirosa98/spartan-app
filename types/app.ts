import { z } from 'zod';
import { Lead, LeadFilters, LeadSort } from './lead';
import { TwentyCRMConfig } from './api';

/**
 * API Configuration for the app
 */
export interface APIConfig {
  twentyCRM: TwentyCRMConfig;
  isConfigured: boolean;
  lastValidated?: Date;
}

/**
 * User preferences for the application
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid' | 'kanban';
  leadsPerPage: number;
  defaultSort: LeadSort;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoSync: boolean;
  syncInterval: number; // in minutes
  offlineMode: boolean;
}

/**
 * Application state
 */
export interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date;
  syncErrors: number;
  pendingChanges: number;
  isInstalled: boolean;
  updateAvailable: boolean;
}

/**
 * Database statistics
 */
export interface DBStats {
  totalLeads: number;
  newLeads: number;
  pendingSyncLeads: number;
  failedSyncLeads: number;
  storageUsed: number; // in bytes
  storageQuota: number; // in bytes
  lastCleanup?: Date;
}

/**
 * Navigation route
 */
export interface Route {
  path: string;
  label: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'delete' | 'settings' | 'sync';
  data?: any;
}

/**
 * Filter state
 */
export interface FilterState {
  active: boolean;
  filters: LeadFilters;
  resultsCount: number;
}

/**
 * Search state
 */
export interface SearchState {
  query: string;
  isSearching: boolean;
  results: Lead[];
  resultsCount: number;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Global app context
 */
export interface AppContext {
  config: APIConfig;
  preferences: UserPreferences;
  state: AppState;
  stats: DBStats;
  user?: User;
}

/**
 * User roles
 */
export type UserRole = 'owner' | 'manager' | 'salesperson';

/**
 * User permissions
 */
export type Permission =
  | 'view_leads'
  | 'create_leads'
  | 'edit_leads'
  | 'delete_leads'
  | 'view_analytics'
  | 'manage_users'
  | 'view_settings'
  | 'edit_settings';

/**
 * User information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Form state for lead creation/editing
 */
export interface LeadFormState {
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

/**
 * Photo upload state
 */
export interface PhotoUploadState {
  isUploading: boolean;
  progress: number;
  uploadedUrls: string[];
  errors: string[];
}

/**
 * Analytics data
 */
export interface Analytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalValue: number;
  averageValue: number;
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  leadsByAssignee: Record<string, number>;
  trendData: Array<{
    date: string;
    leads: number;
    value: number;
  }>;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  fields: string[];
  filters?: LeadFilters;
  includePhotos: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

/**
 * Zod schema for user preferences validation
 */
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultView: z.enum(['list', 'grid', 'kanban']),
  leadsPerPage: z.number().min(10).max(100),
  defaultSort: z.object({
    field: z.enum(['createdAt', 'updatedAt', 'name', 'estimatedValue', 'nextFollowUp']),
    order: z.enum(['asc', 'desc']),
  }),
  notificationsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  autoSync: z.boolean(),
  syncInterval: z.number().min(1).max(60),
  offlineMode: z.boolean(),
});

/**
 * Zod schema for API configuration validation
 */
export const APIConfigSchema = z.object({
  twentyCRM: z.object({
    apiUrl: z.string().url('Invalid API URL'),
    apiKey: z.string().min(1, 'API key is required'),
    workspaceId: z.string().optional(),
  }),
  isConfigured: z.boolean(),
  lastValidated: z.date().optional(),
});

/**
 * Zod schema for user validation
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['owner', 'manager', 'salesperson']),
  permissions: z.array(z.enum([
    'view_leads',
    'create_leads',
    'edit_leads',
    'delete_leads',
    'view_analytics',
    'manage_users',
    'view_settings',
    'edit_settings',
  ])),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
});

/**
 * Default values
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultView: 'list',
  leadsPerPage: 25,
  defaultSort: {
    field: 'createdAt',
    order: 'desc',
  },
  notificationsEnabled: true,
  soundEnabled: false,
  autoSync: true,
  syncInterval: 15,
  offlineMode: false,
};

export const DEFAULT_APP_STATE: AppState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  syncErrors: 0,
  pendingChanges: 0,
  isInstalled: false,
  updateAvailable: false,
};

/**
 * Type guards
 */
export function isValidUser(user: unknown): user is User {
  return UserSchema.safeParse(user).success;
}

export function isValidUserPreferences(prefs: unknown): prefs is UserPreferences {
  return UserPreferencesSchema.safeParse(prefs).success;
}

export function isValidAPIConfig(config: unknown): config is APIConfig {
  return APIConfigSchema.safeParse(config).success;
}
