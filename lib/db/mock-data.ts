/**
 * Mock data for local development
 * Used when Supabase is not configured or unavailable
 */

import type { Company } from '@/types';

export interface MockUser {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'salesperson';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock company data
export const mockCompanies: Company[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Spartan Exteriors',
    logo: undefined,
    contactEmail: 'dylan@thespartanexteriors.com',
    contactPhone: '555-0100',
    address: '123 Main Street',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    twentyApiUrl: 'https://crm.thespartanexteriors.com/rest',
    twentyApiKey: 'mock-api-key-12345', // Mock unencrypted key
    supabaseUrl: undefined,
    supabaseKey: undefined,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'ABC Roofing Co',
    logo: undefined,
    contactEmail: 'contact@abcroofing.com',
    contactPhone: '555-0200',
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    twentyApiUrl: 'https://crm.abcroofing.com/rest',
    twentyApiKey: 'mock-api-key-67890',
    supabaseUrl: undefined,
    supabaseKey: undefined,
    isActive: true,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Elite Exteriors',
    logo: undefined,
    contactEmail: 'info@eliteexteriors.com',
    contactPhone: '555-0300',
    address: '789 Pine Street',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    twentyApiUrl: 'https://crm.eliteexteriors.com/rest',
    twentyApiKey: 'mock-api-key-11111',
    supabaseUrl: undefined,
    supabaseKey: undefined,
    isActive: false,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
  },
];

// Mock user data
export const mockUsers: MockUser[] = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    companyName: 'Spartan Exteriors',
    name: 'Dylan DiRosa',
    email: 'dylan@thespartanexteriors.com',
    role: 'owner',
    isActive: true,
    lastLogin: new Date('2024-10-15').toISOString(),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    companyName: 'Spartan Exteriors',
    name: 'John Smith',
    email: 'john@thespartanexteriors.com',
    role: 'manager',
    isActive: true,
    lastLogin: new Date('2024-10-14').toISOString(),
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    companyName: 'Spartan Exteriors',
    name: 'Sarah Johnson',
    email: 'sarah@thespartanexteriors.com',
    role: 'salesperson',
    isActive: true,
    lastLogin: new Date('2024-10-15').toISOString(),
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    companyId: '550e8400-e29b-41d4-a716-446655440002',
    companyName: 'ABC Roofing Co',
    name: 'Mike Williams',
    email: 'mike@abcroofing.com',
    role: 'owner',
    isActive: true,
    lastLogin: new Date('2024-10-13').toISOString(),
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440005',
    companyId: '550e8400-e29b-41d4-a716-446655440002',
    companyName: 'ABC Roofing Co',
    name: 'Emily Davis',
    email: 'emily@abcroofing.com',
    role: 'salesperson',
    isActive: true,
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
  },
];

/**
 * Check if we're using mock data
 */
export function isUsingMockData(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseKey.includes('placeholder')
  );
}

/**
 * Log mock data usage warning
 */
export function logMockDataWarning() {
  if (isUsingMockData()) {
    console.warn(
      '\n⚠️  Using MOCK DATA for local development\n' +
      '   Supabase is not configured. Data will not persist.\n' +
      '   To use real database:\n' +
      '   1. Set up Supabase project at https://supabase.com\n' +
      '   2. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n' +
      '   3. Run migrations in Supabase SQL Editor\n'
    );
  }
}

/**
 * Mock database operations
 */
export class MockDatabase {
  private companies: Company[] = [...mockCompanies];
  private users: MockUser[] = [...mockUsers];

  // Companies
  getCompanies(): Company[] {
    return this.companies;
  }

  getCompanyById(id: string): Company | undefined {
    return this.companies.find((c) => c.id === id);
  }

  createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company {
    const newCompany: Company = {
      ...company,
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.companies.push(newCompany);
    return newCompany;
  }

  updateCompany(id: string, updates: Partial<Company>): Company | undefined {
    const index = this.companies.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    this.companies[index] = {
      ...this.companies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.companies[index];
  }

  deleteCompany(id: string): boolean {
    const index = this.companies.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.companies.splice(index, 1);
    // Also delete associated users
    this.users = this.users.filter((u) => u.companyId !== id);
    return true;
  }

  // Users
  getUsers(companyId?: string): MockUser[] {
    if (companyId) {
      return this.users.filter((u) => u.companyId === companyId);
    }
    return this.users;
  }

  getUserById(id: string): MockUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  createUser(user: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'>): MockUser {
    const company = this.getCompanyById(user.companyId);
    const newUser: MockUser = {
      ...user,
      companyName: company?.name || 'Unknown Company',
      id: `mock-user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<MockUser>): MockUser | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.users[index];
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }
}

// Global mock database instance for development
export const mockDb = new MockDatabase();
