@echo off
REM Mobile App Startup Script for Elevated Movements
REM This script keeps the Expo server running

cd /d "%~dp0"

echo Starting Elevated Movements Mobile App...
echo.
echo ========================================
echo Expo Development Server
echo ========================================
echo.

REM Clean cache and start
call npm start -- --clear

pause
