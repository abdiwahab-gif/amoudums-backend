import pool from './connection';

export async function initializeTables() {
  const connection = await pool.getConnection();

  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('admin', 'teacher', 'student', 'parent', 'staff') NOT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        phone VARCHAR(20),
        photo VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      )
    `);

    // Students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        studentId VARCHAR(50) UNIQUE NOT NULL,
        classId VARCHAR(36),
        sectionId VARCHAR(36),
        bloodType VARCHAR(10),
        nationality VARCHAR(100),
        religion VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        zip VARCHAR(10),
        fatherName VARCHAR(150),
        motherName VARCHAR(150),
        fatherPhone VARCHAR(20),
        motherPhone VARCHAR(20),
        emergencyContact VARCHAR(20),
        enrollmentDate DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_studentId (studentId),
        INDEX idx_classId (classId)
      )
    `);

    // Teachers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS teachers (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        employeeId VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(100),
        qualifications TEXT,
        experience INT,
        specialization VARCHAR(150),
        officeLocation VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_employeeId (employeeId)
      )
    `);

    // Classes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        classCode VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        grade INT,
        capacity INT,
        classTeacherId VARCHAR(36),
        sessionId VARCHAR(36),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_grade (grade),
        INDEX idx_sessionId (sessionId)
      )
    `);

    // Sections table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sections (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        classId VARCHAR(36) NOT NULL,
        capacity INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_section (classId, name),
        INDEX idx_classId (classId)
      )
    `);

    // Courses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(36) PRIMARY KEY,
        courseCode VARCHAR(50) UNIQUE NOT NULL,
        courseName VARCHAR(150) NOT NULL,
        description TEXT,
        credits INT DEFAULT 3,
        teacherId VARCHAR(36),
        classId VARCHAR(36),
        sessionId VARCHAR(36),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES teachers(id),
        FOREIGN KEY (classId) REFERENCES classes(id),
        INDEX idx_courseCode (courseCode),
        INDEX idx_teacherId (teacherId),
        INDEX idx_classId (classId)
      )
    `);

    // Sessions table (Academic Year)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        isActive BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive)
      )
    `);

    // Semesters table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS semesters (
        id VARCHAR(36) PRIMARY KEY,
        sessionId VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        isActive BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
        INDEX idx_sessionId (sessionId),
        INDEX idx_isActive (isActive)
      )
    `);

    // Attendance table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(36) PRIMARY KEY,
        studentId VARCHAR(36) NOT NULL,
        courseId VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
        remarks TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
        INDEX idx_studentId (studentId),
        INDEX idx_courseId (courseId),
        INDEX idx_date (date),
        UNIQUE KEY unique_attendance (studentId, courseId, date)
      )
    `);

    // Exam Types table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_types (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        maxScore INT DEFAULT 100,
        weightage DECIMAL(5,2),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);

    // Exam Results table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id VARCHAR(36) PRIMARY KEY,
        studentId VARCHAR(36) NOT NULL,
        courseId VARCHAR(36) NOT NULL,
        examTypeId VARCHAR(36) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        totalScore INT DEFAULT 100,
        grade VARCHAR(10),
        remarks TEXT,
        examDate DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (examTypeId) REFERENCES exam_types(id),
        INDEX idx_studentId (studentId),
        INDEX idx_courseId (courseId),
        INDEX idx_examTypeId (examTypeId),
        INDEX idx_examDate (examDate)
      )
    `);

    // Grading System table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grading_systems (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sessionId VARCHAR(36),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE SET NULL,
        INDEX idx_name (name)
      )
    `);

    // Grade Mappings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grade_mappings (
        id VARCHAR(36) PRIMARY KEY,
        gradingSystemId VARCHAR(36) NOT NULL,
        letterGrade VARCHAR(10) NOT NULL,
        minScore DECIMAL(5,2) NOT NULL,
        maxScore DECIMAL(5,2) NOT NULL,
        gradePoint DECIMAL(3,2) NOT NULL,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (gradingSystemId) REFERENCES grading_systems(id) ON DELETE CASCADE,
        UNIQUE KEY unique_grade_mapping (gradingSystemId, letterGrade),
        INDEX idx_gradingSystemId (gradingSystemId)
      )
    `);

    // Transcripts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id VARCHAR(36) PRIMARY KEY,
        studentId VARCHAR(36) NOT NULL,
        sessionId VARCHAR(36),
        semesterId VARCHAR(36),
        gpa DECIMAL(3,2),
        cumulativeGpa DECIMAL(3,2),
        creditsEarned INT,
        totalCredits INT,
        academicStanding VARCHAR(50),
        generatedDate TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (sessionId) REFERENCES sessions(id),
        FOREIGN KEY (semesterId) REFERENCES semesters(id),
        INDEX idx_studentId (studentId)
      )
    `);

    // Library Books table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS library_books (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(150),
        isbn VARCHAR(20) UNIQUE,
        category VARCHAR(100),
        publisher VARCHAR(150),
        publishYear INT,
        quantity INT DEFAULT 1,
        availableQuantity INT DEFAULT 1,
        location VARCHAR(100),
        status ENUM('available', 'unavailable', 'damaged', 'lost') DEFAULT 'available',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_title (title),
        INDEX idx_author (author),
        INDEX idx_category (category)
      )
    `);

    // Library Borrowing table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS library_borrowing (
        id VARCHAR(36) PRIMARY KEY,
        memberId VARCHAR(36) NOT NULL,
        bookId VARCHAR(36) NOT NULL,
        borrowDate DATE NOT NULL,
        dueDate DATE NOT NULL,
        returnDate DATE,
        fineAmount DECIMAL(10,2) DEFAULT 0,
        status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
        remarks TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bookId) REFERENCES library_books(id),
        INDEX idx_memberId (memberId),
        INDEX idx_bookId (bookId),
        INDEX idx_borrowDate (borrowDate)
      )
    `);

    // Finance (Fees/Payments) table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS finance_fees (
        id VARCHAR(36) PRIMARY KEY,
        studentId VARCHAR(36) NOT NULL,
        feeType VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        dueDate DATE,
        paidDate DATE,
        status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_studentId (studentId),
        INDEX idx_status (status)
      )
    `);

    // HR table (Employee management)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        employeeId VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(100),
        position VARCHAR(100),
        joinDate DATE,
        salary DECIMAL(12,2),
        status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_employeeId (employeeId),
        INDEX idx_department (department)
      )
    `);

    // ZKTeco Attendance logs (raw device punches)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        \`timestamp\` DATETIME NOT NULL,
        device_id VARCHAR(100) NOT NULL,
        UNIQUE KEY uniq_attendance_log (user_id, \`timestamp\`, device_id),
        INDEX idx_attendance_user_ts (user_id, \`timestamp\`),
        INDEX idx_attendance_device_ts (device_id, \`timestamp\`),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notices table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notices (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        category VARCHAR(100),
        authorId VARCHAR(36) NOT NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        isPublished BOOLEAN DEFAULT false,
        publishedDate TIMESTAMP,
        expiryDate DATE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (authorId) REFERENCES users(id),
        INDEX idx_category (category),
        INDEX idx_isPublished (isPublished)
      )
    `);

    // Audit Logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36),
        action VARCHAR(50) NOT NULL,
        entityType VARCHAR(100) NOT NULL,
        entityId VARCHAR(36),
        oldValues JSON,
        newValues JSON,
        ipAddress VARCHAR(45),
        userAgent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_action (action),
        INDEX idx_entityType (entityType),
        INDEX idx_timestamp (timestamp)
      )
    `);

    console.log('✓ All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}
