import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, getCurrentUser, changePassword } from '../controllers/auth.controller';
import { authenticate, superAdminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Login route
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 }),
  ],
  validate,
  login
);

// Register route (Super Admin only can create new users)
router.post(
  '/register',
  authenticate,
  superAdminOnly,
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['ADMIN', 'SUPER_ADMIN']),
  ],
  validate,
  register
);

// Get current user
router.get('/me', authenticate, getCurrentUser);

// Change password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  changePassword
);

export default router;
