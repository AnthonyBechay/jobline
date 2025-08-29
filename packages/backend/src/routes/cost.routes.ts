import { Router } from 'express';
import { authenticate, superAdminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

// All cost routes are Super Admin only
router.use(authenticate);
router.use(superAdminOnly);

// Get all costs
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { applicationId, costType, page = 1, limit = 20 } = req.query;
    
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (costType) where.costType = costType;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [costs, total] = await Promise.all([
      prisma.cost.findMany({
        where,
        include: {
          application: {
            include: {
              client: true,
              candidate: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { costDate: 'desc' },
      }),
      prisma.cost.count({ where }),
    ]);
    
    // Convert Decimal to number for frontend
    const formattedCosts = costs.map(cost => ({
      ...cost,
      amount: Number(cost.amount),
    }));
    
    res.json({
      costs: formattedCosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get costs error:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// Create cost
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { applicationId, amount, currency = 'USD', costType, description, costDate } = req.body;
    
    // Verify the application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    const cost = await prisma.cost.create({
      data: {
        applicationId,
        amount: parseFloat(amount),
        currency,
        costType,
        description,
        costDate: costDate ? new Date(costDate) : new Date(),
      },
      include: {
        application: true,
      },
    });
    
    // Convert Decimal to number for frontend
    const formattedCost = {
      ...cost,
      amount: Number(cost.amount),
    };
    
    res.status(201).json(formattedCost);
  } catch (error) {
    console.error('Create cost error:', error);
    res.status(500).json({ error: 'Failed to create cost' });
  }
});

// Get profitability report
router.get('/profitability', async (req: AuthRequest, res) => {
  try {
    const { applicationId, startDate, endDate } = req.query;
    
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (startDate || endDate) {
      where.costDate = {};
      if (startDate) where.costDate.gte = new Date(startDate as string);
      if (endDate) where.costDate.lte = new Date(endDate as string);
    }
    
    // Get total costs
    const totalCosts = await prisma.cost.aggregate({
      where,
      _sum: { amount: true },
    });
    
    // Get total revenue
    const paymentWhere: any = {};
    if (applicationId) paymentWhere.applicationId = applicationId;
    if (startDate || endDate) {
      paymentWhere.paymentDate = {};
      if (startDate) paymentWhere.paymentDate.gte = new Date(startDate as string);
      if (endDate) paymentWhere.paymentDate.lte = new Date(endDate as string);
    }
    
    const totalRevenue = await prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
    });
    
    const revenue = Number(totalRevenue._sum.amount || 0);
    const costs = Number(totalCosts._sum.amount || 0);
    const profit = revenue - costs;
    
    res.json({
      revenue,
      costs,
      profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
    });
  } catch (error) {
    console.error('Get profitability error:', error);
    res.status(500).json({ error: 'Failed to fetch profitability report' });
  }
});

// Get cost breakdown by type
router.get('/breakdown', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate || endDate) {
      where.costDate = {};
      if (startDate) where.costDate.gte = new Date(startDate as string);
      if (endDate) where.costDate.lte = new Date(endDate as string);
    }
    
    const breakdown = await prisma.cost.groupBy({
      by: ['costType'],
      where,
      _sum: { amount: true },
      _count: true,
    });
    
    res.json(breakdown);
  } catch (error) {
    console.error('Get cost breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch cost breakdown' });
  }
});

export default router;
