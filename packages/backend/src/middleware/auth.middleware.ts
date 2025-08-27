import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// Extend Express Request interface
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId: string;
  };
}

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'jobline-secret-key-2025';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Convenience middleware for Super Admin only routes
export const superAdminOnly = authorize(UserRole.SUPER_ADMIN);

// Convenience middleware for Admin and Super Admin routes
export const adminOnly = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);