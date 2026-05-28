@echo off
color 0A
echo ==================================================
echo       Network Monitor - Installation Setup
echo ==================================================
echo.

:: Check if Node.js is installed
echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Once installed, run this installer again.
    echo.
    pause
    exit /b
)
echo Node.js is installed.
echo.

:: Install dependencies
echo [2/3] Installing required libraries...
call npm install
echo.

:: Build the production files
echo [3/3] Building the web application...
call npm run build
echo.

echo ==================================================
echo    Installation Complete! 
echo    You can now double-click 'start.bat' to run.
echo ==================================================
echo.
pause
