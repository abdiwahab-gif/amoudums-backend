import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth';
import { TwoFactorAuthService } from '@/services/two-factor-auth.service';
import { PasswordPolicyValidator } from '@/utils/password-policy';

const router = Router();

// Helper to get client IP
const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
};

// Helper to get user agent
const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || '';
};

// Register with enhanced validation
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').custom((value) => {
      const validation = PasswordPolicyValidator.validate(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
    body('firstName').notEmpty().trim().isLength({ min: 2, max: 100 }),
    body('lastName').notEmpty().trim().isLength({ min: 2, max: 100 }),
    body('role').isIn(['admin', 'teacher', 'student', 'parent', 'staff']),
  ],
  AuthController.register
);

// Login with security enhancements
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    try {
      const { email, password } = req.body;
      const result = await AuthController.login(email, password, ipAddress, userAgent);
      res.status(200).json(result);
      return;
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
      return;
    }
  }
);

// Verify 2FA token
router.post(
  '/verify-2fa',
  authenticateToken,
  [body('token').isLength({ min: 6, max: 6 }).isNumeric()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { token } = req.body;
      const userId = (req as any).user.id;

      const verifyResult = await TwoFactorAuthService.verifyToken(userId, token);

      if (!verifyResult.success) {
        res.status(401).json({
          success: false,
          message: verifyResult.message,
        });
        return;
      }

      const result = await AuthController.completeTwoFactorLogin(
        userId,
        getClientIp(req),
        getUserAgent(req)
      );

      res.status(200).json(result);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify 2FA',
      });
      return;
    }
  }
);

// Verify backup code (alternative to TOTP)
router.post(
  '/verify-backup-code',
  authenticateToken,
  [body('backupCode').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { backupCode } = req.body;
      const userId = (req as any).user.id;

      const verifyResult = await TwoFactorAuthService.verifyBackupCode(userId, backupCode);

      if (!verifyResult.success) {
        res.status(401).json({
          success: false,
          message: verifyResult.message,
        });
        return;
      }

      const result = await AuthController.completeTwoFactorLogin(
        userId,
        getClientIp(req),
        getUserAgent(req)
      );

      res.status(200).json(result);
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify backup code',
      });
      return;
    }
  }
);

// Setup 2FA (generate QR code and backup codes)
router.post(
  '/setup-2fa',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const twoFactorSecret = await AuthController.setupTwoFactor(userId);

      res.status(200).json({
        success: true,
        message: '2FA setup initiated',
        data: twoFactorSecret,
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to setup 2FA',
      });
      return;
    }
  }
);

// Confirm 2FA setup
router.post(
  '/confirm-2fa',
  authenticateToken,
  [body('secret').notEmpty(), body('token').isLength({ min: 6, max: 6 }).isNumeric()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { secret, token } = req.body;
      const userId = (req as any).user.id;

      // Verify token first
      const tempSecret = secret;
      const verified = require('speakeasy').totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (!verified) {
        res.status(400).json({
          success: false,
          message: 'Invalid 2FA token',
        });
        return;
      }

      await AuthController.enableTwoFactor(userId, secret, getClientIp(req), getUserAgent(req));

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to confirm 2FA',
      });
      return;
    }
  }
);

// Disable 2FA (requires password)
router.post(
  '/disable-2fa',
  authenticateToken,
  [body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = (req as any).user.id;

      await AuthController.disableTwoFactor(userId, password, getClientIp(req), getUserAgent(req));

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to disable 2FA',
      });
      return;
    }
  }
);

// Get profile
router.get('/profile', authenticateToken, AuthController.getProfile);

// Update profile
router.put('/profile', authenticateToken, AuthController.updateProfile);

// Change password
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').custom((value) => {
      const validation = PasswordPolicyValidator.validate(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.id;

      await AuthController.changePassword(userId, currentPassword, newPassword, getClientIp(req), getUserAgent(req));

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
      return;
    }
  }
);

// Get login history
router.get(
  '/login-history',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const history = await AuthController.getLoginHistory(userId);

      res.status(200).json({
        success: true,
        data: history,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch login history',
      });
      return;
    }
  }
);

export default router;
