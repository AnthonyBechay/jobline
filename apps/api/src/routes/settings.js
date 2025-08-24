import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// All settings routes are for super_admin only
router.use(requireRole('super_admin'));

// Required Documents
router.get('/documents', async (req, res) => {
  const docs = await prisma.requiredDocument.findMany({
    orderBy: { stage: 'asc' },
  });
  res.json(docs);
});

router.post('/documents', async (req, res) => {
  const { stage, documentName } = req.body;
  if (!stage || !documentName) {
    return res.status(400).json({ error: 'Stage and Document Name are required.' });
  }
  const newDoc = await prisma.requiredDocument.create({
    data: { stage, documentName },
  });
  res.status(201).json(newDoc);
});

router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.requiredDocument.delete({ where: { id } });
  res.status(204).send();
});

export default router;
