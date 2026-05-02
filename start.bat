@echo off
echo ========================================
echo   PCHIS - Health Intelligence System
echo ========================================
echo.
echo Starting MongoDB service...
net start MongoDB 2>nul || echo (MongoDB may already be running)
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (port 5000)...
start "PCHIS Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Dev Server (port 5173)...
start "PCHIS Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   App running at: http://localhost:5173
echo ========================================
echo.
start http://localhost:5173
pause
