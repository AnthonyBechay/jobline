import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { seedCompanyData } from '../scripts/seedCompany';

// Generate JWT token
const generateToken = (user: { id: string; name: string; email: string; role: UserRole; companyId: string }): string => {
  const payload = { 
    id: user.id,
    name: user.name, 
    email: user.email, 
    role: user.role,
    companyId: user.companyId 
  };
  const secret = process.env.JWT_SECRET || 'jobline-secret-key-2025';
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

// Register - creates a new company/office with Super Admin
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      email, 
      password, 
      companyName,
      companyPhone,
      companyAddress,
      companyEmail
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !companyName) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Name, email, password, and company name are required' 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company/office with details
      const company = await tx.company.create({
        data: {
          name: companyName,
          phone: companyPhone || null,
          address: companyAddress || null,
          email: companyEmail || null,
        },
      });

      // Create the super admin user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          companyId: company.id,
        },
      });

      return { user, company };
    });

    // Seed default data for the new company (outside transaction)
    try {
      await seedCompanyData(result.company.id);
      console.log(`Successfully seeded data for company: ${result.company.name}`);
    } catch (seedError) {
      console.error('Failed to seed company data:', seedError);
      // Don't fail the registration if seeding fails
      // The company can still be seeded later using the script
    }

    // Generate token
    const token = generateToken({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
    });

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        company: {
          id: result.company.id,
          name: result.company.name,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, companyName } = req.body;

    // Find user with company
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify company name matches
    if (user.company.name.toLowerCase() !== companyName.toLowerCase()) {
      res.status(401).json({ error: 'Invalid company name for this user' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user - FIXED: Use include instead of both include and select
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { 
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return only the fields we need
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      company: user.company,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Create new user (only SUPER_ADMIN can do this, within their company)
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Get the super admin's company
    const superAdmin = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!superAdmin) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in the same company
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || UserRole.ADMIN,
        companyId: superAdmin.companyId,
      },
      include: { 
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};