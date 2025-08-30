import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Public route for client status page (no authentication required)
router.get('/status/:shareableLink', async (req, res) => {
  try {
    const { shareableLink } = req.params;
    
    const application = await prisma.application.findUnique({
      where: { shareableLink },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
            photoUrl: true,
          },
        },
        documentItems: {
          where: {
            stage: {
              in: ['PENDING_MOL', 'MOL_AUTH_RECEIVED', 'VISA_PROCESSING'],
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentDate: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Calculate total paid and outstanding balance
    const totalPaid = application.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    
    // Get fee settings
    const feeSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['office_commission', 'standard_visa_fee'],
        },
      },
    });
    
    // Calculate expected total (simplified)
    let expectedTotal = 0;
    feeSettings.forEach(setting => {
      if (setting.value && typeof setting.value === 'object' && 'amount' in setting.value) {
        expectedTotal += Number((setting.value as any).amount || 0);
      }
    });
    
    const outstandingBalance = Math.max(0, expectedTotal - totalPaid);
    
    // Return public-safe information in the format expected by frontend
    res.json({
      application: {
        id: application.id,
        status: application.status,
        type: application.type,
        createdAt: application.createdAt,
        permitExpiryDate: application.permitExpiryDate,
        client: {
          name: application.client.name,
        },
        candidate: {
          firstName: application.candidate.firstName,
          lastName: application.candidate.lastName,
          nationality: application.candidate.nationality,
          photoUrl: application.candidate.photoUrl,
        },
      },
      documents: application.documentItems.map(doc => ({
        id: doc.id,
        documentName: doc.documentName,
        status: doc.status,
        stage: doc.stage,
      })),
      payments: application.payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentDate: payment.paymentDate,
        notes: '',
      })),
      financials: {
        totalPaid,
        outstandingBalance,
        currency: 'USD',
      },
    });
  } catch (error) {
    console.error('Get public status error:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

export default router;
