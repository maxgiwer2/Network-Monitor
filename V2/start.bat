@echo off
color 0B
echo ==================================================
echo       Starting Network Monitor System...
echo ==================================================
echo.
echo Please wait while the server starts...
echo Do not close this window while using the system.
echo.

:: Wait for a second, then open browser
timeout /t 2 /nobreak >nul
start "" "http://localhost:5000"

:: Start the server
node server.js

pause
