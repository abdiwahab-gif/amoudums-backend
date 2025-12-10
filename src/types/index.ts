// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Student Types
export interface Student {
  id: string;
  userId: string;
  studentId: string;
  classId?: string;
  sectionId?: string;
  bloodType?: string;
  nationality?: string;
  religion?: string;
  address?: string;
  city?: string;
  zip?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  emergencyContact?: string;
  enrollmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Teacher Types
export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  department?: string;
  qualifications?: string;
  experience?: number;
  specialization?: string;
  officeLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class Types
export interface Class {
  id: string;
  name: string;
  classCode: string;
  description?: string;
  grade?: number;
  capacity?: number;
  classTeacherId?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Course Types
export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description?: string;
  credits?: number;
  teacherId?: string;
  classId?: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Exam Result Types
export interface ExamResult {
  id: string;
  studentId: string;
  courseId: string;
  examTypeId: string;
  score: number;
  totalScore: number;
  grade?: string;
  remarks?: string;
  examDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Types
export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
