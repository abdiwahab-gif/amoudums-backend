import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { validationResult } from 'express-validator';

export class AuthController {
  static async register(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password, firstName, lastName, role } = req.body;

      const user = await AuthService.registerUser(email, password, firstName, lastName, role);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const { user, token } = await AuthService.loginUser(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved',
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve profile',
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await AuthService.updateUser(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }
}
