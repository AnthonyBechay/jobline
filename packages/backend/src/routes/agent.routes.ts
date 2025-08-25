import { Router } from 'express';
import { authenticate, superAdminOnly } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all agents
router.get('/', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Create agent
router.post('/', async (req, res) => {
  try {
    const { name, contactDetails } = req.body;
    
    const agent = await prisma.agent.create({
      data: {
        name,
        contactDetails,
      },
    });
    
    res.status(201).json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactDetails } = req.body;
    
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name,
        contactDetails,
      },
    });
    
    res.json(agent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if agent has candidates
    const candidatesCount = await prisma.candidate.count({
      where: { agentId: id },
    });
    
    if (candidatesCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete agent with existing candidates' 
      });
      return;
    }
    
    await prisma.agent.delete({
      where: { id },
    });
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export default router;
