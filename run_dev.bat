@echo off
echo ========================================================
echo Starting MandiMitra AI Development Environment...
echo ========================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "MandiMitra AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Vite Frontend on http://localhost:5173 ...
start "MandiMitra AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
