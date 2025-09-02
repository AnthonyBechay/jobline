import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ApplicationCancellationService } from '../services/applicationCancellation.service';
import { ApplicationStateMachine } from '../services/applicationStateMachine.service';
import { LifecycleHistoryService } from '../services/lifecycleHistory.service';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import { prisma } from '../index';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get available cancellation options for an application
router.get('/:id/cancellation-options', 
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const options = await ApplicationCancellationService.getAvailableCancellationOptions(
        id,
        companyId
      );

      res.json(options);
    } catch (error) {
      console.error('Get cancellation options error:', error);
      res.status(500).json({ error: 'Failed to get cancellation options' });
    }
  }
);

// Process application cancellation
router.post('/:id/cancel',
  [
    param('id').isUUID(),
    body('cancellationType').isIn(['pre_arrival', 'post_arrival_within_3_months', 'post_arrival_after_3_months', 'candidate_cancellation']),
    body('reason').optional().isString().trim(),
    body('notes').optional().isString().trim(),
    body('customRefundAmount').optional().isFloat({ min: 0 }),
    body('candidateInLebanon').optional().isBoolean(),
    body('candidateDeparted').optional().isBoolean(),
    body('newClientId').optional().isUUID(),
    body('deportCandidate').optional().isBoolean()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const {
        cancellationType,
        reason,
        notes,
        customRefundAmount,
        candidateInLebanon,
        candidateDeparted,
        newClientId,
        deportCandidate
      } = req.body;

      const companyId = req.user!.companyId;
      const performedBy = req.user!.id;

      const result = await ApplicationCancellationService.processCancellation(
        {
          applicationId: id,
          cancellationType,
          reason,
          notes,
          customRefundAmount,
          candidateInLebanon,
          candidateDeparted,
          newClientId,
          deportCandidate
        },
        performedBy,
        companyId
      );

      res.json(result);
    } catch (error) {
      console.error('Process cancellation error:', error);
      res.status(500).json({ error: (error as Error).message || 'Failed to process cancellation' });
    }
  }
);

// Get application lifecycle history
router.get('/:id/lifecycle-history',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;
      const companyId = req.user!.companyId;

      const history = await LifecycleHistoryService.getApplicationHistory(
        id,
        companyId,
        Number(limit)
      );

      res.json(history);
    } catch (error) {
      console.error('Get lifecycle history error:', error);
      res.status(500).json({ error: 'Failed to get lifecycle history' });
    }
  }
);

// Get application lifecycle summary
router.get('/:id/lifecycle-summary',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const summary = await LifecycleHistoryService.getApplicationSummary(
        id,
        companyId
      );

      res.json(summary);
    } catch (error) {
      console.error('Get lifecycle summary error:', error);
      res.status(500).json({ error: 'Failed to get lifecycle summary' });
    }
  }
);

// Update application status with state machine validation
router.patch('/:id/status',
  [
    param('id').isUUID(),
    body('status').isString(),
    body('exactArrivalDate').optional().isISO8601(),
    body('notes').optional().isString().trim()
  ],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, exactArrivalDate, notes } = req.body;
      const companyId = req.user!.companyId;
      const performedBy = req.user!.id;

      // Get current application
      const application = await prisma.application.findFirst({
        where: { id, companyId }
      });

      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      // Validate state transition
      const transitionValidation = ApplicationStateMachine.isValidTransition(
        application.status,
        status as any
      );

      if (!transitionValidation.valid) {
        res.status(400).json({ 
          error: 'Invalid status transition',
          reason: transitionValidation.reason,
          validTransitions: ApplicationStateMachine.getValidNextStates(application.status)
        });
        return;
      }

      // Check if exact arrival date is required
      if (ApplicationStateMachine.requiresExactArrivalDate(status as any) && !exactArrivalDate) {
        res.status(400).json({ 
          error: 'Exact arrival date is required for this status transition' 
        });
        return;
      }

      // Update application
      const updateData: any = { status };
      if (exactArrivalDate) {
        updateData.exactArrivalDate = new Date(exactArrivalDate);
      }

      const updatedApplication = await prisma.application.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          candidate: true,
          feeTemplate: true
        }
      });

      // Update candidate status if required
      const candidateStatusChange = ApplicationStateMachine.getCandidateStatusChange(
        application.status,
        status as any
      );

      if (candidateStatusChange) {
        await prisma.candidate.update({
          where: { id: application.candidateId },
          data: { status: candidateStatusChange }
        });
      }

      // Log the state transition
      await ApplicationStateMachine.logStateTransition(
        id,
        application.status,
        status as any,
        performedBy,
        companyId,
        notes
      );

      res.json(updatedApplication);
    } catch (error) {
      console.error('Update application status error:', error);
      res.status(500).json({ error: 'Failed to update application status' });
    }
  }
);

// Get valid next states for an application
router.get('/:id/valid-next-states',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const application = await prisma.application.findFirst({
        where: { id, companyId }
      });

      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      const validNextStates = ApplicationStateMachine.getValidNextStates(application.status);
      const availableCancellations = ApplicationStateMachine.getAvailableCancellationFlows(application.status);

      res.json({
        currentStatus: application.status,
        validNextStates,
        availableCancellations,
        isCancellable: ApplicationStateMachine.isCancellable(application.status),
        isCompleted: ApplicationStateMachine.isCompleted(application.status),
        isActive: ApplicationStateMachine.isActive(application.status)
      });
    } catch (error) {
      console.error('Get valid next states error:', error);
      res.status(500).json({ error: 'Failed to get valid next states' });
    }
  }
);

// Get candidate lifecycle history
router.get('/candidate/:candidateId/lifecycle-history',
  [param('candidateId').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { candidateId } = req.params;
      const { limit = 100 } = req.query;
      const companyId = req.user!.companyId;

      const history = await LifecycleHistoryService.getCandidateHistory(
        candidateId,
        companyId,
        Number(limit)
      );

      res.json(history);
    } catch (error) {
      console.error('Get candidate lifecycle history error:', error);
      res.status(500).json({ error: 'Failed to get candidate lifecycle history' });
    }
  }
);

// Get client lifecycle history
router.get('/client/:clientId/lifecycle-history',
  [param('clientId').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { clientId } = req.params;
      const { limit = 100 } = req.query;
      const companyId = req.user!.companyId;

      const history = await LifecycleHistoryService.getClientHistory(
        clientId,
        companyId,
        Number(limit)
      );

      res.json(history);
    } catch (error) {
      console.error('Get client lifecycle history error:', error);
      res.status(500).json({ error: 'Failed to get client lifecycle history' });
    }
  }
);

// Get activity timeline for dashboard
router.get('/activity-timeline',
  async (req: AuthRequest, res) => {
    try {
      const { limit = 20 } = req.query;
      const companyId = req.user!.companyId;

      const timeline = await LifecycleHistoryService.getActivityTimeline(
        companyId,
        Number(limit)
      );

      res.json(timeline);
    } catch (error) {
      console.error('Get activity timeline error:', error);
      res.status(500).json({ error: 'Failed to get activity timeline' });
    }
  }
);

// Get lifecycle statistics (Super Admin only)
router.get('/statistics',
  authorize(UserRole.SUPER_ADMIN),
  async (req: AuthRequest, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const companyId = req.user!.companyId;

      const statistics = await LifecycleHistoryService.getStatistics(
        companyId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json(statistics);
    } catch (error) {
      console.error('Get lifecycle statistics error:', error);
      res.status(500).json({ error: 'Failed to get lifecycle statistics' });
    }
  }
);

export default router;
