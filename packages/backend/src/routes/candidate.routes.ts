import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, adminOnly, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  importCandidates,
  exportCandidates,
} from '../controllers/candidate.controller';
import { prisma } from '../index';
import { generateCandidatePDF } from '../services/pdf.service';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Get all candidates with filters
router.get(
  '/',
  [
    query('status').optional().isIn(['AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON', 'RESERVED', 'IN_PROCESS', 'PLACED']),
    query('nationality').optional().isString(),
    query('search').optional().isString(),
  ],
  validate,
  getAllCandidates
);

// Get candidate by ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  getCandidateById
);

// Get candidate applications
router.get(
  '/:id/applications',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user!.companyId;

      const applications = await prisma.application.findMany({
        where: {
          candidateId: id,
          companyId
        },
        include: {
          client: true,
          candidate: true,
          broker: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(applications);
    } catch (error) {
      console.error('Error fetching candidate applications:', error);
      res.status(500).json({ error: 'Failed to fetch candidate applications' });
    }
  }
);

// Create new candidate
router.post(
  '/',
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('nationality').notEmpty().trim(),
    body('status').isIn(['AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON', 'RESERVED', 'IN_PROCESS', 'PLACED']),
    body('dateOfBirth').optional().isISO8601(),
    body('education').optional().trim(),
    body('experienceSummary').optional().trim(),
    body('skills').optional().isArray(),
    body('agentId').optional().isUUID(),
  ],
  validate,
  createCandidate
);

// Update candidate
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('nationality').optional().trim(),
    body('status').optional().isIn(['AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON', 'RESERVED', 'IN_PROCESS', 'PLACED']),
    body('dateOfBirth').optional().isISO8601(),
    body('education').optional().trim(),
    body('experienceSummary').optional().trim(),
    body('skills').optional().isArray(),
    body('agentId').optional().isUUID(),
  ],
  validate,
  updateCandidate
);

// Delete candidate
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  deleteCandidate
);

// Import candidates from CSV
router.post('/import', importCandidates);

// Export candidates to CSV
router.get('/export', exportCandidates);

// Export candidate as PDF
router.get('/:id/export-pdf', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;
    
    const candidate = await prisma.candidate.findFirst({
      where: { 
        id,
        companyId,
      },
      include: {
        agent: true,
        applications: {
          include: {
            client: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    
    const pdfBuffer = await generateCandidatePDF(candidate);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.firstName}_${candidate.lastName}_profile.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
