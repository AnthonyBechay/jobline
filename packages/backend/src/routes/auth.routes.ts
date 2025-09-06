import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { 
  register, 
  login, 
  getCurrentUser, 
  changePassword,
  createUser
} from '../controllers/auth.controller';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  validate
], login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePassword);

// Super Admin only routes - Fix the middleware to properly return void
router.post('/users', 
  authenticate, 
  (req, res, next) => {
    // Manual authorization check for Super Admin
    if ((req as any).user?.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ error: 'Only Super Admin can create users' });
      return;
    }
    next();
  }, 
  createUser
);

export default router;