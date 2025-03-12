@echo off
echo Running database fix script for Budget Flow Application...

REM Check if MySQL is installed
where mysql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo MySQL is not installed or not in the PATH. Please install MySQL and try again.
    exit /b 1
)

REM Run the SQL script
echo Executing SQL script...
mysql -u root -p123456 < data/db_fix.sql

if %ERRORLEVEL% neq 0 (
    echo Failed to execute SQL script. Please check your MySQL credentials and try again.
    exit /b 1
)

echo Database fix completed successfully!
echo.
echo Now restart your Spring Boot application to apply the changes.
pause 