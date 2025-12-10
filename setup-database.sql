-- Academic Management System Database Setup
-- Run this file to create the database and all tables

-- Create database
CREATE DATABASE IF NOT EXISTS academic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_db;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student', 'staff', 'department_head') NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  studentNumber VARCHAR(50) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  dateOfBirth DATE,
  gender ENUM('male', 'female', 'other'),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  guardianName VARCHAR(255),
  guardianPhone VARCHAR(20),
  admissionDate DATE,
  currentGPA DECIMAL(3, 2) DEFAULT 0.00,
  status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_number (studentNumber),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  employeeNumber VARCHAR(50) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  qualification VARCHAR(255),
  specialization VARCHAR(255),
  joiningDate DATE,
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_employee_number (employeeNumber),
  INDEX idx_department (department)
) ENGINE=InnoDB;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  isActive BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id VARCHAR(36) PRIMARY KEY,
  sessionId VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  isActive BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grade VARCHAR(50),
  capacity INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id VARCHAR(36) PRIMARY KEY,
  classId VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  capacity INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  credits INT NOT NULL,
  department VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Class Courses (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS class_courses (
  id VARCHAR(36) PRIMARY KEY,
  classId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  teacherId VARCHAR(36),
  semesterId VARCHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (semesterId) REFERENCES semesters(id) ON DELETE SET NULL,
  UNIQUE KEY unique_class_course (classId, courseId, semesterId)
) ENGINE=InnoDB;

-- Student Enrollments
CREATE TABLE IF NOT EXISTS student_enrollments (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  classId VARCHAR(36) NOT NULL,
  sectionId VARCHAR(36),
  semesterId VARCHAR(36) NOT NULL,
  enrollmentDate DATE NOT NULL,
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (sectionId) REFERENCES sections(id) ON DELETE SET NULL,
  FOREIGN KEY (semesterId) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  remarks TEXT,
  markedBy VARCHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (markedBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_date (studentId, date),
  INDEX idx_course_date (courseId, date)
) ENGINE=InnoDB;

-- Exam Types table
CREATE TABLE IF NOT EXISTS exam_types (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weightage INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Grading Systems table
CREATE TABLE IF NOT EXISTS grading_systems (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Grade Mappings table
CREATE TABLE IF NOT EXISTS grade_mappings (
  id VARCHAR(36) PRIMARY KEY,
  gradingSystemId VARCHAR(36) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  minMarks DECIMAL(5, 2) NOT NULL,
  maxMarks DECIMAL(5, 2) NOT NULL,
  gradePoint DECIMAL(3, 2) NOT NULL,
  description VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gradingSystemId) REFERENCES grading_systems(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Exam Results table
CREATE TABLE IF NOT EXISTS exam_results (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  courseId VARCHAR(36) NOT NULL,
  examTypeId VARCHAR(36) NOT NULL,
  semesterId VARCHAR(36) NOT NULL,
  marksObtained DECIMAL(5, 2) NOT NULL,
  totalMarks DECIMAL(5, 2) NOT NULL,
  grade VARCHAR(10),
  gradePoint DECIMAL(3, 2),
  remarks TEXT,
  examDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (examTypeId) REFERENCES exam_types(id) ON DELETE CASCADE,
  FOREIGN KEY (semesterId) REFERENCES semesters(id) ON DELETE CASCADE,
  INDEX idx_student_semester (studentId, semesterId)
) ENGINE=InnoDB;

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  semesterId VARCHAR(36),
  sessionId VARCHAR(36),
  cumulativeGPA DECIMAL(3, 2),
  semesterGPA DECIMAL(3, 2),
  totalCreditsEarned INT,
  generatedDate DATE,
  isOfficial BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (semesterId) REFERENCES semesters(id) ON DELETE SET NULL,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Library Books table
CREATE TABLE IF NOT EXISTS library_books (
  id VARCHAR(36) PRIMARY KEY,
  isbn VARCHAR(20) UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  publisher VARCHAR(255),
  category VARCHAR(100),
  quantity INT DEFAULT 1,
  availableQuantity INT DEFAULT 1,
  location VARCHAR(100),
  status ENUM('available', 'borrowed', 'reserved', 'maintenance') DEFAULT 'available',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_isbn (isbn),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- Library Borrowing table
CREATE TABLE IF NOT EXISTS library_borrowing (
  id VARCHAR(36) PRIMARY KEY,
  bookId VARCHAR(36) NOT NULL,
  borrowerId VARCHAR(36) NOT NULL,
  borrowerType ENUM('student', 'teacher', 'staff') NOT NULL,
  borrowDate DATE NOT NULL,
  dueDate DATE NOT NULL,
  returnDate DATE,
  status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
  fineAmount DECIMAL(10, 2) DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bookId) REFERENCES library_books(id) ON DELETE CASCADE,
  INDEX idx_borrower (borrowerId, borrowerType),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Finance Fees table
CREATE TABLE IF NOT EXISTS finance_fees (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  semesterId VARCHAR(36) NOT NULL,
  feeType VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  dueDate DATE,
  paidAmount DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
  paymentDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (semesterId) REFERENCES semesters(id) ON DELETE CASCADE,
  INDEX idx_student_status (studentId, status)
) ENGINE=InnoDB;

-- HR Employees table
CREATE TABLE IF NOT EXISTS hr_employees (
  id VARCHAR(36) PRIMARY KEY,
  employeeNumber VARCHAR(50) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  salary DECIMAL(10, 2),
  joiningDate DATE,
  status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_number (employeeNumber),
  INDEX idx_department (department)
) ENGINE=InnoDB;

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('general', 'academic', 'event', 'urgent', 'exam') DEFAULT 'general',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  targetAudience ENUM('all', 'students', 'teachers', 'staff') DEFAULT 'all',
  publishDate DATE,
  expiryDate DATE,
  isActive BOOLEAN DEFAULT TRUE,
  createdBy VARCHAR(36),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_publish_date (publishDate)
) ENGINE=InnoDB;

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  userRole VARCHAR(50),
  userName VARCHAR(255),
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'ACCESS', 'LOGIN', 'LOGOUT') NOT NULL,
  entityType VARCHAR(100) NOT NULL,
  entityId VARCHAR(36),
  changes TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_action (userId, action),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password, name, role, isActive) 
VALUES (
  UUID(),
  'admin@academic.edu',
  '$2a$10$rqQZXzKxMxVzKjZxvXyKP.JYxN0xZYQJZr8z9YQeWZ9YQ8Z9YQ8Z9',
  'System Administrator',
  'admin',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Insert default grading system
INSERT INTO grading_systems (id, name, description, isActive)
VALUES (
  UUID(),
  'Standard GPA 4.0',
  'Standard 4.0 GPA grading system',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Insert grade mappings for the default grading system
SET @grading_system_id = (SELECT id FROM grading_systems WHERE name = 'Standard GPA 4.0' LIMIT 1);

INSERT INTO grade_mappings (id, gradingSystemId, grade, minMarks, maxMarks, gradePoint, description)
VALUES
  (UUID(), @grading_system_id, 'A+', 90.00, 100.00, 4.00, 'Excellent'),
  (UUID(), @grading_system_id, 'A', 85.00, 89.99, 3.70, 'Very Good'),
  (UUID(), @grading_system_id, 'A-', 80.00, 84.99, 3.30, 'Good'),
  (UUID(), @grading_system_id, 'B+', 75.00, 79.99, 3.00, 'Above Average'),
  (UUID(), @grading_system_id, 'B', 70.00, 74.99, 2.70, 'Average'),
  (UUID(), @grading_system_id, 'B-', 65.00, 69.99, 2.30, 'Below Average'),
  (UUID(), @grading_system_id, 'C+', 60.00, 64.99, 2.00, 'Pass'),
  (UUID(), @grading_system_id, 'C', 55.00, 59.99, 1.70, 'Marginal Pass'),
  (UUID(), @grading_system_id, 'F', 0.00, 54.99, 0.00, 'Fail')
ON DUPLICATE KEY UPDATE id=id;

-- Insert default exam types
INSERT INTO exam_types (id, name, description, weightage)
VALUES
  (UUID(), 'Midterm', 'Mid-semester examination', 30),
  (UUID(), 'Final', 'End-of-semester examination', 50),
  (UUID(), 'Quiz', 'Regular quizzes', 10),
  (UUID(), 'Assignment', 'Course assignments', 10)
ON DUPLICATE KEY UPDATE id=id;

COMMIT;

SELECT 'Database setup completed successfully!' as Status;
