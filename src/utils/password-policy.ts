/**
 * Password Policy Validator
 * Implements strong password requirements for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-5
  errors: string[];
  suggestions: string[];
}

export class PasswordPolicyValidator {
  /**
   * Minimum password length - NIST recommendation
   */
  private static readonly MIN_LENGTH = 12;

  /**
   * Maximum password length - prevent DoS attacks
   */
  private static readonly MAX_LENGTH = 128;

  /**
   * Validate password against policy
   * Requirements:
   * - Minimum 12 characters (NIST 800-63B compliant)
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character (!@#$%^&*)
   */
  public static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    } else {
      score++;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    } else {
      score++;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    } else {
      score++;
    }

    // Number check
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    } else {
      score++;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    } else {
      score++;
    }

    // Common patterns to avoid
    if (this.containsCommonPatterns(password)) {
      errors.push('Password contains common patterns that are too predictable');
    }

    // Suggestions
    if (score < 3) {
      suggestions.push('Try mixing different character types for better security');
    }
    if (password.includes(' ')) {
      suggestions.push('Consider using spaces - they increase entropy without reducing usability');
    }

    return {
      isValid: errors.length === 0,
      score: Math.min(score, 5),
      errors,
      suggestions,
    };
  }

  /**
   * Check if password contains common patterns
   */
  private static containsCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^(123|abc|qwerty|password|12345)/i,
      /(.)\1{2,}/, // Three or more repeated characters
      /^[A-Za-z0-9]{1,5}$/, // Too simple (only 1-5 chars of one type)
    ];

    return commonPatterns.some((pattern) => pattern.test(password));
  }

  /**
   * Generate password strength feedback
   */
  public static getStrengthFeedback(score: number): string {
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return strengthLevels[Math.min(score, 5)];
  }
}
