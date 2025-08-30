import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticate);

// Create new user (Super Admin only)
router.post('/', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role } = req.body;
    const companyId = req.user!.companyId;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        companyId, // Same company as the super admin
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users (Super Admin only) - filtered by company
router.get('/', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const users = await prisma.user.findMany({
      where: { companyId }, // Filter by company
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (Super Admin only) - company-specific
router.get('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const user = await prisma.user.findFirst({
      where: { 
        id,
        companyId // Ensure user belongs to same company
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (Super Admin only) - company-specific
router.put('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    const { name, email, role, password } = req.body;
    
    // Check user belongs to same company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId },
    });
    
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const updateData: any = { name, email, role };
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Super Admin only) - company-specific
router.delete('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Prevent deleting yourself
    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }
    
    // Check user belongs to same company
    const userToDelete = await prisma.user.findFirst({
      where: { id, companyId },
    });
    
    if (!userToDelete) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await prisma.user.delete({
      where: { id },
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
