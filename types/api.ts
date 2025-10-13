import { z } from 'zod';

/**
 * Twenty CRM API Configuration
 */
export interface TwentyCRMConfig {
  apiUrl: string;
  apiKey: string;
  workspaceId?: string;
}

/**
 * API Response wrapper for Twenty CRM
 */
export interface APIResponse<T> {
  data: T;
  edges?: APIEdge<T>[];
  pageInfo?: PageInfo;
}

/**
 * GraphQL Edge structure
 */
export interface APIEdge<T> {
  node: T;
  cursor: string;
}

/**
 * Pagination info for GraphQL queries
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Twenty CRM Person object (mapped to Lead)
 */
export interface TwentyPerson {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email?: string;
  phone?: string;
  address?: {
    addressStreet1?: string;
    addressStreet2?: string;
    addressCity?: string;
    addressState?: string;
    addressPostcode?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  opportunities?: TwentyOpportunity[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Twenty CRM Opportunity object
 */
export interface TwentyOpportunity {
  id: string;
  name: string;
  amount?: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  personId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Twenty CRM Company object
 */
export interface TwentyCompany {
  id: string;
  name: string;
  domainName?: string;
  address?: {
    addressStreet1?: string;
    addressStreet2?: string;
    addressCity?: string;
    addressState?: string;
    addressPostcode?: string;
  };
  employees?: number;
  idealCustomerProfile?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Twenty CRM Activity (Note/Task)
 */
export interface TwentyActivity {
  id: string;
  title: string;
  body?: string;
  type: 'Note' | 'Task' | 'Email' | 'Call';
  status?: 'Todo' | 'Done';
  dueAt?: string;
  completedAt?: string;
  assigneeId?: string;
  authorId?: string;
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Error response
 */
export interface APIError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

/**
 * GraphQL Query Variables
 */
export interface GraphQLVariables {
  filter?: Record<string, any>;
  orderBy?: Record<string, 'AscNullsFirst' | 'AscNullsLast' | 'DescNullsFirst' | 'DescNullsLast'>;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

/**
 * GraphQL Mutation Response
 */
export interface MutationResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * GraphQL Error
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: Record<string, any>;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  leadId: string;
  twentyId?: string;
  error?: APIError;
  syncedAt: Date;
}

/**
 * Batch sync result
 */
export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
}

/**
 * Webhook payload from Twenty CRM
 */
export interface WebhookPayload {
  event: 'person.created' | 'person.updated' | 'person.deleted' | 'opportunity.created' | 'opportunity.updated';
  data: TwentyPerson | TwentyOpportunity;
  timestamp: string;
  workspaceId: string;
}

/**
 * Zod schema for API configuration validation
 */
export const TwentyCRMConfigSchema = z.object({
  apiUrl: z.string().url('Invalid API URL'),
  apiKey: z.string().min(1, 'API key is required'),
  workspaceId: z.string().optional(),
});

/**
 * Zod schema for sync result validation
 */
export const SyncResultSchema = z.object({
  success: z.boolean(),
  leadId: z.string().uuid(),
  twentyId: z.string().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    statusCode: z.number().optional(),
    details: z.record(z.any()).optional(),
  }).optional(),
  syncedAt: z.date(),
});

/**
 * Type guards
 */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as APIError).message === 'string'
  );
}

export function isGraphQLError(error: unknown): error is GraphQLError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as GraphQLError).message === 'string'
  );
}

/**
 * API request options
 */
export interface APIRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * API client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  onError?: (error: APIError) => void;
  onRetry?: (attempt: number, error: APIError) => void;
}
