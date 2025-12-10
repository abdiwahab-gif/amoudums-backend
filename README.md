# Academic Management System - Backend

A robust Node.js/Express backend for managing academic institutions with MySQL database.

## Features

- **User Management**: Authentication, authorization, and user profiles
- **Student Management**: CRUD operations for students with detailed profiles
- **Teacher Management**: Teacher profiles and course assignments
- **Class Management**: Classes, sections, and enrollment
- **Course Management**: Courses with codes, credits, and assignments
- **Attendance Tracking**: Daily attendance for courses
- **Exam Management**: Exam types, results, and grade tracking
- **Grading System**: Flexible grade mappings and GPA calculation
- **Transcript Generation**: Academic transcripts with GPA
- **Library Management**: Book catalog, borrowing, and returns
- **Finance**: Fee management and payment tracking
- **HR Module**: Employee management
- **Notices**: Institutional announcements
- **Audit Logs**: Comprehensive activity logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Language**: TypeScript
- **Authentication**: JWT
- **Validation**: Express-validator

## Installation

### Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or pnpm

### Setup

1. **Clone and Install Dependencies**
   ```bash
   cd academic-backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=academic_db
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

3. **Create Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE academic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

4. **Run Server**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:5000`

## Database Schema

### Core Tables

- **users**: User accounts and authentication
- **students**: Student information and enrollment
- **teachers**: Teacher profiles and qualifications
- **classes**: Class definitions
- **sections**: Class sections
- **courses**: Academic courses
- **sessions**: Academic years/sessions
- **semesters**: Semester definitions

### Academic Tables

- **attendance**: Student attendance records
- **exam_types**: Types of exams
- **exam_results**: Student exam scores
- **grading_systems**: Grade scale definitions
- **grade_mappings**: Grade to GPA mappings
- **transcripts**: Student academic transcripts

### Support Tables

- **library_books**: Library catalog
- **library_borrowing**: Book borrowing records
- **finance_fees**: Student fees
- **hr_employees**: Employee records
- **notices**: Institutional notices
- **audit_logs**: Activity logs

## API Endpoints

### Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
GET    /api/auth/profile           - Get user profile
PUT    /api/auth/profile           - Update profile
```

### Students

```
GET    /api/students               - Get all students (paginated)
GET    /api/students/:id           - Get student by ID
POST   /api/students               - Create student
PUT    /api/students/:id           - Update student
DELETE /api/students/:id           - Delete student
```

### Teachers (To be implemented)

```
GET    /api/teachers               - Get all teachers
POST   /api/teachers               - Create teacher
GET    /api/teachers/:id           - Get teacher details
PUT    /api/teachers/:id           - Update teacher
DELETE /api/teachers/:id           - Delete teacher
```

### Classes (To be implemented)

```
GET    /api/classes                - Get all classes
POST   /api/classes                - Create class
GET    /api/classes/:id            - Get class details
PUT    /api/classes/:id            - Update class
```

### Courses (To be implemented)

```
GET    /api/courses                - Get all courses
POST   /api/courses                - Create course
GET    /api/courses/:id            - Get course details
PUT    /api/courses/:id            - Update course
```

### Attendance (To be implemented)

```
GET    /api/attendance             - Get attendance records
POST   /api/attendance             - Record attendance
GET    /api/attendance/:id         - Get attendance details
```

### Exam Results (To be implemented)

```
GET    /api/exam-results           - Get exam results
POST   /api/exam-results           - Create exam result
GET    /api/exam-results/:id       - Get result details
PUT    /api/exam-results/:id       - Update result
```

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens expire based on `JWT_EXPIRY` environment variable (default: 7 days).

## Project Structure

```
src/
├── config/              - Configuration files
├── controllers/         - Request handlers
├── database/            - Database connection and schema
├── middleware/          - Express middleware (auth, etc.)
├── models/              - Data models (to be expanded)
├── routes/              - API route definitions
├── services/            - Business logic services
├── types/               - TypeScript interfaces
├── utils/               - Utility functions
└── server.ts            - Main application file
```

## Development

### Commands

```bash
npm run dev              # Start development server with auto-reload
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server
npm run lint             # Run ESLint
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured for consistent code style
- Trailing commas and semicolons enforced

## Deliverables

### Phase 1: Core Setup ✓
- [x] Project structure with TypeScript
- [x] Express server with CORS and middleware
- [x] MySQL database connection
- [x] Database schema with all required tables
- [x] Authentication service (register, login, JWT)
- [x] User middleware and authorization
- [x] Type definitions

### Phase 2: Student Management ✓
- [x] Student CRUD operations
- [x] Student filtering and pagination
- [x] Student validation

### Phase 3: Additional Modules (To be implemented)
- [ ] Teacher management
- [ ] Class management
- [ ] Course management
- [ ] Attendance management
- [ ] Exam and grading systems
- [ ] Transcript generation
- [ ] Library management
- [ ] Finance management
- [ ] HR module
- [ ] Notice management

### Phase 4: Advanced Features
- [ ] File uploads (photos, documents)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Report generation
- [ ] Data export (CSV, PDF)
- [ ] API rate limiting
- [ ] Request validation schemas
- [ ] Unit and integration tests

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: OK - Successful GET, PUT
- `201`: Created - Successful POST
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing/invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

## Security Considerations

1. **Passwords**: Hashed with bcryptjs (10 rounds)
2. **Tokens**: JWT with configurable expiry
3. **Database**: Prepared statements to prevent SQL injection
4. **CORS**: Configured to allow only specified origins
5. **Validation**: Express-validator for input sanitization
6. **Soft Deletes**: Support for audit trail preservation

## Performance Optimizations

- Connection pooling for database
- Pagination for large datasets
- Indexed database columns for fast queries
- Compressed responses with gzip
- Request logging for debugging

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check `.env` database credentials
- Ensure `academic_db` database exists

### Port Already in Use
```bash
# Change PORT in .env or kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Module Not Found
```bash
npm install
npm run build
```

## Future Enhancements

1. **Caching**: Redis for frequently accessed data
2. **Message Queue**: For async operations
3. **GraphQL**: Alternative to REST API
4. **WebSockets**: Real-time notifications
5. **Microservices**: Separate services for modules
6. **Docker**: Containerization for deployment

## Contributing

Follow these guidelines:

1. Create feature branches from `main`
2. Write TypeScript with strict mode
3. Add validation for all inputs
4. Test before submitting PR
5. Document new endpoints
6. Update this README

## License

ISC

## Support

For issues, questions, or suggestions, please contact the development team.

---

**Last Updated**: December 2025
**Status**: Active Development
