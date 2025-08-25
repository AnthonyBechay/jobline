import { Router } from 'express';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

// Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    // Get counts
    const [
      totalClients,
      totalCandidates,
      activeApplications,
      pendingDocuments,
      pendingPayments,
      upcomingRenewals,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.candidate.count(),
      prisma.application.count({
        where: {
          status: {
            notIn: ['CONTRACT_ENDED'],
          },
        },
      }),
      prisma.documentChecklistItem.count({
        where: { status: 'PENDING' },
      }),
      // Count applications with no payments
      prisma.application.count({
        where: {
          payments: { none: {} },
          status: { notIn: ['CONTRACT_ENDED'] },
        },
      }),
      // Count applications with permits expiring in next 60 days
      prisma.application.count({
        where: {
          permitExpiryDate: {
            gte: today,
            lte: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);
    
    // Get financial summary (Super Admin only)
    let financialSummary = null;
    if (req.user?.role === 'SUPER_ADMIN') {
      const [monthlyRevenue, monthlyCosts] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            paymentDate: { gte: thisMonth },
          },
          _sum: { amount: true },
        }),
        prisma.cost.aggregate({
          where: {
            costDate: { gte: thisMonth },
          },
          _sum: { amount: true },
        }),
      ]);
      
      const revenue = Number(monthlyRevenue._sum.amount || 0);
      const costs = Number(monthlyCosts._sum.amount || 0);
      
      financialSummary = {
        revenue,
        costs,
        profit: revenue - costs,
      };
    }
    
    res.json({
      totalClients,
      totalCandidates,
      activeApplications,
      pendingDocuments,
      pendingPayments,
      upcomingRenewals,
      financialSummary,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get application pipeline
router.get('/pipeline', async (req: AuthRequest, res) => {
  try {
    const pipeline = await prisma.application.groupBy({
      by: ['status'],
      _count: true,
      where: {
        status: {
          notIn: ['CONTRACT_ENDED'],
        },
      },
    });
    
    const pipelineWithDetails = await Promise.all(
      pipeline.map(async (stage) => {
        const applications = await prisma.application.findMany({
          where: { status: stage.status },
          include: {
            client: true,
            candidate: true,
          },
          take: 5,
          orderBy: { updatedAt: 'desc' },
        });
        
        return {
          status: stage.status,
          count: stage._count,
          applications,
        };
      })
    );
    
    res.json(pipelineWithDetails);
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Get recent activities
router.get('/activities', async (req: AuthRequest, res) => {
  try {
    const limit = 20;
    
    // Get recent applications
    const recentApplications = await prisma.application.findMany({
      include: {
        client: true,
        candidate: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      include: {
        client: true,
        application: {
          include: {
            candidate: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    // Combine and sort activities
    const activities = [
      ...recentApplications.map(app => ({
        type: 'application',
        date: app.createdAt,
        description: `New application created for ${app.candidate.firstName} ${app.candidate.lastName}`,
        data: app,
      })),
      ...recentPayments.map(payment => ({
        type: 'payment',
        date: payment.createdAt,
        description: `Payment received from ${payment.client.name}`,
        data: payment,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get renewal reminders
router.get('/renewals', async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    const renewals = await prisma.application.findMany({
      where: {
        permitExpiryDate: {
          gte: today,
          lte: sixtyDaysFromNow,
        },
        status: 'ACTIVE_EMPLOYMENT',
      },
      include: {
        client: true,
        candidate: true,
      },
      orderBy: { permitExpiryDate: 'asc' },
    });
    
    res.json(renewals);
  } catch (error) {
    console.error('Get renewals error:', error);
    res.status(500).json({ error: 'Failed to fetch renewals' });
  }
});

export default router;
