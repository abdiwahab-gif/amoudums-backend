/**
 * Security & Audit Service
 * Handles login attempt tracking, account lockout, and security events
 */

import { execute, query } from '@/database/connection';

export interface LoginAttempt {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
  timestamp: Date;
}

export interface AuditEvent {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export class SecurityAuditService {
  /**
   * Max login attempts before lockout
   */
  private static readonly MAX_LOGIN_ATTEMPTS = 5;

  /**
   * Lockout duration in minutes
   */
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  /**
   * Log login attempt
   */
  public static async logLoginAttempt(
    userId: string | null,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    await execute(
      `INSERT INTO login_attempts (userId, email, ipAddress, userAgent, success, reason, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, email, ipAddress, userAgent, success ? 1 : 0, reason]
    );
  }

  /**
   * Check if account is locked due to failed attempts
   */
  public static async isAccountLocked(email: string): Promise<boolean> {
    const lockoutTime = new Date(Date.now() - this.LOCKOUT_DURATION_MINUTES * 60 * 1000);

    const attempts = await query<any>(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE email = ? AND success = 0 AND timestamp > ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [email, lockoutTime, this.MAX_LOGIN_ATTEMPTS]
    );

    if (attempts.length === 0) return false;

    const recentFailedAttempts = attempts[0].count;
    return recentFailedAttempts >= this.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Get recent login attempts for a user
   */
  public static async getLoginHistory(userId: string, limit: number = 10): Promise<LoginAttempt[]> {
    const attempts = await query<LoginAttempt>(
      `SELECT * FROM login_attempts 
       WHERE userId = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return attempts;
  }

  /**
   * Clear failed login attempts (on successful login)
   */
  public static async clearFailedAttempts(email: string): Promise<void> {
    await execute(
      'DELETE FROM login_attempts WHERE email = ? AND success = 0',
      [email]
    );
  }

  /**
   * Log security audit event
   */
  public static async logAuditEvent(
    userId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    changes: Record<string, any> | null,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await execute(
      `INSERT INTO audit_logs 
       (userId, action, entityType, entityId, changes, ipAddress, userAgent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        entityType,
        entityId,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      ]
    );
  }

  /**
   * Get audit trail for entity
   */
  public static async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<any[]> {
    const events = await query<any>(
      `SELECT * FROM audit_logs 
       WHERE entityType = ? AND entityId = ?
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [entityType, entityId, limit]
    );

    return events;
  }

  /**
   * Get user's recent activity
   */
  public static async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    const events = await query<any>(
      `SELECT * FROM audit_logs 
       WHERE userId = ?
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return events;
  }

  /**
   * Detect suspicious activity patterns
   */
  public static async detectSuspiciousActivity(userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check for multiple failed logins
    const failedAttempts = await query<any>(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE userId = ? AND success = 0 
       AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [userId]
    );

    if (failedAttempts[0].count >= 3) {
      reasons.push('Multiple failed login attempts in last hour');
    }

    // Check for login from multiple IPs in short time
    const recentLogins = await query<any>(
      `SELECT DISTINCT ipAddress FROM login_attempts 
       WHERE userId = ? AND success = 1 
       AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [userId]
    );

    if (recentLogins.length >= 3) {
      reasons.push('Login from multiple IP addresses in last hour');
    }

    // Check for unusual access times
    const lastLogin = await query<any>(
      `SELECT timestamp FROM login_attempts 
       WHERE userId = ? AND success = 1 
       ORDER BY timestamp DESC LIMIT 1`,
      [userId]
    );

    if (lastLogin.length > 0) {
      const hourOfDay = new Date(lastLogin[0].timestamp).getHours();
      if (hourOfDay >= 2 && hourOfDay <= 5) {
        reasons.push('Login during unusual hours (2 AM - 5 AM)');
      }
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }
}
