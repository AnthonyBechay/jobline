import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FinancialStrategyService } from '../services/financialStrategy.service';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '../index';

const router = Router();

// Helper function to get cancellation type name
function getCancellationTypeName(type: string): string {
  switch (type) {
    case 'pre_arrival':
    case 'pre_arrival_client':
      return 'Pre-Arrival Client Cancellation';
    case 'pre_arrival_candidate':
      return 'Pre-Arrival Candidate Cancellation';
    case 'post_arrival_within_3_months':
      return 'Post-Arrival Within 3 Months';
    case 'post_arrival_after_3_months':
      return 'Post-Arrival After 3 Months';
    case 'candidate_cancellation':
      return 'Candidate Cancellation';
    default:
      return type;
  }
}

// All routes require authentication and Super Admin access
router.use((req, res, next) => {
  console.log('🔐 Business Settings: Checking authentication for', req.path);
  next();
});
router.use(authenticate);
router.use((req, res, next) => {
  console.log('👤 Business Settings: User authenticated:', req.user?.email, 'Role:', req.user?.role);
  next();
});
router.use(authorize(UserRole.SUPER_ADMIN));
router.use((req, res, next) => {
  console.log('✅ Business Settings: Authorization passed for', req.user?.email);
  next();
});

// Cancellation Settings Routes

// Get all cancellation settings
router.get('/cancellation',
  async (req: AuthRequest, res) => {
    try {
      console.log('🔧 Fetching cancellation settings for company:', req.user?.companyId);
      const companyId = req.user!.companyId;

      const settings = await prisma.cancellationSetting.findMany({
        where: { companyId },
        orderBy: { cancellationType: 'asc' }
      });

      console.log('✅ Found', settings.length, 'cancellation settings');
      
      // Ensure all settings have a name field (for backward compatibility)
      const settingsWithNames = settings.map(setting => ({
        ...setting,
        name: setting.name || getCancellationTypeName(setting.cancellationType)
      }));
      
      // If no settings exist, return empty array (frontend will handle this)
      res.json({ data: settingsWithNames || [] });
    } catch (error) {
      console.error('❌ Get cancellation settings error:', error);
      res.status(500).json({ error: 'Failed to get cancellation settings' });
    }
  }
);

// Create or update cancellation setting
router.post('/cancellation',
  [
    body('cancellationType').isIn(['pre_arrival_client', 'pre_arrival_candidate', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation']).withMessage('Invalid cancellation type'),
    body('penaltyFee').isFloat({ min: 0 }).withMessage('Penalty fee must be a positive number'),
    body('refundPercentage').isFloat({ min: 0, max: 100 }).withMessage('Refund percentage must be between 0 and 100'),
    body('nonRefundableComponents').isArray().withMessage('Non-refundable components must be an array'),
    body('monthlyServiceFee').isFloat({ min: 0 }).withMessage('Monthly service fee must be a positive number'),
    body('active').isBoolean().withMessage('Active must be a boolean')
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      console.log('🔧 Creating/updating cancellation setting:', req.body.cancellationType);
      const companyId = req.user!.companyId;

      const setting = await prisma.cancellationSetting.upsert({
        where: {
          companyId_cancellationType: {
            companyId,
            cancellationType: req.body.cancellationType
          }
        },
        update: {
          penaltyFee: req.body.penaltyFee,
          refundPercentage: req.body.refundPercentage,
          name: req.body.name || req.body.cancellationType,
          nonRefundableComponents: req.body.nonRefundableComponents,
          monthlyServiceFee: req.body.monthlyServiceFee,
          maxRefundAmount: req.body.maxRefundAmount,
          description: req.body.description,
          active: req.body.active
        },
        create: {
          companyId,
          cancellationType: req.body.cancellationType,
          penaltyFee: req.body.penaltyFee,
          refundPercentage: req.body.refundPercentage,
          name: req.body.name || req.body.cancellationType,
          nonRefundableComponents: req.body.nonRefundableComponents,
          monthlyServiceFee: req.body.monthlyServiceFee,
          maxRefundAmount: req.body.maxRefundAmount,
          description: req.body.description,
          active: req.body.active
        }
      });

      console.log('✅ Cancellation setting saved:', setting.cancellationType);
      res.json({ data: setting });
    } catch (error) {
      console.error('❌ Create/update cancellation setting error:', error);
      res.status(500).json({ error: 'Failed to save cancellation setting' });
    }
  }
);

// Get cancellation setting by type
router.get('/cancellation/:type',
  [
    param('type').isIn(['pre_arrival_client', 'pre_arrival_candidate', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation'])
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { type } = req.params;
      const companyId = req.user!.companyId;

      const setting = await prisma.cancellationSetting.findFirst({
        where: { 
          companyId,
          cancellationType: type
        }
      });

      if (!setting) {
        res.status(404).json({ error: 'Cancellation setting not found' });
        return;
      }

      res.json(setting);
    } catch (error) {
      console.error('Get cancellation setting error:', error);
      res.status(500).json({ error: 'Failed to get cancellation setting' });
    }
  }
);

// Create or update cancellation setting
router.post('/cancellation',
  [
    body('cancellationType').isIn(['pre_arrival_client', 'pre_arrival_candidate', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation']),
    body('penaltyFee').isFloat({ min: 0 }).withMessage('Penalty fee must be a positive number'),
    body('refundPercentage').isFloat({ min: 0, max: 100 }).withMessage('Refund percentage must be between 0 and 100'),
    body('nonRefundableComponents').optional().isArray(),
    body('monthlyServiceFee').isFloat({ min: 0 }).withMessage('Monthly service fee must be a positive number'),
    body('maxRefundAmount').optional().isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('active').optional().isBoolean()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const {
        cancellationType,
        penaltyFee,
        refundPercentage,
        name,
        nonRefundableComponents,
        monthlyServiceFee,
        maxRefundAmount,
        description,
        active = true
      } = req.body;

      const companyId = req.user!.companyId;

      // Check if setting already exists
      const existingSetting = await prisma.cancellationSetting.findFirst({
        where: {
          companyId,
          cancellationType
        }
      });

      let setting;
      if (existingSetting) {
        // Update existing setting
        setting = await prisma.cancellationSetting.update({
          where: { id: existingSetting.id },
          data: {
            penaltyFee,
            refundPercentage,
            name: name || cancellationType,
            nonRefundableComponents,
            monthlyServiceFee,
            maxRefundAmount,
            description,
            active
          }
        });
      } else {
        // Create new setting
        setting = await prisma.cancellationSetting.create({
          data: {
            cancellationType,
            penaltyFee,
            refundPercentage,
            name: name || cancellationType,
            nonRefundableComponents,
            monthlyServiceFee,
            maxRefundAmount,
            description,
            active,
            companyId
          }
        });
      }

      res.json(setting);
    } catch (error) {
      console.error('Create/update cancellation setting error:', error);
      res.status(500).json({ error: 'Failed to create/update cancellation setting' });
    }
  }
);

// Update cancellation setting
router.put('/cancellation/:id',
  [
    param('id').isUUID().withMessage('Valid ID required'),
    body('penaltyFee').optional().isFloat({ min: 0 }).withMessage('Penalty fee must be a positive number'),
    body('refundPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Refund percentage must be between 0 and 100'),
    body('nonRefundableComponents').optional().isArray().withMessage('Non-refundable components must be an array'),
    body('monthlyServiceFee').optional().isFloat({ min: 0 }).withMessage('Monthly service fee must be a positive number'),
    body('maxRefundAmount').optional().isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('active').optional().isBoolean()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;
      const updateData = req.body;

      // Find the setting by ID and ensure it belongs to the company
      const existingSetting = await prisma.cancellationSetting.findFirst({
        where: { 
          id,
          companyId
        }
      });

      if (!existingSetting) {
        res.status(404).json({ error: 'Cancellation setting not found' });
        return;
      }

      // Update the setting
      const updatedSetting = await prisma.cancellationSetting.update({
        where: { id },
        data: updateData
      });

      console.log('✅ Cancellation setting updated:', updatedSetting.cancellationType);
      res.json(updatedSetting);
    } catch (error) {
      console.error('❌ Update cancellation setting error:', error);
      res.status(500).json({ error: 'Failed to update cancellation setting' });
    }
  }
);

// Delete cancellation setting by type
router.delete('/cancellation/:type',
  [
    param('type').isIn(['pre_arrival_client', 'pre_arrival_candidate', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation'])
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { type } = req.params;
      const companyId = req.user!.companyId;

      const setting = await prisma.cancellationSetting.findFirst({
        where: {
          companyId,
          cancellationType: type
        }
      });

      if (!setting) {
        res.status(404).json({ error: 'Cancellation setting not found' });
        return;
      }

      await prisma.cancellationSetting.delete({
        where: { id: setting.id }
      });

      res.json({ message: 'Cancellation setting deleted successfully' });
    } catch (error) {
      console.error('Delete cancellation setting error:', error);
      res.status(500).json({ error: 'Failed to delete cancellation setting' });
    }
  }
);

// Lawyer Service Settings Routes

// Get lawyer service settings
router.get('/lawyer-service',
  async (req: AuthRequest, res) => {
    try {
      console.log('🔧 Fetching lawyer service settings for company:', req.user?.companyId);
      const companyId = req.user!.companyId;

      const settings = await prisma.lawyerServiceSetting.findFirst({
        where: { companyId }
      });

      if (!settings) {
        console.log('📝 No lawyer service settings found, returning defaults');
        // Return default settings if none exist
        res.json({ data: {
          id: null,
          lawyerFeeCost: 100,
          lawyerFeeCharge: 150,
          description: 'Default lawyer service fees',
          active: true
        }});
        return;
      }

      console.log('✅ Found lawyer service settings');
      res.json({ data: settings });
    } catch (error) {
      console.error('❌ Get lawyer service settings error:', error);
      res.status(500).json({ error: 'Failed to get lawyer service settings' });
    }
  }
);

// Create or update lawyer service settings
router.post('/lawyer-service',
  [
    body('lawyerFeeCost').isFloat({ min: 0 }).withMessage('Lawyer fee cost must be a positive number'),
    body('lawyerFeeCharge').isFloat({ min: 0 }).withMessage('Lawyer fee charge must be a positive number'),
    body('description').optional().trim(),
    body('active').optional().isBoolean()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const {
        lawyerFeeCost,
        lawyerFeeCharge,
        description,
        active = true
      } = req.body;

      const companyId = req.user!.companyId;

      // Check if settings already exist
      const existingSettings = await prisma.lawyerServiceSetting.findFirst({
        where: { companyId }
      });

      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await prisma.lawyerServiceSetting.update({
          where: { id: existingSettings.id },
          data: {
            lawyerFeeCost,
            lawyerFeeCharge,
            description,
            active
          }
        });
      } else {
        // Create new settings
        settings = await prisma.lawyerServiceSetting.create({
          data: {
            lawyerFeeCost,
            lawyerFeeCharge,
            description,
            active,
            companyId
          }
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Create/update lawyer service settings error:', error);
      res.status(500).json({ error: 'Failed to create/update lawyer service settings' });
    }
  }
);

// Delete lawyer service settings
router.delete('/lawyer-service',
  async (req: AuthRequest, res) => {
    try {
      const companyId = req.user!.companyId;

      const settings = await prisma.lawyerServiceSetting.findFirst({
        where: { companyId }
      });

      if (!settings) {
        res.status(404).json({ error: 'Lawyer service settings not found' });
        return;
      }

      await prisma.lawyerServiceSetting.delete({
        where: { id: settings.id }
      });

      res.json({ message: 'Lawyer service settings deleted successfully' });
    } catch (error) {
      console.error('Delete lawyer service settings error:', error);
      res.status(500).json({ error: 'Failed to delete lawyer service settings' });
    }
  }
);

// Fee Template Management Routes

// Get fee templates for application creation
router.get('/fee-templates',
  async (req: AuthRequest, res) => {
    try {
      const { nationality, applicationType, candidateStatus } = req.query;
      const companyId = req.user!.companyId;

      const where: any = { companyId };

      if (nationality) {
        where.nationality = nationality;
      }

      const feeTemplates = await prisma.feeTemplate.findMany({
        where,
        orderBy: [
          { nationality: 'asc' },
          { name: 'asc' }
        ]
      });

      res.json(feeTemplates);
    } catch (error) {
      console.error('Get fee templates error:', error);
      res.status(500).json({ error: 'Failed to get fee templates' });
    }
  }
);

// Calculate fee for an application
router.post('/calculate-fee',
  [
    body('applicationType').isIn(['NEW_CANDIDATE', 'GUARANTOR_CHANGE']),
    body('candidateNationality').notEmpty().trim(),
    body('candidateStatus').isIn(['AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON', 'RESERVED', 'IN_PROCESS', 'PLACED']),
    body('lawyerService').optional().isBoolean(),
    body('expedited').optional().isBoolean(),
    body('hasExistingPaperwork').optional().isBoolean()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const {
        applicationType,
        candidateNationality,
        candidateStatus,
        lawyerService,
        expedited,
        hasExistingPaperwork
      } = req.body;

      const companyId = req.user!.companyId;

      // Create mock application object for calculation
      const mockApplication = {
        type: applicationType,
        candidate: {
          nationality: candidateNationality,
          status: candidateStatus
        },
        lawyerFeeCharge: lawyerService ? 150 : null // Default charge
      };

      // Get appropriate fee template
      const feeTemplate = await FinancialStrategyService.getFeeTemplate(
        applicationType as any,
        candidateNationality,
        candidateStatus as any,
        companyId
      );

      if (!feeTemplate) {
        res.status(404).json({ error: 'No suitable fee template found' });
        return;
      }

      // Calculate fee
      const feeCalculation = await FinancialStrategyService.calculateFee(
        mockApplication,
        feeTemplate,
        {
          lawyerService,
          expedited,
          hasExistingPaperwork
        }
      );

      res.json({
        feeTemplate,
        calculation: feeCalculation
      });
    } catch (error) {
      console.error('Calculate fee error:', error);
      res.status(500).json({ error: 'Failed to calculate fee' });
    }
  }
);

// Calculate refund for cancellation
router.post('/calculate-refund',
  [
    body('applicationId').isUUID(),
    body('cancellationType').isIn(['pre_arrival_client', 'pre_arrival_candidate', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation']),
    body('customRefundAmount').optional().isFloat({ min: 0 })
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { applicationId, cancellationType, customRefundAmount } = req.body;
      const companyId = req.user!.companyId;

      // Get application with payments
      const application = await prisma.application.findFirst({
        where: { id: applicationId, companyId },
        include: {
          payments: true,
          candidate: true
        }
      });

      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      // Get cancellation settings
      const settings = await FinancialStrategyService.getCancellationSettings(
        companyId,
        cancellationType
      );

      if (!settings) {
        res.status(404).json({ error: 'Cancellation settings not found' });
        return;
      }

      // Calculate refund
      const options: any = {};
      if (customRefundAmount) {
        options.customRefundAmount = customRefundAmount;
      }

      if (application.exactArrivalDate) {
        const arrivalDate = new Date(application.exactArrivalDate);
        const monthsSinceArrival = FinancialStrategyService.calculateMonthlyServiceFee(
          arrivalDate,
          new Date(),
          0
        ).months;
        options.monthsSinceArrival = monthsSinceArrival;
      }

      const refundCalculation = await FinancialStrategyService.calculateRefund(
        application,
        cancellationType,
        settings,
        options
      );

      res.json({
        settings,
        calculation: refundCalculation
      });
    } catch (error) {
      console.error('Calculate refund error:', error);
      res.status(500).json({ error: 'Failed to calculate refund' });
    }
  }
);

export default router;
