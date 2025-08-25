import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
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

export default router;
