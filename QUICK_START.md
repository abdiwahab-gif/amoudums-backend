# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Step 1: Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE academic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'academic_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON academic_db.* TO 'academic_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Configure Application

```bash
# Navigate to backend directory
cd academic-backend

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# Update: DB_USER, DB_PASSWORD, DB_NAME
```

Example `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=academic_user
DB_PASSWORD=your_password
DB_NAME=academic_db
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Server runs on: **http://localhost:5000**

---

## 📝 Test the API

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the token** from response.

### 3. Get Profile

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get Students (Paginated)

```bash
curl -X GET "http://localhost:5000/api/students?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Common Commands

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment configuration |
| `src/server.ts` | Main application entry point |
| `src/routes/auth.routes.ts` | Authentication endpoints |
| `src/routes/student.routes.ts` | Student management endpoints |
| `src/database/schema.ts` | Database table creation |

---

## 🔐 Default Roles

After registration, you can use these roles:
- `admin` - Full system access
- `teacher` - Can manage students and courses
- `student` - Can view own records
- `parent` - Can view child's records
- `staff` - Administrative staff

---

## 🛠️ Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify credentials in .env
# Check database exists: SHOW DATABASES;
```

### Port Already in Use
```bash
# Change PORT in .env or kill process
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

### Dependencies Issue
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 Full Documentation

- **API Endpoints**: See `API_DOCUMENTATION.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Project Details**: See `README.md`
- **Deliverables**: See `DELIVERABLES.md`

---

## 🌐 Connect Frontend

In your frontend `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

In API calls:
```typescript
const response = await fetch(`${process.env.REACT_APP_API_URL}/students`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (node --version)
- [ ] MySQL running (mysql -u root -p)
- [ ] Database created
- [ ] `.env` configured
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] `http://localhost:5000/health` returns 200
- [ ] Can register user
- [ ] Can login and get token
- [ ] Can fetch students with token

---

## 🎯 Next Steps

1. **Understand the API**: Read `API_DOCUMENTATION.md`
2. **Check Deliverables**: Review `DELIVERABLES.md`
3. **Setup Frontend Integration**: Connect your React app
4. **Expand Features**: Add more modules (Teachers, Courses, etc.)
5. **Deploy to Production**: Follow `DEPLOYMENT.md`

---

## 💡 Tips

- Always use `Authorization: Bearer <token>` for protected routes
- Default pagination is 10 items per page
- Passwords must be at least 6 characters
- Email must be unique across all users
- Keep `.env` secure - don't commit to git

---

## 📞 Support

If you encounter issues:
1. Check error message in console
2. Review API_DOCUMENTATION.md
3. Check .env configuration
4. Verify database connection
5. Check MySQL error logs

---

**Happy coding! 🚀**

Last Updated: December 9, 2025
