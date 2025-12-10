import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { query, execute } from '@/database/connection';
import { User, JwtPayload } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  static async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string
  ): Promise<User> {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const userId = uuidv4();

    await execute(
      `INSERT INTO users (id, email, password, firstName, lastName, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [userId, email, hashedPassword, firstName, lastName, role]
    );

    const users = await query<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    return users[0];
  }

  static async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    const users = await query<User & { password: string }>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  static async getUserById(userId: string): Promise<User | null> {
    const users = await query<User>(
      'SELECT * FROM users WHERE id = ? AND deletedAt IS NULL',
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
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    return user;
  }
}
