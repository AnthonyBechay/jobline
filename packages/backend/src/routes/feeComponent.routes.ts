import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '../index';
import { ImprovedFinancialService } from '../services/improvedFinancial.service';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all fee templates with components
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { nationality, serviceType } = req.query;
    const companyId = req.user!.companyId;

    const where: any = { companyId };
    if (nationality) where.nationality = nationality as string;
    if (serviceType) where.serviceType = serviceType as string;

    const feeTemplates = await prisma.feeTemplate.findMany({
      where,
      include: {
        feeComponents: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(feeTemplates);
  } catch (error) {
    console.error('Get fee templates error:', error);
    res.status(500).json({ error: 'Failed to fetch fee templates' });
  }
});

// Get single fee template with components
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const feeTemplate = await prisma.feeTemplate.findFirst({
      where: { id, companyId },
      include: {
        feeComponents: true
      }
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

// Create fee template with components (Super Admin only)
router.post('/',
  authorize(UserRole.SUPER_ADMIN),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('defaultPrice').isFloat({ min: 0 }).withMessage('Default price must be a positive number'),
    body('minPrice').isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    body('maxPrice').isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    body('components').isArray().withMessage('Components must be an array'),
    body('components.*.name').notEmpty().withMessage('Component name is required'),
    body('components.*.amount').isFloat({ min: 0 }).withMessage('Component amount must be positive'),
    body('components.*.isRefundable').isBoolean().withMessage('isRefundable must be boolean'),
    body('components.*.refundableAfterArrival').isBoolean().withMessage('refundableAfterArrival must be boolean'),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId;
      const data = req.body;

      const feeTemplate = await ImprovedFinancialService.createFeeTemplate(
        data,
        companyId
      );

      res.status(201).json(feeTemplate);
    } catch (error: any) {
      console.error('Create fee template error:', error);
      res.status(500).json({ error: error.message || 'Failed to create fee template' });
    }
  }
);

// Update fee template with components (Super Admin only)
router.put('/:id',
  authorize(UserRole.SUPER_ADMIN),
  [
    param('id').isUUID(),
    body('name').optional().notEmpty(),
    body('defaultPrice').optional().isFloat({ min: 0 }),
    body('minPrice').optional().isFloat({ min: 0 }),
    body('maxPrice').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      const { components, ...templateData } = req.body;

      // Update in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update template
        const feeTemplate = await tx.feeTemplate.update({
          where: { id },
          data: templateData
        });

        // If components provided, update them
        if (components && Array.isArray(components)) {
          // Delete existing components
          await tx.feeComponent.deleteMany({
            where: { feeTemplateId: id }
          });

          // Create new components
          await tx.feeComponent.createMany({
            data: components.map((c: any) => ({
              feeTemplateId: id,
              name: c.name,
              amount: c.amount,
              isRefundable: c.isRefundable,
              refundableAfterArrival: c.refundableAfterArrival,
              description: c.description
            }))
          });
        }

        return await tx.feeTemplate.findUnique({
          where: { id },
          include: { feeComponents: true }
        });
      });

      res.json(result);
    } catch (error: any) {
      console.error('Update fee template error:', error);
      res.status(500).json({ error: error.message || 'Failed to update fee template' });
    }
  }
);

// Delete fee template (Super Admin only)
router.delete('/:id',
  authorize(UserRole.SUPER_ADMIN),
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      // Check if template is in use
      const applicationsCount = await prisma.application.count({
        where: { feeTemplateId: id }
      });

      if (applicationsCount > 0) {
        res.status(400).json({ 
          error: 'Cannot delete fee template that is in use by applications' 
        });
        return;
      }

      await prisma.feeTemplate.delete({
        where: { id }
      });

      res.json({ message: 'Fee template deleted successfully' });
    } catch (error) {
      console.error('Delete fee template error:', error);
      res.status(500).json({ error: 'Failed to delete fee template' });
    }
  }
);

// Initialize default templates (Super Admin only)
router.post('/initialize-defaults',
  authorize(UserRole.SUPER_ADMIN),
  async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId;

      await ImprovedFinancialService.createDefaultFeeTemplates(companyId);
      await ImprovedFinancialService.createDefaultCancellationSettings(companyId);

      res.json({ message: 'Default templates and settings created successfully' });
    } catch (error: any) {
      console.error('Initialize defaults error:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize defaults' });
    }
  }
);

export default router;
