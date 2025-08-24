
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Public client-facing application by token
router.get('/applications/:token', async (req,res)=>{
  const { token } = req.params;
  const app = await prisma.application.findFirst({
    where: { clientAccessLink: token },
    include: {
      client: { select: { name: true } },
      candidate: { select: { firstName: true, lastName: true, nationality: true } },
      payments: true,
      documentChecklist: true
    }
  });
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json(app);
});

export default router;
