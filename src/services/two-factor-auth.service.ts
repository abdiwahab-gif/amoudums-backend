/**
 * Two-Factor Authentication (2FA) Service
 * Supports TOTP (Time-based One-Time Password) using Google Authenticator
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { execute, query } from '@/database/connection';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface VerifyTwoFactorResult {
  success: boolean;
  message: string;
}

export class TwoFactorAuthService {
  /**
   * Generate 2FA secret and QR code for user setup
   */
  public static async generateSecret(email: string): Promise<TwoFactorSecret> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Academic Management (${email})`,
      issuer: 'Academic Management System',
      length: 32,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate 2FA secret');
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes (for account recovery)
    const backupCodes = this.generateBackupCodes(10);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable 2FA for a user
   */
  public static async enableTwoFactor(userId: string, secret: string): Promise<void> {
    const backupCodes = this.generateBackupCodes(10);
    const backupCodesJson = JSON.stringify(backupCodes);

    await execute(
      `UPDATE users 
       SET twoFactorEnabled = 1, twoFactorSecret = ?, twoFactorBackupCodes = ?
       WHERE id = ?`,
      [secret, backupCodesJson, userId]
    );
  }

  /**
   * Disable 2FA for a user (requires password confirmation)
   */
  public static async disableTwoFactor(userId: string): Promise<void> {
    await execute(
      `UPDATE users 
       SET twoFactorEnabled = 0, twoFactorSecret = NULL, twoFactorBackupCodes = NULL
       WHERE id = ?`,
      [userId]
    );
  }

  /**
   * Verify 2FA token
   */
  public static async verifyToken(userId: string, token: string): Promise<VerifyTwoFactorResult> {
    // Get user's 2FA secret
    const users = await query<any>(
      'SELECT twoFactorSecret FROM users WHERE id = ? AND twoFactorEnabled = 1',
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: '2FA not enabled for this user' };
    }

    const user = users[0];
    const secret = user.twoFactorSecret;

    // Verify token with 30-second window (allows for time drift)
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows (60 seconds total)
    });

    if (!verified) {
      return { success: false, message: 'Invalid 2FA token' };
    }

    return { success: true, message: '2FA verified successfully' };
  }

  /**
   * Verify backup code
   */
  public static async verifyBackupCode(userId: string, backupCode: string): Promise<VerifyTwoFactorResult> {
    const users = await query<any>(
      'SELECT twoFactorBackupCodes FROM users WHERE id = ? AND twoFactorEnabled = 1',
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: '2FA not enabled for this user' };
    }

    const user = users[0];
    const backupCodes = JSON.parse(user.twoFactorBackupCodes || '[]');

    const codeIndex = backupCodes.indexOf(backupCode);
    if (codeIndex === -1) {
      return { success: false, message: 'Invalid backup code' };
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);

    await execute(
      'UPDATE users SET twoFactorBackupCodes = ? WHERE id = ?',
      [JSON.stringify(backupCodes), userId]
    );

    return { success: true, message: 'Backup code verified and removed' };
  }

  /**
   * Check if user has 2FA enabled
   */
  public static async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const users = await query<any>(
      'SELECT twoFactorEnabled FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return false;
    return users[0].twoFactorEnabled === 1;
  }

  /**
   * Generate random backup codes
   */
  private static generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Array(8)
        .fill(0)
        .map(() => Math.floor(Math.random() * 10))
        .join('');
      codes.push(code);
    }
    return codes;
  }
}
