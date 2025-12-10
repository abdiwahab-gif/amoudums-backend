import { query, execute } from '@/database/connection';
import { Teacher } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class TeacherService {
  static async createTeacher(data: Partial<Teacher>): Promise<Teacher> {
    const teacherId = uuidv4();
    const {
      userId,
      employeeId,
      department,
      qualifications,
      experience,
      specialization,
      officeLocation,
    } = data;

    await execute(
      `INSERT INTO teachers (
        id, userId, employeeId, department, qualifications,
        experience, specialization, officeLocation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teacherId,
        userId,
        employeeId,
        department || null,
        qualifications || null,
        experience || null,
        specialization || null,
        officeLocation || null,
      ]
    );

    const teachers = await query<Teacher>(
      'SELECT * FROM teachers WHERE id = ?',
      [teacherId]
    );

    return teachers[0];
  }

  static async getTeacherById(teacherId: string): Promise<Teacher | null> {
    const teachers = await query<Teacher>(
      'SELECT * FROM teachers WHERE id = ?',
      [teacherId]
    );

    return teachers.length > 0 ? teachers[0] : null;
  }

  static async getTeacherByUserId(userId: string): Promise<Teacher | null> {
    const teachers = await query<Teacher>(
      'SELECT * FROM teachers WHERE userId = ?',
      [userId]
    );

    return teachers.length > 0 ? teachers[0] : null;
  }

  static async getAllTeachers(
    page: number = 1,
    limit: number = 10,
    filters?: any
  ): Promise<{ teachers: Teacher[]; total: number }> {
    let whereConditions = '';
    const params: any[] = [];

    if (filters) {
      const conditions: string[] = [];

      if (filters.department) {
        conditions.push('department = ?');
        params.push(filters.department);
      }

      if (filters.search) {
        conditions.push('(firstName LIKE ? OR lastName LIKE ? OR employeeId LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      if (conditions.length > 0) {
        whereConditions = 'WHERE ' + conditions.join(' AND ');
      }
    }

    const offset = (page - 1) * limit;

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM teachers ${whereConditions}`,
      params
    );

    const total = countResult[0].total;

    const teachers = await query<Teacher>(
      `SELECT * FROM teachers ${whereConditions} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { teachers, total };
  }

  static async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<Teacher> {
    const allowedFields = [
      'department',
      'qualifications',
      'experience',
      'specialization',
      'officeLocation',
    ];

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

    updateValues.push(teacherId);

    await execute(
      `UPDATE teachers SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const teacher = await this.getTeacherById(teacherId);
    if (!teacher) throw new Error('Teacher not found');

    return teacher;
  }

  static async deleteTeacher(teacherId: string): Promise<void> {
    await execute(
      'DELETE FROM teachers WHERE id = ?',
      [teacherId]
    );
  }
}
