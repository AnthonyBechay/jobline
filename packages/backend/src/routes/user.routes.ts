import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticate);

// Get all users (Super Admin only)
router.get('/', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
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

// Get user by ID (Super Admin only)
router.get('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
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

// Update user (Super Admin only)
router.put('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    
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

// Delete user (Super Admin only)
router.delete('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id === req.user?.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
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
