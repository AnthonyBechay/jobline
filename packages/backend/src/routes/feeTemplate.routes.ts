import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { prisma } from '../index';

const router = Router();

// All fee template routes require Super Admin authentication
router.use(authenticate);
router.use(superAdminOnly);

// Get all fee templates (company-specific)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const companyId = req.user!.companyId;
    
    const feeTemplates = await prisma.feeTemplate.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    
    res.json(feeTemplates);
  } catch (error) {
    console.error('Get fee templates error:', error);
    res.status(500).json({ error: 'Failed to fetch fee templates' });
  }
});

// Get fee template by ID (company-specific)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const feeTemplate = await prisma.feeTemplate.findFirst({
      where: { 
        id,
        companyId,
      },
    });
    
    if (!feeTemplate) {
      res.status(404).json({ error: 'Fee template not found' });
      return;
    }
    
    res.json(feeTemplate);
  } catch (error) {
    console.error('Get fee template error:', error);
    res.status(500).json({ error: 'Failed to fetch fee template' });
  }
});

// Create new fee template (company-specific)
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('defaultPrice').isFloat({ min: 0 }).withMessage('Default price must be a positive number'),
    body('minPrice').isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    body('maxPrice').isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    body('currency').optional().isString(),
    body('nationality').optional().isString(),
    body('description').optional().trim(),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { name, defaultPrice, minPrice, maxPrice, currency = 'USD', nationality, description } = req.body;
      const companyId = req.user!.companyId;
      
      // Validate price range
      if (parseFloat(minPrice) > parseFloat(maxPrice)) {
        res.status(400).json({ error: 'Minimum price cannot be greater than maximum price' });
        return;
      }
      
      if (parseFloat(defaultPrice) < parseFloat(minPrice) || parseFloat(defaultPrice) > parseFloat(maxPrice)) {
        res.status(400).json({ error: 'Default price must be between minimum and maximum price' });
        return;
      }
      
      // Check if a template with this name already exists for this company
      const existingTemplate = await prisma.feeTemplate.findFirst({
        where: { 
          name,
          companyId,
        },
      });
      
      if (existingTemplate) {
        res.status(400).json({ error: 'A fee template with this name already exists' });
        return;
      }
      
      const feeTemplate = await prisma.feeTemplate.create({
        data: {
          name,
          defaultPrice,
          minPrice,
          maxPrice,
          currency,
          nationality,
          description,
          companyId,
        },
      });
      
      res.status(201).json(feeTemplate);
    } catch (error) {
      console.error('Create fee template error:', error);
      res.status(500).json({ error: 'Failed to create fee template' });
    }
  }
);

// Update fee template (company-specific)
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('defaultPrice').optional().isFloat({ min: 0 }),
    body('minPrice').optional().isFloat({ min: 0 }),
    body('maxPrice').optional().isFloat({ min: 0 }),
    body('currency').optional().isString(),
    body('nationality').optional().isString(),
    body('description').optional().trim(),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const companyId = req.user!.companyId;
      
      // Check template belongs to company
      const existingTemplate = await prisma.feeTemplate.findFirst({
        where: { id, companyId },
      });
      
      if (!existingTemplate) {
        res.status(404).json({ error: 'Fee template not found' });
        return;
      }
      
      // Validate price range if prices are being updated
      const newMinPrice = updateData.minPrice !== undefined ? parseFloat(updateData.minPrice) : parseFloat(existingTemplate.minPrice.toString());
      const newMaxPrice = updateData.maxPrice !== undefined ? parseFloat(updateData.maxPrice) : parseFloat(existingTemplate.maxPrice.toString());
      const newDefaultPrice = updateData.defaultPrice !== undefined ? parseFloat(updateData.defaultPrice) : parseFloat(existingTemplate.defaultPrice.toString());
      
      if (newMinPrice > newMaxPrice) {
        res.status(400).json({ error: 'Minimum price cannot be greater than maximum price' });
        return;
      }
      
      if (newDefaultPrice < newMinPrice || newDefaultPrice > newMaxPrice) {
        res.status(400).json({ error: 'Default price must be between minimum and maximum price' });
        return;
      }
      
      // Check for duplicate name if name is being changed
      if (updateData.name && updateData.name !== existingTemplate.name) {
        const duplicateTemplate = await prisma.feeTemplate.findFirst({
          where: { 
            name: updateData.name,
            companyId,
            NOT: { id },
          },
        });
        
        if (duplicateTemplate) {
          res.status(400).json({ error: 'A fee template with this name already exists' });
          return;
        }
      }
      
      const feeTemplate = await prisma.feeTemplate.update({
        where: { id },
        data: updateData,
      });
      
      res.json(feeTemplate);
    } catch (error) {
      console.error('Update fee template error:', error);
      res.status(500).json({ error: 'Failed to update fee template' });
    }
  }
);

// Delete fee template (company-specific)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    // Check template belongs to company
    const template = await prisma.feeTemplate.findFirst({
      where: { id, companyId },
    });
    
    if (!template) {
      res.status(404).json({ error: 'Fee template not found' });
      return;
    }
    
    // Check if template is being used by any applications
    const applicationsCount = await prisma.application.count({
      where: { feeTemplateId: id },
    });
    
    if (applicationsCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete fee template that is being used by applications' 
      });
      return;
    }
    
    await prisma.feeTemplate.delete({
      where: { id },
    });
    
    res.json({ message: 'Fee template deleted successfully' });
  } catch (error) {
    console.error('Delete fee template error:', error);
    res.status(500).json({ error: 'Failed to delete fee template' });
  }
});

export default router;
