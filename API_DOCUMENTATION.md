# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Response Format

All endpoints return JSON responses with the following structure:

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
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Retrieved successfully",
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

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Valid Roles:** `admin`, `teacher`, `student`, `parent`, `staff`

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "status": "active",
    "createdAt": "2025-12-09T14:00:00Z"
  }
}
```

---

### Login User
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Status Codes:**
- `200`: Login successful
- `401`: Invalid email or password

---

### Get User Profile
**GET** `/auth/profile`

Retrieve current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "status": "active",
    "phone": "+880123456789",
    "photo": "/path/to/photo.jpg",
    "createdAt": "2025-12-09T14:00:00Z",
    "updatedAt": "2025-12-09T14:00:00Z"
  }
}
```

---

### Update User Profile
**PUT** `/auth/profile`

Update current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+880987654321",
  "photo": "/path/to/new-photo.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+880987654321",
    "photo": "/path/to/new-photo.jpg",
    "updatedAt": "2025-12-09T15:00:00Z"
  }
}
```

---

## Student Endpoints

### Get All Students
**GET** `/students`

Retrieve paginated list of students (requires authentication).

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `classId` (string, optional) - Filter by class
- `sectionId` (string, optional) - Filter by section
- `search` (string, optional) - Search by name or student ID

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Request:**
```
GET /students?page=1&limit=10&search=john
```

**Response:**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "studentId": "STU001",
      "classId": "uuid",
      "sectionId": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+880123456789",
      "bloodType": "O+",
      "nationality": "Somali",
      "religion": "Islam",
      "address": "123 Main St",
      "city": "Mogadishu",
      "zip": "12345",
      "fatherName": "Ahmed Doe",
      "motherName": "Fatima Doe",
      "fatherPhone": "+880111111111",
      "motherPhone": "+880222222222",
      "emergencyContact": "+880333333333",
      "enrollmentDate": "2024-01-15",
      "createdAt": "2025-12-09T14:00:00Z",
      "updatedAt": "2025-12-09T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### Get Student by ID
**GET** `/students/:id`

Retrieve detailed information about a specific student.

**URL Parameters:**
- `id` (string) - Student ID

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Request:**
```
GET /students/uuid-123
```

**Response:**
```json
{
  "success": true,
  "message": "Student retrieved successfully",
  "data": {
    "id": "uuid-123",
    "userId": "uuid",
    "studentId": "STU001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "enrollmentDate": "2024-01-15",
    "createdAt": "2025-12-09T14:00:00Z",
    "updatedAt": "2025-12-09T14:00:00Z"
  }
}
```

**Status Codes:**
- `200`: Student found
- `404`: Student not found

---

### Create Student
**POST** `/students`

Create a new student record (requires admin or teacher role).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "userId": "uuid",
  "studentId": "STU002",
  "classId": "uuid",
  "sectionId": "uuid",
  "bloodType": "A+",
  "nationality": "Somali",
  "religion": "Islam",
  "address": "456 Oak Ave",
  "city": "Hargeisa",
  "zip": "54321",
  "fatherName": "Mohamed Smith",
  "motherName": "Aisha Smith",
  "fatherPhone": "+880444444444",
  "motherPhone": "+880555555555",
  "emergencyContact": "+880666666666",
  "enrollmentDate": "2024-01-20"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "id": "uuid-456",
    "userId": "uuid",
    "studentId": "STU002",
    "classId": "uuid",
    "createdAt": "2025-12-09T15:00:00Z"
  }
}
```

**Status Codes:**
- `201`: Student created
- `400`: Validation error
- `403`: Insufficient permissions

---

### Update Student
**PUT** `/students/:id`

Update student information.

**URL Parameters:**
- `id` (string) - Student ID

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "classId": "new-class-uuid",
  "sectionId": "new-section-uuid",
  "bloodType": "B+",
  "address": "789 Pine St"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "id": "uuid-456",
    "classId": "new-class-uuid",
    "sectionId": "new-section-uuid",
    "bloodType": "B+",
    "address": "789 Pine St",
    "updatedAt": "2025-12-09T16:00:00Z"
  }
}
```

---

### Delete Student
**DELETE** `/students/:id`

Delete a student record (requires admin role).

**URL Parameters:**
- `id` (string) - Student ID

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

**Status Codes:**
- `200`: Student deleted
- `404`: Student not found
- `403`: Insufficient permissions

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Insufficient permissions for the operation |
| 404 | Not Found - Requested resource does not exist |
| 500 | Internal Server Error - Server-side error |

---

## Rate Limiting

Currently no rate limiting is enforced. This will be added in production.

---

## Pagination

Use `page` and `limit` query parameters for pagination:

```
GET /students?page=2&limit=20
```

- Default limit: 10
- Maximum limit: 100
- Pages are 1-indexed

---

## Filtering

Query parameters for filtering:

- `search`: Search by name or ID (case-insensitive)
- `classId`: Filter by class
- `sectionId`: Filter by section

Example:
```
GET /students?search=john&classId=uuid&page=1&limit=10
```

---

## Sorting

Sorting not yet implemented. Will be added with:
- `sortBy`: Field to sort by
- `order`: asc or desc

---

## Additional Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs (version 4)
3. Passwords are never returned in responses
4. Soft deletes are supported (deleted records retain audit data)
5. All datetime fields include milliseconds

---

## Coming Soon

These endpoints are planned for future releases:

- `/api/teachers` - Teacher management
- `/api/classes` - Class management
- `/api/courses` - Course management
- `/api/attendance` - Attendance tracking
- `/api/exam-results` - Exam results
- `/api/grades` - Grading and GPA
- `/api/transcripts` - Student transcripts
- `/api/library` - Library management
- `/api/finance` - Fee and payment management
- `/api/notices` - Notice management

---

**Last Updated**: December 9, 2025
