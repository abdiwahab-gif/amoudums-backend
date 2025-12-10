# 🚀 Quick Start Guide

## Current Status
- ✅ Frontend: Running on http://localhost:3002
- ✅ Backend: Files created, needs database setup
- ✅ MySQL: Installed at C:\Program Files\MySQL\MySQL Server 9.5\bin\mysql.exe

---

## Step 1: Set Up Database (5 minutes)

### Option A: Automatic Setup (Recommended)
```powershell
cd "d:\Downloads 2025 Oct\academic-backend"
.\setup-database.ps1
```
This will:
- Prompt for your MySQL password
- Create database and all tables
- Update .env with credentials
- Ready to run!

### Option B: Manual Setup
1. **Update .env file** with your MySQL password:
   ```
   Edit: d:\Downloads 2025 Oct\academic-backend\.env
   Change: DB_PASSWORD=your_password_here
   ```

2. **Run SQL setup**:
   ```powershell
   mysql -u root -p < "d:\Downloads 2025 Oct\academic-backend\setup-database.sql"
   ```
   Enter your MySQL password when prompted.

---

## Step 2: Start Backend Server

```powershell
cd "d:\Downloads 2025 Oct\academic-backend"
npm run dev
```

You should see:
```
✓ Database connected successfully
Server running on port 3001
```

---

## Step 3: Test the Connection

### Test API endpoint:
```powershell
curl http://localhost:3001/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@academic.edu","password":"admin123"}'
```

### Or open in browser:
```
http://localhost:3001/api/students
```

---

## Step 4: Connect Frontend to Backend

The frontend is already configured!
- Frontend: http://localhost:3002
- Backend API: http://localhost:3001
- Environment: .env.local already set with NEXT_PUBLIC_API_URL

---

## What's Already Done ✅

1. ✅ Backend code complete (23 files)
2. ✅ Database schema ready (20 tables)
3. ✅ Frontend build successful (58 routes)
4. ✅ Environment files created
5. ✅ API documentation available
6. ✅ Default admin user configured

---

## Default Credentials

**Admin Login:**
- Email: `admin@academic.edu`
- Password: `admin123`

⚠️ **Change this in production!**

---

## Troubleshooting

### Issue: "Access denied for user 'root'"
**Fix:** Update DB_PASSWORD in `.env` file

### Issue: "Database 'academic_db' doesn't exist"
**Fix:** Run `setup-database.ps1` or `setup-database.sql`

### Issue: "Port already in use"
**Fix:** 
- Backend: Change PORT in `.env`
- Frontend: It auto-selected port 3002

### Issue: "Cannot find module"
**Fix:** Run `npm install` in backend directory

---

## Quick Commands Reference

### Backend
```powershell
cd "d:\Downloads 2025 Oct\academic-backend"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend
```powershell
cd "d:\Downloads 2025 Oct\academic-module"

# Start development server (already running)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database
```powershell
# Access MySQL
mysql -u root -p

# Use academic database
USE academic_db;

# Show all tables
SHOW TABLES;

# Check users
SELECT * FROM users;
```

---

## Next Steps After Setup

1. **Login** to http://localhost:3002
   - Use admin credentials above

2. **Create Test Data**
   - Add students, teachers, courses
   - Test CRUD operations

3. **Explore API**
   - Check API_DOCUMENTATION.md in backend folder
   - Test endpoints with curl or Postman

4. **Customize**
   - Update branding
   - Add custom features
   - Configure modules

5. **Deploy**
   - Follow DEPLOYMENT.md guide
   - Set up production database
   - Configure cloud hosting

---

## File Locations

### Backend
```
d:\Downloads 2025 Oct\academic-backend\
├── .env (configure this!)
├── setup-database.sql
├── setup-database.ps1
├── SETUP_INSTRUCTIONS.md
├── package.json
└── src\
    ├── server.ts
    ├── config\
    ├── controllers\
    ├── routes\
    ├── services\
    └── database\
```

### Frontend
```
d:\Downloads 2025 Oct\academic-module\
├── .env.local (already configured!)
├── app\
├── components\
└── package.json
```

---

## Support

Need help?
1. Check SETUP_INSTRUCTIONS.md (detailed guide)
2. Check API_DOCUMENTATION.md (API reference)
3. Check DEPLOYMENT.md (production deployment)
4. Review error messages in terminal

---

**Status**: Ready to start! Just run the setup script and you're good to go! 🎉
