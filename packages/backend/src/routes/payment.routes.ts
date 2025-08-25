import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

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
    
    res.json({
      payments,
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
    const { applicationId, clientId, amount, currency = 'USD', notes } = req.body;
    
    const payment = await prisma.payment.create({
      data: {
        applicationId,
        clientId,
        amount,
        currency,
        notes,
      },
      include: {
        client: true,
        application: true,
      },
    });
    
    res.status(201).json(payment);
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
