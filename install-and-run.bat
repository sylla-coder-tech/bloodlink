@echo off
REM BloodLink Frontend - Installation & Setup
REM Double-click this file to install dependencies and start development

echo.
echo ========================================
echo    BloodLink Frontend Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version
echo.

REM Install dependencies
echo [INSTALLING] Dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Copy .env.example to .env:
echo    copy .env.example .env
echo.
echo 2. Start development server:
echo    npm run dev
echo.
echo 3. Open your browser to: http://localhost:3000
echo.
echo ========================================
echo.

pause
