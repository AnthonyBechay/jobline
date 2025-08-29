import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { prisma } from '../index';

const router = Router();

// All document template routes require authentication
router.use(authenticate);

// Get all document templates (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const templates = await prisma.documentTemplate.findMany({
      where: { companyId },
      orderBy: [{ stage: 'asc' }, { order: 'asc' }],
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get document templates error:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
});

// Get document template by ID (company-specific)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const template = await prisma.documentTemplate.findFirst({
      where: { 
        id,
        companyId,
      },
    });
    
    if (!template) {
      res.status(404).json({ error: 'Document template not found' });
      return;
    }
    
    res.json(template);
  } catch (error) {
    console.error('Get document template error:', error);
    res.status(500).json({ error: 'Failed to fetch document template' });
  }
});

// Create new document template (Super Admin only, company-specific)
router.post(
  '/',
  superAdminOnly,
  [
    body('stage').notEmpty().withMessage('Stage is required'),
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('required').optional().isBoolean(),
    body('requiredFrom').optional().isIn(['office', 'client']).withMessage('Must be either office or client'),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { stage, name, required = true, requiredFrom = 'office', order = 0 } = req.body;
      const companyId = req.user!.companyId;
      
      // Check if a template with this name and stage already exists
      const existingTemplate = await prisma.documentTemplate.findFirst({
        where: { 
          stage,
          name,
          companyId,
        },
      });
      
      if (existingTemplate) {
        res.status(400).json({ error: 'A document template with this name already exists for this stage' });
        return;
      }
      
      const template = await prisma.documentTemplate.create({
        data: {
          stage,
          name,
          required,
          requiredFrom,
          order,
          companyId,
        },
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error('Create document template error:', error);
      res.status(500).json({ error: 'Failed to create document template' });
    }
  }
);

// Update document template (Super Admin only, company-specific)
router.put(
  '/:id',
  superAdminOnly,
  [
    param('id').isUUID(),
    body('stage').optional(),
    body('name').optional().trim(),
    body('required').optional().isBoolean(),
    body('requiredFrom').optional().isIn(['office', 'client']),
    body('order').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const companyId = req.user!.companyId;
      
      // Check template belongs to company
      const existingTemplate = await prisma.documentTemplate.findFirst({
        where: { id, companyId },
      });
      
      if (!existingTemplate) {
        res.status(404).json({ error: 'Document template not found' });
        return;
      }
      
      // Check for duplicate name if name is being changed
      if (updateData.name && updateData.name !== existingTemplate.name) {
        const stage = updateData.stage || existingTemplate.stage;
        const duplicateTemplate = await prisma.documentTemplate.findFirst({
          where: { 
            stage,
            name: updateData.name,
            companyId,
            NOT: { id },
          },
        });
        
        if (duplicateTemplate) {
          res.status(400).json({ error: 'A document template with this name already exists for this stage' });
          return;
        }
      }
      
      const template = await prisma.documentTemplate.update({
        where: { id },
        data: updateData,
      });
      
      res.json(template);
    } catch (error) {
      console.error('Update document template error:', error);
      res.status(500).json({ error: 'Failed to update document template' });
    }
  }
);

// Delete document template (Super Admin only, company-specific)
router.delete('/:id', superAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check template belongs to company
    const template = await prisma.documentTemplate.findFirst({
      where: { id, companyId },
    });
    
    if (!template) {
      res.status(404).json({ error: 'Document template not found' });
      return;
    }
    
    await prisma.documentTemplate.delete({
      where: { id },
    });
    
    res.json({ message: 'Document template deleted successfully' });
  } catch (error) {
    console.error('Delete document template error:', error);
    res.status(500).json({ error: 'Failed to delete document template' });
  }
});

// Get document templates by stage (company-specific)
router.get('/stage/:stage', async (req: AuthRequest, res) => {
  try {
    const { stage } = req.params;
    const companyId = req.user!.companyId;
    
    const templates = await prisma.documentTemplate.findMany({
      where: { 
        stage: stage as any,
        companyId,
      },
      orderBy: { order: 'asc' },
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Get document templates by stage error:', error);
    res.status(500).json({ error: 'Failed to fetch document templates' });
  }
});

export default router;
