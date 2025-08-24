
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });
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
      status ? { status: { in: status.split(',') } } : {},
      nationality ? { nationality: { contains: nationality, mode: 'insensitive' } } : {}
    ]
  };
  const data = await prisma.candidate.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(data);
});

router.post('/candidates', async (req, res) => {
  // The 'skills' property comes in as a string, but needs to be an array for the DB
  const { skills, ...rest } = req.body;
  const data = await prisma.candidate.create({
    data: {
      ...rest,
      skills: skills ? JSON.stringify(skills.split(',').map(s=>s.trim())) : undefined
    }
  });
  res.json(data);
});

router.get('/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return res.status(404).json({ error: 'Not found' });
  res.json(candidate);
});

router.patch('/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const { skills, ...rest } = req.body;
  const data = await prisma.candidate.update({
    where: { id },
    data: {
      ...rest,
      skills: skills ? JSON.stringify(skills.split(',').map(s=>s.trim())) : undefined
    }
  });
  res.json(data);
});

router.delete('/candidates/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.candidate.delete({ where: { id }});
  res.status(204).send();
});

// Candidate Data Migration
router.get('/candidates/export', async (req, res) => {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' }
  });
  const data = stringify(candidates, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=\"candidates.csv\"');
  res.send(data);
});

router.post('/candidates/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        if (context.column === 'dob') return new Date(value);
        return value;
      }
    });

    const result = await prisma.candidate.createMany({
      data: records,
      skipDuplicates: true,
    });

    res.json({ message: `${result.count} candidates imported successfully.` });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import CSV file.', details: error.message });
  }
});

// Clients
router.get('/clients', async (req, res) => {
  const { q } = req.query;
  const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};
  const data = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(data);
});

router.post('/clients', async (req, res) => {
  const data = await prisma.client.create({ data: req.body });
  res.json(data);
});

router.get('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      applications: { include: { candidate: true } },
      referrals: true,
      referredBy: true,
    }
  });
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

router.patch('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const data = await prisma.client.update({ where: { id }, data: req.body });
  res.json(data);
});

router.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.client.delete({ where: { id } });
  res.status(204).send();
});

// Client Data Migration
router.get('/clients/export', async (req, res) => {
  const data = stringify(await prisma.client.findMany(), { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=\"clients.csv\"');
  res.send(data);
});

router.post('/clients/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
    const result = await prisma.client.createMany({ data: records, skipDuplicates: true });
    res.json({ message: `${result.count} clients imported.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import CSV.', details: error.message });
  }
});


// Agents & Brokers (create restricted to super_admin)
router.get('/agents', async (req,res)=> res.json(await prisma.agent.findMany()));
router.post('/agents', requireRole('super_admin'), async (req,res)=> res.json(await prisma.agent.create({ data: req.body })));
router.delete('/agents/:id', requireRole('super_admin'), async (req,res)=> {
  await prisma.agent.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get('/brokers', async (req,res)=> res.json(await prisma.broker.findMany()));
router.post('/brokers', requireRole('super_admin'), async (req,res)=> res.json(await prisma.broker.create({ data: req.body })));
router.delete('/brokers/:id', requireRole('super_admin'), async (req,res)=> {
  await prisma.broker.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Applications
router.get('/applications', async (req,res)=>{
  const data = await prisma.application.findMany({
    include: { client: true, candidate: true, broker: true, payments: true, documentChecklist: true }
  });
  res.json(data);
});

router.post('/applications', async (req,res)=>{
  const { status, ...rest } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the application
      const newApp = await tx.application.create({
        data: { status, ...rest }
      });

      // 2. Find required documents for this stage
      const requiredDocs = await tx.requiredDocument.findMany({
        where: { stage: status }
      });

      // 3. Create checklist items for the new application
      if (requiredDocs.length > 0) {
        await tx.documentChecklistItem.createMany({
          data: requiredDocs.map(doc => ({
            applicationId: newApp.id,
            documentName: doc.documentName,
            status: 'pending'
          }))
        });
      }

      return newApp;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create application:', error);
    res.status(500).json({ error: 'Could not create application.' });
  }
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
