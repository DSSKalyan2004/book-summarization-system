@echo off
cls
echo ================================================
echo   Book Summarization Platform - FastAPI Backend
echo ================================================
echo.

cd /d "%~dp0backend"

REM ── Kill any process already on port 8000 ──────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    echo Stopping existing process on port 8000 (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM ── Pick Python: prefer the project venv, fall back to PATH ────
set VENV_PYTHON="%~dp0.venv\Scripts\python.exe"
if exist %VENV_PYTHON% (
    set PYTHON=%VENV_PYTHON%
    echo Using project virtual environment...
) else (
    set PYTHON=python
    echo Using system Python...
)

echo.
echo [1/2] Installing / updating dependencies...
%PYTHON% -m pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/2] Starting FastAPI server...
echo.
echo   URL:  http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

%PYTHON% -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
