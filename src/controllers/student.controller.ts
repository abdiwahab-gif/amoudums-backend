import { Request, Response } from 'express';
import { StudentService } from '@/services/student.service';
import { validationResult } from 'express-validator';

export class StudentController {
  static async createStudent(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const student = await StudentService.createStudent(req.body);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create student',
      });
      return;
    }
  }

  static async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        classId: req.query.classId,
        sectionId: req.query.sectionId,
        search: req.query.search,
      };

      const { students, total } = await StudentService.getAllStudents(page, limit, filters);

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve students',
      });
      return;
    }
  }

  static async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentService.getStudentById(id);

      if (!student) {
        res.status(404).json({
          success: false,
          message: 'Student not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve student',
      });
      return;
    }
  }

  static async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await StudentService.updateStudent(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student,
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update student',
      });
      return;
    }
  }

  static async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await StudentService.deleteStudent(id);

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
      return;
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete student',
      });
      return;
    }
  }
}
