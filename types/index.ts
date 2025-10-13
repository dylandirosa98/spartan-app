/**
 * Central export file for all Spartan CRM types
 */

// Lead types
export type {
  Lead,
  LeadSource,
  LeadMedium,
  LeadStatus,
  PropertyType,
  SyncStatus,
  CreateLead,
  UpdateLead,
  LeadFilters,
  LeadSortField,
  LeadSortOrder,
  LeadSort,
} from './lead';

export {
  LeadSchema,
  CreateLeadSchema,
  UpdateLeadSchema,
} from './lead';

// API types
export type {
  TwentyCRMConfig,
  APIResponse,
  APIEdge,
  PageInfo,
  TwentyPerson,
  TwentyOpportunity,
  TwentyCompany,
  TwentyActivity,
  APIError,
  GraphQLVariables,
  MutationResponse,
  GraphQLError,
  SyncResult,
  BatchSyncResult,
  WebhookPayload,
  APIRequestOptions,
  APIClientConfig,
} from './api';

export {
  TwentyCRMConfigSchema,
  SyncResultSchema,
  isAPIError,
  isGraphQLError,
} from './api';

// App types
export type {
  APIConfig,
  UserPreferences,
  AppState,
  DBStats,
  Route,
  Toast,
  ModalState,
  FilterState,
  SearchState,
  PaginationState,
  AppContext,
  User,
  UserRole,
  Permission,
  LeadFormState,
  PhotoUploadState,
  Analytics,
  ExportOptions,
  ImportResult,
} from './app';

export {
  UserPreferencesSchema,
  APIConfigSchema,
  UserSchema,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_APP_STATE,
  isValidUser,
  isValidUserPreferences,
  isValidAPIConfig,
} from './app';
