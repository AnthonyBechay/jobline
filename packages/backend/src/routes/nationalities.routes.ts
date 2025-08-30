import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Get all nationalities for the company
router.get('/', authenticate, async (req: any, res) => {
  try {
    const nationalities = await prisma.nationality.findMany({
      where: {
        companyId: req.user.companyId,
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(nationalities);
  } catch (error) {
    console.error('Error fetching nationalities:', error);
    res.status(500).json({ error: 'Failed to fetch nationalities' });
  }
});

// Create nationality (Super Admin only)
router.post('/', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: any, res) => {
  try {
    const { code, name, active = true } = req.body;

    // Check if nationality already exists
    const existing = await prisma.nationality.findUnique({
      where: {
        companyId_code: {
          companyId: req.user.companyId,
          code,
        },
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Nationality with this code already exists' });
      return;
    }

    const nationality = await prisma.nationality.create({
      data: {
        code,
        name,
        active,
        companyId: req.user.companyId,
      },
    });

    res.status(201).json(nationality);
  } catch (error) {
    console.error('Error creating nationality:', error);
    res.status(500).json({ error: 'Failed to create nationality' });
  }
});

// Update nationality (Super Admin only)
router.put('/:id', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { code, name, active } = req.body;

    const nationality = await prisma.nationality.update({
      where: {
        id,
        companyId: req.user.companyId,
      },
      data: {
        code,
        name,
        active,
      },
    });

    res.json(nationality);
  } catch (error) {
    console.error('Error updating nationality:', error);
    res.status(500).json({ error: 'Failed to update nationality' });
  }
});

// Delete nationality (Super Admin only)
router.delete('/:id', authenticate, authorize(UserRole.SUPER_ADMIN), async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if any candidates use this nationality
    const candidatesCount = await prisma.candidate.count({
      where: {
        nationality: {
          equals: (await prisma.nationality.findUnique({ where: { id } }))?.name,
        },
        companyId: req.user.companyId,
      },
    });

    if (candidatesCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete nationality that is in use by candidates' 
      });
      return;
    }

    await prisma.nationality.delete({
      where: {
        id,
        companyId: req.user.companyId,
      },
    });

    res.json({ message: 'Nationality deleted successfully' });
  } catch (error) {
    console.error('Error deleting nationality:', error);
    res.status(500).json({ error: 'Failed to delete nationality' });
  }
});

export default router;
