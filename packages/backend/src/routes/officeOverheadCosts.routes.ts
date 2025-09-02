import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { OfficeOverheadCostsService } from '../services/officeOverheadCosts.service';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication and Super Admin access
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

// Create new overhead cost
router.post('/',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('currency').optional().isString(),
    body('costDate').optional().isISO8601(),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('description').optional().trim(),
    body('recurring').optional().isBoolean(),
    body('recurringFrequency').optional().isIn(['monthly', 'quarterly', 'yearly'])
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const {
        name,
        description,
        amount,
        currency,
        costDate,
        category,
        recurring,
        recurringFrequency
      } = req.body;

      const companyId = req.user!.companyId;
      const createdBy = req.user!.id;

      const overheadCost = await OfficeOverheadCostsService.createOverheadCost(
        {
          name,
          description,
          amount,
          currency,
          costDate: costDate ? new Date(costDate) : undefined,
          category,
          recurring,
          recurringFrequency
        },
        createdBy,
        companyId
      );

      res.status(201).json(overheadCost);
    } catch (error) {
      console.error('Create overhead cost error:', error);
      res.status(500).json({ error: 'Failed to create overhead cost' });
    }
  }
);

// Get overhead costs with filters
router.get('/',
  [
    query('category').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('recurring').optional().isBoolean(),
    query('createdBy').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const {
        category,
        dateFrom,
        dateTo,
        recurring,
        createdBy,
        limit,
        offset
      } = req.query;

      const companyId = req.user!.companyId;

      const result = await OfficeOverheadCostsService.getOverheadCosts(
        {
          category: category as string,
          dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
          dateTo: dateTo ? new Date(dateTo as string) : undefined,
          recurring: recurring ? recurring === 'true' : undefined,
          createdBy: createdBy as string,
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined
        },
        companyId
      );

      res.json(result);
    } catch (error) {
      console.error('Get overhead costs error:', error);
      res.status(500).json({ error: 'Failed to get overhead costs' });
    }
  }
);

// Get overhead cost by ID
router.get('/:id',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const overheadCost = await OfficeOverheadCostsService.getOverheadCostById(
        id,
        companyId
      );

      if (!overheadCost) {
        res.status(404).json({ error: 'Overhead cost not found' });
        return;
      }

      res.json(overheadCost);
    } catch (error) {
      console.error('Get overhead cost error:', error);
      res.status(500).json({ error: 'Failed to get overhead cost' });
    }
  }
);

// Update overhead cost
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('amount').optional().isFloat({ min: 0 }),
    body('currency').optional().isString(),
    body('costDate').optional().isISO8601(),
    body('category').optional().trim(),
    body('recurring').optional().isBoolean(),
    body('recurringFrequency').optional().isIn(['monthly', 'quarterly', 'yearly'])
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        amount,
        currency,
        costDate,
        category,
        recurring,
        recurringFrequency
      } = req.body;

      const companyId = req.user!.companyId;

      const overheadCost = await OfficeOverheadCostsService.updateOverheadCost(
        id,
        {
          name,
          description,
          amount,
          currency,
          costDate: costDate ? new Date(costDate) : undefined,
          category,
          recurring,
          recurringFrequency
        },
        companyId
      );

      res.json(overheadCost);
    } catch (error) {
      console.error('Update overhead cost error:', error);
      res.status(500).json({ error: 'Failed to update overhead cost' });
    }
  }
);

// Delete overhead cost
router.delete('/:id',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      await OfficeOverheadCostsService.deleteOverheadCost(id, companyId);

      res.json({ message: 'Overhead cost deleted successfully' });
    } catch (error) {
      console.error('Delete overhead cost error:', error);
      res.status(500).json({ error: 'Failed to delete overhead cost' });
    }
  }
);

// Get overhead cost summary
router.get('/summary/overview',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const companyId = req.user!.companyId;

      const summary = await OfficeOverheadCostsService.getOverheadCostSummary(
        companyId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json(summary);
    } catch (error) {
      console.error('Get overhead cost summary error:', error);
      res.status(500).json({ error: 'Failed to get overhead cost summary' });
    }
  }
);

// Get recurring cost projection
router.get('/summary/recurring-projection',
  async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId;

      const projection = await OfficeOverheadCostsService.getRecurringCostProjection(
        companyId
      );

      res.json(projection);
    } catch (error) {
      console.error('Get recurring cost projection error:', error);
      res.status(500).json({ error: 'Failed to get recurring cost projection' });
    }
  }
);

// Get available categories
router.get('/categories/list',
  async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId;

      const categories = await OfficeOverheadCostsService.getCategories(companyId);

      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }
);

// Get cost trends over time
router.get('/trends/over-time',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { months = 12 } = req.query;
      const companyId = req.user!.companyId;

      const trends = await OfficeOverheadCostsService.getCostTrends(
        companyId,
        Number(months)
      );

      res.json(trends);
    } catch (error) {
      console.error('Get cost trends error:', error);
      res.status(500).json({ error: 'Failed to get cost trends' });
    }
  }
);

export default router;
