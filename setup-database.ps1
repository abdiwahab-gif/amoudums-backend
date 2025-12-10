# MySQL Database Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "Academic Management System - Database Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "ERROR: MySQL not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MySQL from: https://dev.mysql.com/downloads/installer/" -ForegroundColor Yellow
    Write-Host "Or add MySQL bin directory to your PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common MySQL locations:" -ForegroundColor Cyan
    Write-Host "  - C:\Program Files\MySQL\MySQL Server 8.0\bin" -ForegroundColor White
    Write-Host "  - C:\xampp\mysql\bin" -ForegroundColor White
    Write-Host "  - C:\wamp64\bin\mysql\mysql8.x.x\bin" -ForegroundColor White
    exit 1
}

Write-Host "✓ MySQL found: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Prompt for MySQL credentials
Write-Host "Please enter your MySQL credentials:" -ForegroundColor Yellow
$mysqlUser = Read-Host "MySQL Username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$securePassword = Read-Host "MySQL Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$mysqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow

# Run the SQL setup script
$scriptPath = "setup-database.sql"
$fullPath = Join-Path (Get-Location) $scriptPath

if (-not (Test-Path $fullPath)) {
    Write-Host "ERROR: setup-database.sql not found!" -ForegroundColor Red
    Write-Host "Please ensure you're running this script from the academic-backend directory" -ForegroundColor Yellow
    exit 1
}

try {
    # Execute MySQL script
    $env:MYSQL_PWD = $mysqlPassword
    $output = & mysql -u $mysqlUser --default-character-set=utf8mb4 < $fullPath 2>&1
    $env:MYSQL_PWD = $null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Update .env file
        Write-Host "Updating .env file..." -ForegroundColor Yellow
        
        if (Test-Path ".env") {
            $envContent = Get-Content ".env" -Raw
            $envContent = $envContent -replace 'DB_USER=.*', "DB_USER=$mysqlUser"
            $envContent = $envContent -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$mysqlPassword"
            Set-Content ".env" $envContent
            
            Write-Host "✓ .env file updated with your credentials" -ForegroundColor Green
        } else {
            Write-Host "⚠ .env file not found, please create it manually" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Database Information:" -ForegroundColor Cyan
        Write-Host "  Database Name: academic_db" -ForegroundColor White
        Write-Host "  User: $mysqlUser" -ForegroundColor White
        Write-Host "  Tables Created: 20+" -ForegroundColor White
        Write-Host ""
        Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
        Write-Host "  Email: admin@academic.edu" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
        Write-Host "  ⚠ Change this password in production!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Run: npm install" -ForegroundColor White
        Write-Host "  2. Run: npm run dev" -ForegroundColor White
        Write-Host "  3. API will be available at: http://localhost:3001" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "ERROR: Database setup failed!" -ForegroundColor Red
        Write-Host "Output: $output" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Check if MySQL service is running" -ForegroundColor White
        Write-Host "  - Verify username and password are correct" -ForegroundColor White
        Write-Host "  - Ensure user has CREATE DATABASE privileges" -ForegroundColor White
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
