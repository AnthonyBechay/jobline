import { auth } from './auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Session, User } from './auth';
import { hasPermission, type Permission, type UserRole } from './rbac';

export const getSession = cache(async (): Promise<{ session: Session; user: User } | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    return session as { session: Session; user: User };
  } catch (error) {
    return null;
  }
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const sessionData = await getSession();
  return sessionData?.user ?? null;
});

export const requireAuth = cache(async (): Promise<{ session: Session; user: User }> => {
  const sessionData = await getSession();

  if (!sessionData) {
    redirect('/login');
  }

  return sessionData;
});

export const requireRole = cache(
  async (allowedRoles: string[]): Promise<{ session: Session; user: User }> => {
    const sessionData = await requireAuth();

    if (!sessionData.user.role || !allowedRoles.includes(sessionData.user.role)) {
      redirect('/unauthorized');
    }

    return sessionData;
  }
);

export const requireSuperAdmin = cache(async (): Promise<{ session: Session; user: User }> => {
  return requireRole(['SUPER_ADMIN']);
});

export const requireAdmin = cache(async (): Promise<{ session: Session; user: User }> => {
  return requireRole(['SUPER_ADMIN', 'ADMIN']);
});

/**
 * Require specific permission
 * Throws error if user doesn't have permission
 */
export const requirePermission = cache(
  async (permission: Permission): Promise<{ session: Session; user: User }> => {
    const sessionData = await requireAuth();
    const userRole = sessionData.user.role as UserRole;

    if (!hasPermission(userRole, permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }

    return sessionData;
  }
);

/**
 * Check if current user has a specific permission
 * Returns boolean, doesn't throw
 */
export const checkPermission = cache(async (permission: Permission): Promise<boolean> => {
  try {
    const sessionData = await getSession();
    if (!sessionData) return false;

    const userRole = sessionData.user.role as UserRole;
    return hasPermission(userRole, permission);
  } catch {
    return false;
  }
});
