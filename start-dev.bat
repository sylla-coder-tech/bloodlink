@echo off
REM BloodLink Frontend - Start Development Server
REM Make sure you've run install-and-run.bat first!

echo.
echo Starting BloodLink Frontend Development Server...
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] Dependencies not installed!
    echo Please run install-and-run.bat first
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
)

echo.
echo [INFO] Starting Vite development server...
echo [INFO] The app will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
