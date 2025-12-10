import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('role').isIn(['admin', 'teacher', 'student', 'parent', 'staff']),
  ],
  AuthController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  AuthController.login
);

// Get Profile
router.get('/profile', authenticateToken, AuthController.getProfile);

// Update Profile
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;
