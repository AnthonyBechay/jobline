import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
// Note: Both Admin and Super Admin can manage payments (revenue)
// However, only Super Admin can see costs (handled in cost.routes.ts)
router.use(adminOnly); // This already allows both ADMIN and SUPER_ADMIN

// Get payment types (for dropdowns)
router.get('/types', async (req: AuthRequest, res) => {
  try {
    // For now, return predefined payment types
    // Later this can be made configurable through business settings
    const paymentTypes = [
      { id: 'fee', name: 'Application Fee', isRefundable: true },
      { id: 'insurance', name: 'Insurance', isRefundable: false },
      { id: 'visa', name: 'Visa Fee', isRefundable: false },
      { id: 'medical', name: 'Medical Checkup', isRefundable: false },
      { id: 'transport', name: 'Transportation', isRefundable: false },
      { id: 'other', name: 'Other', isRefundable: true }
    ];
    
    res.json(paymentTypes);
  } catch (error) {
    console.error('Failed to fetch payment types:', error);
    res.status(500).json({ error: 'Failed to fetch payment types' });
  }
});

// Get all payments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { applicationId, clientId, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (clientId) where.clientId = clientId;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          client: true,
          application: {
            include: {
              candidate: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);
    
    // Convert Decimal to number for frontend
    const formattedPayments = payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
    }));
    
    res.json({
      payments: formattedPayments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create payment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { applicationId, amount, currency = 'USD', notes, paymentDate } = req.body;
    
    // Get the application to find the client
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { client: true },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const payment = await prisma.payment.create({
      data: {
        applicationId,
        clientId: application.clientId,
        amount: parseFloat(amount),
        currency,
        notes,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
      include: {
        client: true,
        application: true,
      },
    });
    
    // Convert Decimal to number for frontend
    const formattedPayment = {
      ...payment,
      amount: Number(payment.amount),
    };
    
    res.status(201).json(formattedPayment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get client balance
router.get('/client/:clientId/balance', async (req: AuthRequest, res) => {
  try {
    const { clientId } = req.params;
    
    // Get total payments
    const payments = await prisma.payment.aggregate({
      where: { clientId },
      _sum: { amount: true },
    });
    
    // Get total fees from settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['office_commission', 'standard_visa_fee', 'expedited_visa_fee'],
        },
      },
    });
    
    // Calculate expected total (simplified - would need more logic based on applications)
    const applications = await prisma.application.findMany({
      where: { clientId },
      include: {
        costs: req.user?.role === 'SUPER_ADMIN',
      },
    });
    
    const totalPaid = Number(payments._sum.amount || 0);
    
    res.json({
      totalPaid,
      applications: applications.length,
      // Additional calculations would go here
    });
  } catch (error) {
    console.error('Get client balance error:', error);
    res.status(500).json({ error: 'Failed to fetch client balance' });
  }
});

export default router;
