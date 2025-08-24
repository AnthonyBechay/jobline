
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, requireRole } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(authRequired);

// Dashboard summary
router.get('/dashboard/summary', async (req, res) => {
  const [appsCount, pendingDocs, renewalsDue] = await Promise.all([
    prisma.application.count(),
    prisma.documentChecklistItem.count({ where: { status: 'pending' } }),
    prisma.application.count({
      where: { permitExpiryDate: { lte: new Date(Date.now() + 60*24*60*60*1000) } }
    })
  ]);

  // Financial summary only for super_admin
  let financial = null;
  if (req.user.role === 'super_admin') {
    const payments = await prisma.payment.aggregate({ _sum: { amount: true } });
    const costs = await prisma.cost.aggregate({ _sum: { amount: true } });
    financial = {
      revenue: payments._sum.amount || 0,
      costs: costs._sum.amount || 0,
      profit: (payments._sum.amount || 0) - (costs._sum.amount || 0)
    };
  }

  res.json({ appsCount, pendingDocs, renewalsDue, financial });
});

// Candidates
router.get('/candidates', async (req, res) => {
  const { q, status, nationality } = req.query;
  const where = {
    AND: [
      q ? { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }] } : {},
      status ? { status } : {},
      nationality ? { nationality: { contains: nationality, mode: 'insensitive' } } : {}
    ]
  };
  const data = await prisma.candidate.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(data);
});

router.post('/candidates', async (req, res) => {
  const data = await prisma.candidate.create({ data: req.body });
  res.json(data);
});

// Clients
router.get('/clients', async (req, res) => {
  const data = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
router.post('/clients', async (req, res) => {
  const data = await prisma.client.create({ data: req.body });
  res.json(data);
});

// Agents & Brokers (create restricted to super_admin)
router.get('/agents', async (req,res)=> res.json(await prisma.agent.findMany()));
router.post('/agents', requireRole('super_admin'), async (req,res)=> res.json(await prisma.agent.create({ data: req.body })));

router.get('/brokers', async (req,res)=> res.json(await prisma.broker.findMany()));
router.post('/brokers', requireRole('super_admin'), async (req,res)=> res.json(await prisma.broker.create({ data: req.body })));

// Applications
router.get('/applications', async (req,res)=>{
  const data = await prisma.application.findMany({
    include: { client: true, candidate: true, broker: true, payments: true, documentChecklist: true }
  });
  res.json(data);
});

router.post('/applications', async (req,res)=>{
  const data = await prisma.application.create({ data: req.body });
  res.json(data);
});

router.get('/applications/:id', async (req,res)=>{
  const { id } = req.params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      client: true, candidate: true, broker: true,
      payments: true, documentChecklist: true,
      costs: req.user.role === 'super_admin' ? true : false
    }
  });
  if (!app) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'super_admin') delete app.costs;
  res.json(app);
});

router.patch('/applications/:id', async (req,res)=>{
  const { id } = req.params;
  const data = await prisma.application.update({ where: { id }, data: req.body });
  res.json(data);
});

// Payments (admin and super_admin)
router.post('/applications/:id/payments', async (req,res)=>{
  const { id } = req.params;
  const payment = await prisma.payment.create({ data: { ...req.body, applicationId: id } });
  res.json(payment);
});

// Costs (super_admin only)
router.get('/applications/:id/costs', requireRole('super_admin'), async (req,res)=>{
  const { id } = req.params;
  const costs = await prisma.cost.findMany({ where: { applicationId: id } });
  res.json(costs);
});
router.post('/applications/:id/costs', requireRole('super_admin'), async (req,res)=>{
  const { id } = req.params;
  const cost = await prisma.cost.create({ data: { ...req.body, applicationId: id } });
  res.json(cost);
});

// Document checklist
router.post('/applications/:id/documents', async (req,res)=>{
  const { id } = req.params;
  const doc = await prisma.documentChecklistItem.create({ data: { ...req.body, applicationId: id } });
  res.json(doc);
});
router.patch('/documents/:docId', async (req,res)=>{
  const { docId } = req.params;
  const doc = await prisma.documentChecklistItem.update({ where: { id: docId }, data: req.body });
  res.json(doc);
});

export default router;
