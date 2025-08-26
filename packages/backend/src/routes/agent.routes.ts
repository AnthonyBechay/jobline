import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(superAdminOnly);

// Get all agents (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const agents = await prisma.agent.findMany({
      where: { companyId },
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

// Create agent (company-specific)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, contactDetails } = req.body;
    const companyId = req.user!.companyId;
    
    const agent = await prisma.agent.create({
      data: {
        name,
        contactDetails,
        companyId,
      },
    });
    
    res.status(201).json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent (company-specific)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, contactDetails } = req.body;
    const companyId = req.user!.companyId;
    
    // Check agent belongs to company
    const existingAgent = await prisma.agent.findFirst({
      where: { id, companyId },
    });
    
    if (!existingAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
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

// Delete agent (company-specific)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check agent belongs to company
    const agent = await prisma.agent.findFirst({
      where: { id, companyId },
    });
    
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
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