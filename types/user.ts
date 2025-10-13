import { z } from 'zod';

/**
 * User roles in Spartan CRM
 */
export type UserRole = 'owner' | 'manager' | 'salesperson';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
}

/**
 * User permissions based on role
 */
export interface UserPermissions {
  canViewAllLeads: boolean;
  canEditAllLeads: boolean;
  canDeleteLeads: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
}

/**
 * Get permissions for a user role
 */
export function getRolePermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'owner':
      return {
        canViewAllLeads: true,
        canEditAllLeads: true,
        canDeleteLeads: true,
        canViewAnalytics: true,
        canManageUsers: true,
        canManageSettings: true,
        canExportData: true,
      };
    case 'manager':
      return {
        canViewAllLeads: true,
        canEditAllLeads: true,
        canDeleteLeads: true,
        canViewAnalytics: true,
        canManageUsers: false,
        canManageSettings: false,
        canExportData: true,
      };
    case 'salesperson':
      return {
        canViewAllLeads: false, // Can only view own leads
        canEditAllLeads: false, // Can only edit own leads
        canDeleteLeads: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManageSettings: false,
        canExportData: false,
      };
    default:
      return {
        canViewAllLeads: false,
        canEditAllLeads: false,
        canDeleteLeads: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManageSettings: false,
        canExportData: false,
      };
  }
}

/**
 * Zod schema for User validation
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['owner', 'manager', 'salesperson']),
  createdAt: z.string().datetime(),
  lastLogin: z.string().datetime().optional(),
});

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export const LoginCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
