'use client';

import { useSession } from '@/hooks/use-auth';
import { hasPermission, type Permission, type UserRole } from '@/lib/rbac';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side component to conditionally render content based on user permissions
 * Usage: <PermissionGuard permission="viewFinancials">Content</PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userRole = (session.user as any).role as UserRole;
  const allowed = hasPermission(userRole, permission);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side component to conditionally render content based on user role
 * Usage: <RoleGuard allowedRoles={['SUPER_ADMIN']}>Content</RoleGuard>
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userRole = (session.user as any).role as UserRole;
  const allowed = allowedRoles.includes(userRole);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
