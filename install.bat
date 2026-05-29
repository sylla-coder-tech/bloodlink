@echo off
REM Installation BloodLink Frontend
echo Installing BloodLink Frontend dependencies...
cd /d "%cd%"
call npm install
echo.
echo Installation complete!
echo.
echo To start the development server, run:
echo npm run dev
pause
