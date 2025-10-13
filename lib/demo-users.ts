import { User, Permission } from '@/types';

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  master_admin: [
    'view_leads',
    'create_leads',
    'edit_leads',
    'delete_leads',
    'view_analytics',
    'manage_users',
    'view_settings',
    'edit_settings',
  ],
  owner: [
    'view_leads',
    'create_leads',
    'edit_leads',
    'delete_leads',
    'view_analytics',
    'manage_users',
    'view_settings',
    'edit_settings',
  ],
  manager: [
    'view_leads',
    'create_leads',
    'edit_leads',
    'delete_leads',
    'view_analytics',
    'view_settings',
  ],
  salesperson: [
    'view_leads',
    'create_leads',
    'edit_leads',
    'view_settings',
  ],
};

/**
 * Production users for authentication
 */
export const DEMO_USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Master Admin',
    email: 'dylandirosa980@gmail.com',
    role: 'master_admin',
    permissions: ROLE_PERMISSIONS.master_admin,
    avatar: undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: undefined,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Dylan DiRosa',
    email: 'dylan@thespartanexteriors.com',
    role: 'owner',
    permissions: ROLE_PERMISSIONS.owner,
    avatar: undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: undefined,
  },
];

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Authentication function
 */
export function authenticateUser(
  email: string,
  password: string
): User | null {
  // Check password
  if (password !== 'Bubs2shiesty$') {
    return null;
  }

  const user = DEMO_USERS.find((u) => u.email === email);
  if (!user) {
    return null;
  }

  // Return user with updated lastLoginAt
  return {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}
