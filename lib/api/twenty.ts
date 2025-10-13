import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiKey } from './encryption';
import { Lead } from '@/types';
import { TwentyPerson } from '@/types/api';

/**
 * Twenty CRM API Base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_TWENTY_API_URL || 'https://crm.thespartanexteriors.com/rest';

/**
 * Twenty CRM Opportunity object structure (raw API response)
 */
export interface TwentyOpportunity {
  id: string;
  name: string; // Company/contact name
  stage?: string; // Opportunity stage (e.g., "New", "Qualified", "Proposal", etc.)
  amount?: number; // Deal value
  closeDate?: string; // Expected close date
  pointOfContact?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
    phone?: string;
  };
  company?: {
    name?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown; // Allow for additional Twenty CRM fields
}

/**
 * Payload for creating an opportunity in Twenty CRM
 */
export interface CreateTwentyOpportunityPayload {
  name: string; // Company/contact name
  stage?: string;
  amount?: number;
  closeDate?: string;
  pointOfContact?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
    phone?: string;
  };
  company?: {
    name?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  [key: string]: unknown;
}

/**
 * Update payload (partial)
 */
export type UpdateTwentyOpportunityPayload = Partial<CreateTwentyOpportunityPayload>;

/**
 * Payload for creating a person in Twenty CRM
 */
export interface CreateTwentyPersonPayload {
  name: {
    firstName: string;
    lastName: string;
  };
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  data: T;
}

/**
 * API Error interface
 */
export interface ApiError {
  message: string;
  status: number;
  statusText: string;
}

/**
 * Converts a Twenty CRM Person to a Spartan CRM Lead
 */
function twentyPersonToLead(person: TwentyPerson): Lead {
  const fullName = `${person.name.firstName} ${person.name.lastName}`;

  // Extract stage from the first opportunity if available
  const stage = person.opportunities?.[0]?.stage;

  return {
    id: person.id,
    name: fullName,
    phone: person.phone || '',
    email: person.email,
    address: person.address?.street || '',
    city: person.address?.city || '',
    state: person.address?.state || '',
    zipCode: person.address?.postalCode || '',
    source: 'website', // Default source, should be mapped from Twenty CRM
    medium: 'organic', // Default medium, should be mapped from Twenty CRM
    status: 'new', // Default status, should be mapped from Twenty CRM
    stage: stage, // Twenty CRM opportunity stage
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    syncStatus: 'synced',
  };
}

/**
 * Converts a Spartan CRM Lead to a Twenty CRM Person payload
 */
function leadToTwentyPerson(lead: Partial<Lead>): CreateTwentyPersonPayload {
  // Split name into first and last name
  const nameParts = (lead.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    name: {
      firstName,
      lastName,
    },
    email: lead.email,
    phone: lead.phone,
    address: {
      street: lead.address,
      city: lead.city,
      state: lead.state,
      postalCode: lead.zipCode,
    },
  };
}

/**
 * Creates and configures the Axios instance for Twenty CRM API
 */
class TwentyApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add authorization header
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const apiKey = getApiKey();
        console.log('API Key found:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO KEY');

        if (!apiKey) {
          console.error('No API key found - redirecting to setup');
          // Redirect to setup if no API key is found
          if (typeof window !== 'undefined') {
            window.location.href = '/setup';
          }
          return Promise.reject(new Error('No API key found'));
        }

        // Add Authorization header
        config.headers.Authorization = `Bearer ${apiKey}`;
        console.log('Making request to:', config.url);

        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || 'An unknown error occurred',
          status: error.response?.status || 500,
          statusText: error.response?.statusText || 'Internal Server Error',
        };

        // Handle 401 Unauthorized - redirect to setup
        if (error.response?.status === 401) {
          console.error('Unauthorized: Invalid or expired API key');
          if (typeof window !== 'undefined') {
            window.location.href = '/setup';
          }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          console.error('Forbidden: Insufficient permissions');
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
          console.error('Resource not found');
        }

        // Handle 500 Server Error
        if (error.response?.status === 500) {
          console.error('Server error occurred');
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Get all leads from Twenty CRM
   * @returns Promise with array of leads in Spartan CRM format
   */
  async getLeads(): Promise<Lead[]> {
    try {
      console.log('Fetching leads from Twenty CRM...');
      console.log('API Base URL:', API_BASE_URL);
      const response = await this.client.get('/leads');
      console.log('Twenty CRM response:', response.data);

      // Handle different response structures
      let leads: any[] = [];

      console.log('Checking response.data.data.leads:', response.data?.data?.leads);
      console.log('Is it an array?', Array.isArray(response.data?.data?.leads));

      // Check if response.data.data.leads exists (Twenty CRM structure)
      if (response.data?.data?.leads && Array.isArray(response.data.data.leads)) {
        console.log('Using response.data.data.leads path');
        leads = response.data.data.leads;
      }
      // Check if response.data.data exists (wrapped response)
      else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        console.log('Using response.data.data path');
        leads = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      // Check if response.data is directly an array
      else if (Array.isArray(response.data)) {
        console.log('Using response.data path (direct array)');
        leads = response.data;
      }
      // Check if response.data.edges exists (GraphQL style)
      else if (response.data && Array.isArray(response.data.edges)) {
        console.log('Using response.data.edges path (GraphQL)');
        leads = response.data.edges.map((edge: any) => edge.node);
      }
      else {
        console.error('Unknown response structure:', response.data);
        throw new Error('Invalid response from Twenty CRM - could not extract leads array');
      }

      console.log(`Successfully fetched ${leads.length} leads from Twenty CRM`);
      console.log('First lead sample:', leads[0]);
      console.log('All leads:', leads);

      // Map to Lead format
      return leads.map((item: any) => {
        console.log('Mapping lead item:', item);

        // Check if it's a Person object or a Lead object
        if (item.name && typeof item.name === 'object' && 'firstName' in item.name) {
          // It's a TwentyPerson
          return twentyPersonToLead(item as TwentyPerson);
        } else {
          // It's a direct lead object from Twenty CRM
          // Extract phone as string (handle both object and string formats)
          let phoneStr = '';
          if (typeof item.phone === 'string') {
            phoneStr = item.phone;
          } else if (item.phone && typeof item.phone === 'object' && 'primaryPhoneNumber' in item.phone) {
            phoneStr = item.phone.primaryPhoneNumber || '';
          }

          // Extract email as string
          let emailStr = '';
          if (typeof item.email === 'string') {
            emailStr = item.email;
          } else if (item.email && typeof item.email === 'object' && 'primaryEmail' in item.email) {
            emailStr = item.email.primaryEmail || '';
          }

          return {
            id: item.id || crypto.randomUUID(),
            name: item.name || 'Untitled',
            phone: phoneStr,
            email: emailStr,
            address: item.address?.street || item.address || '',
            city: item.address?.city || item.city || '',
            state: item.address?.state || item.state || '',
            zipCode: item.address?.postalCode || item.zipCode || '',
            source: (item.source || 'website') as any,
            medium: (item.medium || 'organic') as any,
            status: (item.status || 'new') as any,
            stage: item.stage || item.opportunityStage || undefined,
            notes: item.notes || '',
            estimatedValue: item.estValue?.amountMicros ? item.estValue.amountMicros / 1000000 : (item.estimatedValue || item.amount),
            roofType: item.roofType,
            propertyType: item.propertyType as any,
            assignedTo: item.assignedTo,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            syncStatus: 'synced' as const,
            lastSyncedAt: new Date(),
          } as Lead;
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to fetch leads:', error.message);
        console.error('Error details:', error);
      }
      // Check if it's an axios error with response
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
      }
      throw error;
    }
  }

  /**
   * Get a single lead by ID
   * @param id - Lead ID
   * @returns Promise with the lead data in Spartan CRM format
   */
  async getLead(id: string): Promise<Lead> {
    try {
      const response = await this.client.get<ApiResponse<TwentyPerson>>(`/leads/${id}`);
      return twentyPersonToLead(response.data.data);
    } catch (error) {
      console.error(`Failed to fetch lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lead in Twenty CRM
   * @param payload - Lead data in Spartan CRM format
   * @returns Promise with the created lead in Spartan CRM format
   */
  async createLead(payload: Partial<Lead>): Promise<Lead> {
    try {
      const twentyPayload = leadToTwentyPerson(payload);
      const response = await this.client.post<ApiResponse<TwentyPerson>>(
        '/leads',
        twentyPayload
      );
      return twentyPersonToLead(response.data.data);
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   * @param id - Lead ID
   * @param payload - Updated lead data (partial) in Spartan CRM format
   * @returns Promise with the updated lead in Spartan CRM format
   */
  async updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
    try {
      const twentyPayload = leadToTwentyPerson(payload);
      const response = await this.client.patch<ApiResponse<TwentyPerson>>(
        `/leads/${id}`,
        twentyPayload
      );
      return twentyPersonToLead(response.data.data);
    } catch (error) {
      console.error(`Failed to update lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lead from Twenty CRM
   * @param id - Lead ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteLead(id: string): Promise<void> {
    try {
      await this.client.delete(`/leads/${id}`);
    } catch (error) {
      console.error(`Failed to delete lead ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get the raw Axios instance for custom requests
   * @returns The Axios instance
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export a singleton instance
export const twentyApi = new TwentyApiClient();

// Export the class for testing purposes
export { TwentyApiClient };
