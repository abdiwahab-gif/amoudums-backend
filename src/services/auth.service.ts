import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { query, execute } from '@/database/connection';
import { User, JwtPayload } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PasswordPolicyValidator } from '@/utils/password-policy';
import { TwoFactorAuthService } from '@/services/two-factor-auth.service';
import { SecurityAuditService } from '@/services/security-audit.service';

export class AuthService {
  /**
   * Register a new user with strong password validation
   */
  static async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    // Validate password strength
    const passwordValidation = PasswordPolicyValidator.validate(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password policy violation: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if email already exists
    const existingUsers = await query<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcryptjs.hash(password, 12); // Increased from 10 to 12 rounds
    const userId = uuidv4();

    await execute(
      `INSERT INTO users 
       (id, email, password, firstName, lastName, role, status, lastPasswordChangeDate)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [userId, email, hashedPassword, firstName, lastName, role]
    );

    // Log registration audit event
    if (ipAddress && userAgent) {
      await SecurityAuditService.logAuditEvent(
        userId,
        'USER_REGISTERED',
        'User',
        userId,
        { email, role, firstName, lastName },
        ipAddress,
        userAgent
      );
    }

    const users = await query<User>(
      'SELECT id, email, firstName, lastName, role, status, phone, photo, createdAt FROM users WHERE id = ?',
      [userId]
    );

    return users[0];
  }

  /**
   * Login user with 2FA support and security checks
   */
  static async loginUser(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{
    user: User;
    token: string;
    requiresTwoFactor: boolean;
    tempToken?: string;
  }> {
    // Check if account is locked
    const isLocked = await SecurityAuditService.isAccountLocked(email);
    if (isLocked) {
      await SecurityAuditService.logLoginAttempt(null, email, ipAddress, userAgent, false, 'Account locked');
      throw new Error('Account temporarily locked due to multiple failed login attempts. Try again in 15 minutes.');
    }

    const users = await query<User & { password: string; twoFactorEnabled: boolean }>(
      'SELECT * FROM users WHERE email = ? AND deletedAt IS NULL',
      [email]
    );

    if (users.length === 0) {
      await SecurityAuditService.logLoginAttempt(null, email, ipAddress, userAgent, false, 'Invalid email');
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if account is suspended
    if (user.status === 'suspended') {
      await SecurityAuditService.logLoginAttempt(user.id, email, ipAddress, userAgent, false, 'Account suspended');
      throw new Error('Your account has been suspended. Please contact support.');
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      await SecurityAuditService.logLoginAttempt(user.id, email, ipAddress, userAgent, false, 'Invalid password');
      throw new Error('Invalid email or password');
    }

    // Clear failed login attempts on successful password verification
    await SecurityAuditService.clearFailedAttempts(email);

    // Update last login
    await execute('UPDATE users SET lastLoginDate = NOW() WHERE id = ?', [user.id]);

    // Check if 2FA is enabled
    const requiresTwoFactor = Boolean(user.twoFactorEnabled);

    // Log successful authentication (before 2FA if applicable)
    await SecurityAuditService.logLoginAttempt(user.id, email, ipAddress, userAgent, true, 'Password verified');

    const { password: _, ...userWithoutPassword } = user;

    // If 2FA is enabled, return temp token and require 2FA verification
    if (requiresTwoFactor) {
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, pending2FA: true },
        config.jwt.secret,
        { expiresIn: '5m' } // Short expiry for 2FA verification
      );

      return {
        user: userWithoutPassword as User,
        token: '', // Empty until 2FA verified
        requiresTwoFactor: true,
        tempToken,
      };
    }

    // Create permanent token
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const signOptions: any = {
      expiresIn: config.jwt.expiry || '7d',
    };

    const token: string = jwt.sign(payload, config.jwt.secret || 'your-secret-key', signOptions);

    // Detect suspicious activity
    const suspiciousActivity = await SecurityAuditService.detectSuspiciousActivity(user.id);
    if (suspiciousActivity.isSuspicious) {
      console.warn(`Suspicious activity detected for user ${user.id}:`, suspiciousActivity.reasons);
    }

    return {
      user: userWithoutPassword as User,
      token,
      requiresTwoFactor: false,
    };
  }

  /**
   * Verify 2FA and complete login
   */
  static async completeTwoFactorLogin(
    userId: string,
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ user: User; token: string }> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Create permanent token
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const permanentSignOptions: any = {
      expiresIn: config.jwt.expiry || '7d',
    };

    const permanentToken: string = jwt.sign(payload, config.jwt.secret || 'your-secret-key', permanentSignOptions);

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

    return { user, token: permanentToken };
  }

  /**
   * Change user password with validation
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Validate new password strength
    const passwordValidation = PasswordPolicyValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password policy violation: ${passwordValidation.errors.join(', ')}`);
    }

    // Get user with current password
    const users = await query<any>(
      'SELECT id, email, password FROM users WHERE id = ? AND deletedAt IS NULL',
      [userId]
    );

    if (users.length === 0) throw new Error('User not found');

    const user = users[0];

    // Verify current password
    const passwordMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Check password history (user can't reuse last 5 passwords)
    const passwordHistory = await query<any>(
      `SELECT passwordHash FROM password_history WHERE userId = ? ORDER BY changedAt DESC LIMIT 5`,
      [userId]
    );

    for (const entry of passwordHistory) {
      const reusedPassword = await bcryptjs.compare(newPassword, entry.passwordHash);
      if (reusedPassword) {
        throw new Error('Cannot reuse one of your last 5 passwords');
      }
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    // Update password
    await execute(
      'UPDATE users SET password = ?, lastPasswordChangeDate = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // Store in password history
    await execute(
      'INSERT INTO password_history (userId, passwordHash) VALUES (?, ?)',
      [userId, hashedPassword]
    );

    // Log password change
    await SecurityAuditService.logAuditEvent(
      userId,
      'PASSWORD_CHANGED',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );
  }

  /**
   * Setup 2FA for user
   */
  static async setupTwoFactor(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const twoFactorSecret = await TwoFactorAuthService.generateSecret(user.email);
    return twoFactorSecret;
  }

  /**
   * Enable 2FA after verification
   */
  static async enableTwoFactor(
    userId: string,
    secret: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await TwoFactorAuthService.enableTwoFactor(userId, secret);

    await SecurityAuditService.logAuditEvent(
      userId,
      'TWO_FACTOR_ENABLED',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  static async disableTwoFactor(
    userId: string,
    password: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Verify password
    const users = await query<any>(
      'SELECT password FROM users WHERE id = ? AND deletedAt IS NULL',
      [userId]
    );

    if (users.length === 0) throw new Error('User not found');

    const passwordMatch = await bcryptjs.compare(password, users[0].password);
    if (!passwordMatch) {
      throw new Error('Password is incorrect');
    }

    await TwoFactorAuthService.disableTwoFactor(userId);

    await SecurityAuditService.logAuditEvent(
      userId,
      'TWO_FACTOR_DISABLED',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );
  }

  static async getUserById(userId: string): Promise<User | null> {
    const users = await query<User>(
      `SELECT id, email, firstName, lastName, role, status, phone, photo, 
              twoFactorEnabled, lastLoginDate, createdAt, updatedAt 
       FROM users WHERE id = ? AND deletedAt IS NULL`,
      [userId]
    );

    return users.length > 0 ? users[0] : null;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const allowedFields = ['firstName', 'lastName', 'phone', 'photo', 'status'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push((updates as any)[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateValues.push(userId);

    await execute(
      `UPDATE users SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      updateValues
    );

    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    return user;
  }

  /**
   * Soft delete user (admin only)
   */
  static async deleteUser(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await execute('UPDATE users SET deletedAt = NOW() WHERE id = ?', [userId]);

    await SecurityAuditService.logAuditEvent(
      userId,
      'USER_DELETED',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(
    limit: number = 50,
    offset: number = 0,
    filters?: { role?: string; status?: string; search?: string }
  ): Promise<{ users: User[]; total: number }> {
    let whereClause = 'WHERE deletedAt IS NULL';
    const params: any[] = [];

    if (filters?.role) {
      whereClause += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.search) {
      whereClause += ' AND (email LIKE ? OR firstName LIKE ? OR lastName LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await query<any>(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Get users
    const users = await query<User>(
      `SELECT id, email, firstName, lastName, role, status, phone, photo, 
              twoFactorEnabled, lastLoginDate, createdAt, updatedAt
       FROM users ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { users, total };
  }
}
