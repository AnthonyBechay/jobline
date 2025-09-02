import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GuarantorChangeService } from '../services/guarantorChange.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Calculate refund for guarantor change
router.post('/calculate-refund', async (req: AuthRequest, res) => {
  try {
    const { applicationId, candidateInLebanon, candidateDeparted, customRefundAmount } = req.body;
    const companyId = req.user!.companyId;

    // Verify application belongs to company
    const application = await prisma.application.findFirst({
      where: { id: applicationId, companyId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const refundCalculation = await GuarantorChangeService.calculateRefund(
      applicationId,
      candidateInLebanon,
      candidateDeparted,
      customRefundAmount
    );

    return res.json(refundCalculation);
  } catch (error) {
    console.error('Calculate refund error:', error);
    return res.status(500).json({ error: 'Failed to calculate refund' });
  }
});

// Process guarantor change
router.post('/process', async (req: AuthRequest, res) => {
  try {
    const {
      originalApplicationId,
      toClientId,
      reason,
      candidateInLebanon,
      candidateDeparted,
      customRefundAmount,
      notes
    } = req.body;
    const companyId = req.user!.companyId;

    // Verify original application belongs to company
    const originalApplication = await prisma.application.findFirst({
      where: { id: originalApplicationId, companyId }
    });

    if (!originalApplication) {
      return res.status(404).json({ error: 'Original application not found' });
    }

    // Verify new client belongs to company
    const toClient = await prisma.client.findFirst({
      where: { id: toClientId, companyId }
    });

    if (!toClient) {
      return res.status(404).json({ error: 'New client not found' });
    }

    const result = await GuarantorChangeService.processGuarantorChange(
      {
        originalApplicationId,
        toClientId,
        reason,
        candidateInLebanon,
        candidateDeparted,
        customRefundAmount,
        notes
      },
      companyId
    );

    return res.status(201).json({
      message: 'Guarantor change processed successfully',
      guarantorChange: result.guarantorChange
    });
  } catch (error) {
    console.error('Process guarantor change error:', error);
    return res.status(500).json({ error: 'Failed to process guarantor change' });
  }
});

// Create new application for guarantor change
router.post('/:guarantorChangeId/create-application', async (req: AuthRequest, res) => {
  try {
    const { guarantorChangeId } = req.params;
    const { feeTemplateId, brokerId } = req.body;
    const companyId = req.user!.companyId;

    // Verify guarantor change belongs to company
    const guarantorChange = await prisma.guarantorChange.findFirst({
      where: { id: guarantorChangeId, companyId }
    });

    if (!guarantorChange) {
      return res.status(404).json({ error: 'Guarantor change not found' });
    }

    const newApplication = await GuarantorChangeService.createNewApplicationForGuarantorChange(
      guarantorChangeId,
      companyId,
      feeTemplateId,
      brokerId
    );

    return res.status(201).json({
      message: 'New application created successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Create new application error:', error);
    return res.status(500).json({ error: 'Failed to create new application' });
  }
});

// Get candidate guarantor history
router.get('/candidate/:candidateId/history', async (req: AuthRequest, res) => {
  try {
    const { candidateId } = req.params;
    const companyId = req.user!.companyId;

    // Verify candidate belongs to company
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, companyId }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const history = await GuarantorChangeService.getCandidateGuarantorHistory(
      candidateId,
      companyId
    );

    return res.json(history);
  } catch (error) {
    console.error('Get candidate guarantor history error:', error);
    return res.status(500).json({ error: 'Failed to fetch candidate guarantor history' });
  }
});

// Get client guarantor history
router.get('/client/:clientId/history', async (req: AuthRequest, res) => {
  try {
    const { clientId } = req.params;
    const companyId = req.user!.companyId;

    // Verify client belongs to company
    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const history = await GuarantorChangeService.getClientGuarantorHistory(
      clientId,
      companyId
    );

    return res.json(history);
  } catch (error) {
    console.error('Get client guarantor history error:', error);
    return res.status(500).json({ error: 'Failed to fetch client guarantor history' });
  }
});

// Process refund
router.post('/:guarantorChangeId/process-refund', async (req: AuthRequest, res) => {
  try {
    const { guarantorChangeId } = req.params;
    const companyId = req.user!.companyId;

    // Verify guarantor change belongs to company
    const guarantorChange = await prisma.guarantorChange.findFirst({
      where: { id: guarantorChangeId, companyId }
    });

    if (!guarantorChange) {
      return res.status(404).json({ error: 'Guarantor change not found' });
    }

    const updatedGuarantorChange = await GuarantorChangeService.processRefund(
      guarantorChangeId,
      companyId
    );

    return res.json({
      message: 'Refund processed successfully',
      guarantorChange: updatedGuarantorChange
    });
  } catch (error) {
    console.error('Process refund error:', error);
    return res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get all guarantor changes for company (Super Admin only)
router.get('/', authorize('SUPER_ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const companyId = req.user!.companyId;
    const skip = (Number(page) - 1) * Number(limit);

    const [guarantorChanges, total] = await Promise.all([
      prisma.guarantorChange.findMany({
        where: { companyId },
        include: {
          originalApplication: {
            include: { client: true, candidate: true }
          },
          newApplication: {
            include: { client: true, candidate: true }
          },
          fromClient: true,
          toClient: true,
          candidate: true
        },
        skip,
        take: Number(limit),
        orderBy: { changeDate: 'desc' }
      }),
      prisma.guarantorChange.count({ where: { companyId } })
    ]);

    return res.json({
      data: guarantorChanges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get guarantor changes error:', error);
    return res.status(500).json({ error: 'Failed to fetch guarantor changes' });
  }
});

// Get guarantor change by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const guarantorChange = await prisma.guarantorChange.findFirst({
      where: { id, companyId },
      include: {
        originalApplication: {
          include: { client: true, candidate: true, payments: true }
        },
        newApplication: {
          include: { client: true, candidate: true }
        },
        fromClient: true,
        toClient: true,
        candidate: true
      }
    });

    if (!guarantorChange) {
      return res.status(404).json({ error: 'Guarantor change not found' });
    }

    return res.json(guarantorChange);
  } catch (error) {
    console.error('Get guarantor change error:', error);
    return res.status(500).json({ error: 'Failed to fetch guarantor change' });
  }
});

export default router;
