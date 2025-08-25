import { Router } from 'express';
import { authenticate, superAdminOnly } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all brokers
router.get('/', async (req, res) => {
  try {
    const brokers = await prisma.broker.findMany({
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

// Create broker
router.post('/', async (req, res) => {
  try {
    const { name, contactDetails } = req.body;
    
    const broker = await prisma.broker.create({
      data: {
        name,
        contactDetails,
      },
    });
    
    res.status(201).json(broker);
  } catch (error) {
    console.error('Create broker error:', error);
    res.status(500).json({ error: 'Failed to create broker' });
  }
});

// Update broker
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactDetails } = req.body;
    
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

// Delete broker
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
