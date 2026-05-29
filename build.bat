@echo off
REM BloodLink Frontend - Build for Production

echo.
echo ========================================
echo    Building for Production
echo ========================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] Dependencies not installed!
    echo Please run install-and-run.bat first
    pause
    exit /b 1
)

echo [INFO] Building the project...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Complete!
echo ========================================
echo.
echo The built files are in the 'dist' folder
echo Ready for deployment!
echo.

pause
