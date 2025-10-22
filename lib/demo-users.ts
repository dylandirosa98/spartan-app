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
 * Checks both demo users (admin) and database users (company users)
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  // 1. Check if it's the master admin (hardcoded)
  const adminUser = DEMO_USERS.find(u => u.email === email && u.role === 'master_admin');
  if (adminUser && password === 'Bubs2shiesty$') {
    return {
      ...adminUser,
      lastLoginAt: new Date().toISOString(),
    };
  }

  // 2. Check company users via API
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const { user } = await response.json();

    // Convert to User type with permissions
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      permissions: getPermissionsForRole(user.role),
      avatar: undefined,
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database login error:', error);

    // Fallback: check original DEMO_USERS for company owner
    const demoUser = DEMO_USERS.find((u) => u.email === email);
    if (demoUser && password === 'Bubs2shiesty$') {
      return {
        ...demoUser,
        lastLoginAt: new Date().toISOString(),
      };
    }

    return null;
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}
