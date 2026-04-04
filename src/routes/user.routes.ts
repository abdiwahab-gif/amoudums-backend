import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AuthService } from '@/services/auth.service';
import { authenticateToken, authorizeRole } from '@/middleware/auth';

const router = Router();

const getClientIp = (req: Request): string => {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
};

const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || '';
};

router.use(authenticateToken);
router.use(authorizeRole('admin'));

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isString(),
    query('status').optional().isString(),
    query('search').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
      const offset = (page - 1) * limit;

      const role = typeof req.query.role === 'string' && req.query.role !== 'all' ? req.query.role : undefined;
      const status = typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : undefined;
      const search = typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : undefined;

      const { users, total } = await AuthService.getAllUsers(limit, offset, { role, status, search });

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }
);

router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 12 }),
    body('firstName').isString().notEmpty().trim(),
    body('lastName').isString().notEmpty().trim(),
    body('role').isIn(['admin', 'teacher', 'student', 'parent', 'staff']),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { email, password, firstName, lastName, role } = req.body;
      const user = await AuthService.registerUser(
        email,
        password,
        firstName,
        lastName,
        role,
        getClientIp(req),
        getUserAgent(req)
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user',
      });
    }
  }
);

router.put(
  '/:id',
  [param('id').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const updated = await AuthService.updateUser(req.params.id, req.body || {});
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }
);

router.delete(
  '/:id',
  [param('id').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      await AuthService.deleteUser(req.params.id, getClientIp(req), getUserAgent(req));
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete user',
      });
    }
  }
);

export default router;
