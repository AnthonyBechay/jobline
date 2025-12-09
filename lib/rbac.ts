/**
 * Role-Based Access Control (RBAC) System
 * Enforces permission checks throughout the application
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    // Full access to everything
    viewFinancials: true,
    editFinancials: true,
    viewProfitability: true,
    viewCosts: true,
    editCosts: true,
    manageUsers: true,
    manageSettings: true,
    manageCandidates: true,
    manageClients: true,
    manageApplications: true,
    viewReports: true,
    exportData: true,
  },
  ADMIN: {
    // Operational access only - no financial/profitability access
    viewFinancials: false,
    editFinancials: false,
    viewProfitability: false,
    viewCosts: false,
    editCosts: false,
    manageUsers: false,
    manageSettings: false,
    manageCandidates: true,
    manageClients: true,
    manageApplications: true,
    viewReports: false,
    exportData: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Route protection configuration
 * Maps routes to required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/financial': ['viewFinancials'],
  '/financial/payments': ['viewFinancials'],
  '/financial/costs': ['viewCosts'],
  '/financial/fee-templates': ['manageSettings'],
  '/settings': ['manageSettings'],
  '/api/pdf/financial-report': ['viewReports'],
};

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    // No specific permissions required, allow access
    return true;
  }

  return hasAllPermissions(role, requiredPermissions);
}
