import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// All routes require authentication and Super Admin role
router.use(authenticate);
router.use(superAdminOnly);

// Get all cost types for the company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const costTypes = await prisma.costTypeModel.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    
    res.json(costTypes);
  } catch (error) {
    console.error('Get cost types error:', error);
    res.status(500).json({ error: 'Failed to fetch cost types' });
  }
});

// Create a new cost type
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, active = true } = req.body;
    const companyId = req.user!.companyId;
    
    // Check if cost type with same name already exists
    const existing = await prisma.costTypeModel.findFirst({
      where: { companyId, name },
    });
    
    if (existing) {
      res.status(400).json({ error: 'Cost type with this name already exists' });
      return;
    }
    
    const costType = await prisma.costTypeModel.create({
      data: {
        name,
        description,
        active,
        companyId,
      },
    });
    
    res.status(201).json(costType);
  } catch (error) {
    console.error('Create cost type error:', error);
    res.status(500).json({ error: 'Failed to create cost type' });
  }
});

// Update a cost type
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;
    const companyId = req.user!.companyId;
    
    // Check if cost type belongs to company
    const existing = await prisma.costTypeModel.findFirst({
      where: { id, companyId },
    });
    
    if (!existing) {
      res.status(404).json({ error: 'Cost type not found' });
      return;
    }
    
    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.costTypeModel.findFirst({
        where: { 
          companyId, 
          name,
          NOT: { id },
        },
      });
      
      if (duplicate) {
        res.status(400).json({ error: 'Cost type with this name already exists' });
        return;
      }
    }
    
    const costType = await prisma.costTypeModel.update({
      where: { id },
      data: {
        name,
        description,
        active,
      },
    });
    
    res.json(costType);
  } catch (error) {
    console.error('Update cost type error:', error);
    res.status(500).json({ error: 'Failed to update cost type' });
  }
});

// Delete a cost type
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check if cost type belongs to company
    const costType = await prisma.costTypeModel.findFirst({
      where: { id, companyId },
    });
    
    if (!costType) {
      res.status(404).json({ error: 'Cost type not found' });
      return;
    }
    
    // Check if cost type is being used
    const costsCount = await prisma.cost.count({
      where: { costType: costType.name },
    });
    
    if (costsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete cost type that is being used by costs' 
      });
      return;
    }
    
    await prisma.costTypeModel.delete({
      where: { id },
    });
    
    res.json({ message: 'Cost type deleted successfully' });
  } catch (error) {
    console.error('Delete cost type error:', error);
    res.status(500).json({ error: 'Failed to delete cost type' });
  }
});

export default router;
