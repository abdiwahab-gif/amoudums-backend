import { Router } from 'express';
import { body, param } from 'express-validator';
import { StudentController } from '@/controllers/student.controller';
import { authenticateToken, authorizeRole } from '@/middleware/auth';

const router = Router();

// All student routes require authentication
router.use(authenticateToken);

// Create Student (Admin only)
router.post(
  '/',
  authorizeRole('admin', 'teacher'),
  [
    body('userId').notEmpty(),
    body('studentId').notEmpty(),
  ],
  StudentController.createStudent
);

// Get All Students
router.get('/', StudentController.getStudents);

// Get Student by ID
router.get(
  '/:id',
  [param('id').notEmpty()],
  StudentController.getStudentById
);

// Update Student
router.put(
  '/:id',
  [param('id').notEmpty()],
  StudentController.updateStudent
);

// Delete Student (Admin only)
router.delete(
  '/:id',
  authorizeRole('admin'),
  [param('id').notEmpty()],
  StudentController.deleteStudent
);

export default router;
