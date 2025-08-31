import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// All routes require authentication and Super Admin role
router.use(authenticate);
router.use(superAdminOnly);

// Get all service types for the company
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const serviceTypes = await prisma.serviceType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    
    res.json(serviceTypes);
  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({ error: 'Failed to fetch service types' });
  }
});

// Create a new service type
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, active = true } = req.body;
    const companyId = req.user!.companyId;
    
    // Check if service type with same name already exists
    const existing = await prisma.serviceType.findFirst({
      where: { companyId, name },
    });
    
    if (existing) {
      res.status(400).json({ error: 'Service type with this name already exists' });
      return;
    }
    
    const serviceType = await prisma.serviceType.create({
      data: {
        name,
        description,
        active,
        companyId,
      },
    });
    
    res.status(201).json(serviceType);
  } catch (error) {
    console.error('Create service type error:', error);
    res.status(500).json({ error: 'Failed to create service type' });
  }
});

// Update a service type
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;
    const companyId = req.user!.companyId;
    
    // Check if service type belongs to company
    const existing = await prisma.serviceType.findFirst({
      where: { id, companyId },
    });
    
    if (!existing) {
      res.status(404).json({ error: 'Service type not found' });
      return;
    }
    
    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.serviceType.findFirst({
        where: { 
          companyId, 
          name,
          NOT: { id },
        },
      });
      
      if (duplicate) {
        res.status(400).json({ error: 'Service type with this name already exists' });
        return;
      }
    }
    
    const serviceType = await prisma.serviceType.update({
      where: { id },
      data: {
        name,
        description,
        active,
      },
    });
    
    res.json(serviceType);
  } catch (error) {
    console.error('Update service type error:', error);
    res.status(500).json({ error: 'Failed to update service type' });
  }
});

// Delete a service type
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check if service type belongs to company
    const serviceType = await prisma.serviceType.findFirst({
      where: { id, companyId },
    });
    
    if (!serviceType) {
      res.status(404).json({ error: 'Service type not found' });
      return;
    }
    
    // Check if service type is being used in fee templates
    const feeTemplatesCount = await prisma.feeTemplate.count({
      where: { serviceType: serviceType.name },
    });
    
    if (feeTemplatesCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete service type that is being used by fee templates' 
      });
      return;
    }
    
    await prisma.serviceType.delete({
      where: { id },
    });
    
    res.json({ message: 'Service type deleted successfully' });
  } catch (error) {
    console.error('Delete service type error:', error);
    res.status(500).json({ error: 'Failed to delete service type' });
  }
});

export default router;
