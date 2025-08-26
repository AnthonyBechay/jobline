import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all brokers (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const brokers = await prisma.broker.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    res.json(brokers);
  } catch (error) {
    console.error('Get brokers error:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Create broker (company-specific)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, contactDetails } = req.body;
    const companyId = req.user!.companyId;
    
    const broker = await prisma.broker.create({
      data: {
        name,
        contactDetails,
        companyId,
      },
    });
    
    res.status(201).json(broker);
  } catch (error) {
    console.error('Create broker error:', error);
    res.status(500).json({ error: 'Failed to create broker' });
  }
});

// Update broker (company-specific)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, contactDetails } = req.body;
    const companyId = req.user!.companyId;
    
    // Check broker belongs to company
    const existingBroker = await prisma.broker.findFirst({
      where: { id, companyId },
    });
    
    if (!existingBroker) {
      res.status(404).json({ error: 'Broker not found' });
      return;
    }
    
    const broker = await prisma.broker.update({
      where: { id },
      data: {
        name,
        contactDetails,
      },
    });
    
    res.json(broker);
  } catch (error) {
    console.error('Update broker error:', error);
    res.status(500).json({ error: 'Failed to update broker' });
  }
});

// Delete broker (company-specific)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check broker belongs to company
    const broker = await prisma.broker.findFirst({
      where: { id, companyId },
    });
    
    if (!broker) {
      res.status(404).json({ error: 'Broker not found' });
      return;
    }
    
    // Check if broker has applications
    const applicationsCount = await prisma.application.count({
      where: { brokerId: id },
    });
    
    if (applicationsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete broker with existing applications' 
      });
      return;
    }
    
    await prisma.broker.delete({
      where: { id },
    });
    
    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    console.error('Delete broker error:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

export default router;