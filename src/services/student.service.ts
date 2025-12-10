import { query, execute } from '@/database/connection';
import { Student } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class StudentService {
  static async createStudent(data: Partial<Student>): Promise<Student> {
    const studentId = uuidv4();
    const {
      userId,
      studentId: customStudentId,
      classId,
      sectionId,
      bloodType,
      nationality,
      religion,
      address,
      city,
      zip,
      fatherName,
      motherName,
      fatherPhone,
      motherPhone,
      emergencyContact,
      enrollmentDate,
    } = data;

    await execute(
      `INSERT INTO students (
        id, userId, studentId, classId, sectionId, bloodType, nationality,
        religion, address, city, zip, fatherName, motherName, fatherPhone,
        motherPhone, emergencyContact, enrollmentDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        userId,
        customStudentId,
        classId || null,
        sectionId || null,
        bloodType || null,
        nationality || null,
        religion || null,
        address || null,
        city || null,
        zip || null,
        fatherName || null,
        motherName || null,
        fatherPhone || null,
        motherPhone || null,
        emergencyContact || null,
        enrollmentDate || new Date(),
      ]
    );

    const students = await query<Student>(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    return students[0];
  }

  static async getStudentById(studentId: string): Promise<Student | null> {
    const students = await query<Student>(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    return students.length > 0 ? students[0] : null;
  }

  static async getStudentByUserId(userId: string): Promise<Student | null> {
    const students = await query<Student>(
      'SELECT * FROM students WHERE userId = ?',
      [userId]
    );

    return students.length > 0 ? students[0] : null;
  }

  static async getAllStudents(
    page: number = 1,
    limit: number = 10,
    filters?: any
  ): Promise<{ students: Student[]; total: number }> {
    let whereConditions = '';
    const params: any[] = [];

    if (filters) {
      const conditions: string[] = [];

      if (filters.classId) {
        conditions.push('classId = ?');
        params.push(filters.classId);
      }

      if (filters.sectionId) {
        conditions.push('sectionId = ?');
        params.push(filters.sectionId);
      }

      if (filters.search) {
        conditions.push('(firstName LIKE ? OR lastName LIKE ? OR studentId LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      if (conditions.length > 0) {
        whereConditions = 'WHERE ' + conditions.join(' AND ');
      }
    }

    const offset = (page - 1) * limit;

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM students ${whereConditions}`,
      params
    );

    const total = countResult[0].total;

    const students = await query<Student>(
      `SELECT * FROM students ${whereConditions} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { students, total };
  }

  static async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const allowedFields = [
      'classId',
      'sectionId',
      'bloodType',
      'nationality',
      'religion',
      'address',
      'city',
      'zip',
      'fatherName',
      'motherName',
      'fatherPhone',
      'motherPhone',
      'emergencyContact',
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

    updateValues.push(studentId);

    await execute(
      `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const student = await this.getStudentById(studentId);
    if (!student) throw new Error('Student not found');

    return student;
  }

  static async deleteStudent(studentId: string): Promise<void> {
    await execute(
      'DELETE FROM students WHERE id = ?',
      [studentId]
    );
  }
}
