# Backend Setup Instructions

## Prerequisites
- MySQL 8.0+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Step 1: Install MySQL (if not already installed)

### Windows
Download and install from: https://dev.mysql.com/downloads/installer/

### macOS
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

## Step 2: Create Database

### Option A: Using MySQL Command Line
```bash
# Login to MySQL
mysql -u root -p

# Run the setup script
source setup-database.sql

# Or copy-paste the SQL content
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your local MySQL instance
3. Open `setup-database.sql` file
4. Execute the script

### Option C: Using Command Line Directly
```bash
mysql -u root -p < setup-database.sql
```

## Step 3: Configure Environment Variables

1. The `.env` file has been created with default values
2. Update the following in `.env`:

```env
# Update your MySQL password
DB_PASSWORD=your_actual_mysql_password

# Update JWT secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

To generate a secure JWT secret:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any random string generator
```

## Step 4: Install Dependencies

```bash
cd academic-backend
npm install
```

## Step 5: Verify Database Connection

Test the connection:
```bash
npm run dev
```

You should see:
```
✓ Database connected successfully
Server running on port 3001
```

## Step 6: Test API Endpoints

### Create a test user (Register)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123",
    "name": "Test Teacher",
    "role": "teacher"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123"
  }'
```

### Create a student (use token from login)
```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "studentNumber": "2024001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@student.edu",
    "dateOfBirth": "2005-01-15",
    "gender": "male",
    "phone": "1234567890",
    "admissionDate": "2024-09-01"
  }'
```

## Step 7: Connect Frontend

1. Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

2. Start frontend:
```bash
cd ../academic-module
npm run dev
```

3. Open http://localhost:3000

## Default Credentials

**Admin User:**
- Email: `admin@academic.edu`
- Password: `admin123`

**Note:** Change this password immediately in production!

## Common Issues

### Issue: "Access denied for user"
**Solution:** Check your MySQL password in `.env` file

### Issue: "Database 'academic_db' doesn't exist"
**Solution:** Run the `setup-database.sql` script again

### Issue: "Port 3001 already in use"
**Solution:** Change PORT in `.env` to another port (e.g., 3002)

### Issue: "Cannot connect to database"
**Solution:** 
1. Verify MySQL is running: `mysql -u root -p`
2. Check DB_HOST, DB_PORT in `.env`
3. Verify user has permissions

## Verification Checklist

- [ ] MySQL installed and running
- [ ] Database `academic_db` created
- [ ] All tables created (20 tables)
- [ ] `.env` file configured with correct credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Backend starts successfully (`npm run dev`)
- [ ] Can register new users
- [ ] Can login and get JWT token
- [ ] Frontend connects to backend

## Next Steps

Once backend is running:

1. **Test all endpoints** using the API documentation
2. **Create sample data** (students, teachers, courses)
3. **Connect frontend** pages to backend
4. **Configure authentication** in frontend
5. **Deploy** following DEPLOYMENT.md guide

## Database Schema

The setup creates 20 tables:
- users
- students
- teachers
- sessions
- semesters
- classes
- sections
- courses
- class_courses
- student_enrollments
- attendance
- exam_types
- grading_systems
- grade_mappings
- exam_results
- transcripts
- library_books
- library_borrowing
- finance_fees
- hr_employees
- notices
- audit_logs

## Support

If you encounter issues:
1. Check the logs: `npm run dev` (watch for errors)
2. Verify MySQL is running: `systemctl status mysql` (Linux) or Task Manager (Windows)
3. Test database connection: `mysql -u root -p academic_db`
4. Check all environment variables in `.env`

## Security Notes

⚠️ **Important for Production:**

1. Change default admin password
2. Use strong JWT secret (32+ characters)
3. Enable HTTPS
4. Set up firewall rules
5. Use environment-specific `.env` files
6. Never commit `.env` to version control
7. Use prepared statements (already implemented)
8. Enable MySQL SSL connections
9. Regular database backups
10. Monitor audit logs

---

**Status**: Ready to run `npm run dev` 🚀
