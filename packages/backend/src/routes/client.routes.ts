import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientHistory,
  importClients,
  exportClients,
} from '../controllers/client.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(adminOnly);

// Get all clients with search
router.get(
  '/',
  [query('search').optional().isString()],
  validate,
  getAllClients
);

// Get client by ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  getClientById
);

// Get client hiring history
router.get(
  '/:id/history',
  [param('id').isUUID()],
  validate,
  getClientHistory
);

// Create new client
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('phone').notEmpty().trim(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('referredByClient').optional().isUUID(),
  ],
  validate,
  createClient
);

// Update client
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('referredByClient').optional().isUUID(),
  ],
  validate,
  updateClient
);

// Delete client
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  deleteClient
);

// Import clients from CSV
router.post('/import', importClients);

// Export clients to CSV
router.get('/export', exportClients);

export default router;
