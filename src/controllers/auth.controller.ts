import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '@/services/auth.service';
import { SecurityAuditService } from '@/services/security-audit.service';
import { validationResult } from 'express-validator';
import { config } from '@/config';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { email, password, firstName, lastName, role } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const user = await AuthService.registerUser(
        email,
        password,
        firstName,
        lastName,
        role,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
      return;
    }
  }

  static async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    const result = await AuthService.loginUser(email, password, ipAddress, userAgent);

    if (result.requiresTwoFactor) {
      return {
        success: true,
        message: 'Login successful. Please verify with 2FA.',
        data: {
          user: result.user,
          requiresTwoFactor: true,
          tempToken: result.tempToken,
        },
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: { user: result.user, token: result.token },
    };
  }

  static async completeTwoFactorLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    const user = await AuthService.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Create permanent token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const signOptions: any = {
      expiresIn: config.jwt.expiry,
    };
    const token = jwt.sign(payload, config.jwt.secret, signOptions);

    // Log successful 2FA verification
    await SecurityAuditService.logAuditEvent(
      userId,
      'TWO_FACTOR_VERIFIED',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return {
      success: true,
      message: 'Authentication successful',
      data: { user, token },
    };
  }

  static async setupTwoFactor(userId: string): Promise<any> {
    return await AuthService.setupTwoFactor(userId);
  }

  static async enableTwoFactor(
    userId: string,
    secret: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    return await AuthService.enableTwoFactor(userId, secret, ipAddress, userAgent);
  }

  static async disableTwoFactor(
    userId: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    return await AuthService.disableTwoFactor(userId, password, ipAddress, userAgent);
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    return await AuthService.changePassword(userId, currentPassword, newPassword, ipAddress, userAgent);
  }

  static async getLoginHistory(userId: string): Promise<any[]> {
    return await SecurityAuditService.getLoginHistory(userId, 20);
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved',
        data: user,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve profile',
      });
      return;
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await AuthService.updateUser(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
      return;
    }
  }
}
