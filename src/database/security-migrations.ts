/**
 * Database schema migrations for security enhancements
 * Adds 2FA, security tables, and audit logging
 */

import pool from './connection';

async function hasColumn(connection: any, tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(connection: any, tableName: string, columnName: string, definition: string): Promise<void> {
  const exists = await hasColumn(connection, tableName, columnName);
  if (!exists) {
    await connection.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

export async function addSecurityEnhancements() {
  const connection = await pool.getConnection();

  try {
    // Backward-compatible user profile columns for legacy schemas
    await addColumnIfMissing(connection, 'users', 'firstName', 'firstName VARCHAR(100)');
    await addColumnIfMissing(connection, 'users', 'lastName', 'lastName VARCHAR(100)');
    await addColumnIfMissing(connection, 'users', 'status', "status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'");
    await addColumnIfMissing(connection, 'users', 'phone', 'phone VARCHAR(20)');
    await addColumnIfMissing(connection, 'users', 'photo', 'photo VARCHAR(255)');
    await addColumnIfMissing(connection, 'users', 'deletedAt', 'deletedAt TIMESTAMP NULL');

    // Populate new columns from existing legacy fields when available
    const hasLegacyName = await hasColumn(connection, 'users', 'name');
    if (hasLegacyName) {
      await connection.execute(`
        UPDATE users
        SET firstName = COALESCE(NULLIF(firstName, ''), SUBSTRING_INDEX(name, ' ', 1), email)
        WHERE firstName IS NULL OR firstName = ''
      `);

      await connection.execute(`
        UPDATE users
        SET lastName = COALESCE(
          NULLIF(lastName, ''),
          NULLIF(TRIM(SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 1)), ''),
          'User'
        )
        WHERE lastName IS NULL OR lastName = ''
      `);
    } else {
      await connection.execute(`
        UPDATE users
        SET firstName = COALESCE(NULLIF(firstName, ''), email)
        WHERE firstName IS NULL OR firstName = ''
      `);

      await connection.execute(`
        UPDATE users
        SET lastName = COALESCE(NULLIF(lastName, ''), 'User')
        WHERE lastName IS NULL OR lastName = ''
      `);
    }

    await connection.execute(`
      UPDATE users
      SET status = CASE
        WHEN isActive = 0 THEN 'inactive'
        ELSE 'active'
      END
      WHERE status IS NULL OR status = ''
    `);

    // Add 2FA fields to users table if they don't exist
    await addColumnIfMissing(connection, 'users', 'twoFactorEnabled', 'twoFactorEnabled TINYINT(1) DEFAULT 0');
    await addColumnIfMissing(connection, 'users', 'twoFactorSecret', 'twoFactorSecret VARCHAR(255)');
    await addColumnIfMissing(connection, 'users', 'twoFactorBackupCodes', 'twoFactorBackupCodes JSON');
    await addColumnIfMissing(connection, 'users', 'lastPasswordChangeDate', 'lastPasswordChangeDate TIMESTAMP');
    await addColumnIfMissing(connection, 'users', 'passwordExpiryDate', 'passwordExpiryDate TIMESTAMP');
    await addColumnIfMissing(connection, 'users', 'lastLoginDate', 'lastLoginDate TIMESTAMP');
    await addColumnIfMissing(connection, 'users', 'lastFailedLoginDate', 'lastFailedLoginDate TIMESTAMP');

    // Create login_attempts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36),
        email VARCHAR(255) NOT NULL,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        success TINYINT(1) NOT NULL,
        reason VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_timestamp (timestamp),
        INDEX idx_success (success)
      )
    `);

    // Create audit_logs table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entityType VARCHAR(100),
        entityId VARCHAR(36),
        oldValues JSON,
        newValues JSON,
        changes JSON,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_action (action),
        INDEX idx_timestamp (timestamp),
        INDEX idx_entityType (entityType)
      )
    `);

    // Create password_history table for tracking password changes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_history (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_changedAt (changedAt)
      )
    `);

    // Create user_sessions table for tracking active sessions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        token VARCHAR(500) NOT NULL UNIQUE,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiresAt TIMESTAMP NOT NULL,
        revokedAt TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_token (token),
        INDEX idx_expiresAt (expiresAt)
      )
    `);

    // Create security_settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_settings (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL UNIQUE,
        requireTwoFactor TINYINT(1) DEFAULT 0,
        passwordExpiryDays INT DEFAULT 90,
        sessionTimeoutMinutes INT DEFAULT 30,
        allowRememberMe TINYINT(1) DEFAULT 1,
        notifyNewLogin TINYINT(1) DEFAULT 1,
        restrictIpAddress VARCHAR(45),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId)
      )
    `);

    console.log('✓ Security enhancements applied successfully');
  } catch (error) {
    console.error('Error applying security enhancements:', error);
    throw error;
  } finally {
    await connection.release();
  }
}
