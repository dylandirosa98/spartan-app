import { z } from 'zod';

/**
 * Company (Roofing Company) type for multi-company management
 */
export interface Company {
  id: string;
  name: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  twentyApiUrl: string;
  twentyApiKey: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Company payload
 */
export type CreateCompany = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update Company payload
 */
export type UpdateCompany = Partial<CreateCompany>;

/**
 * Validation schema for Company
 */
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().url().optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: z.string().min(5, 'Invalid zip code'),
  twentyApiUrl: z.string().url('Invalid API URL'),
  twentyApiKey: z.string().min(10, 'API key must be at least 10 characters'),
  supabaseUrl: z.string().url().optional(),
  supabaseKey: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Validation schema for Create Company
 */
export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Validation schema for Update Company
 */
export const UpdateCompanySchema = CreateCompanySchema.partial();
