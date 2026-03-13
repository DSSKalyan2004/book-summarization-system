@echo off
setlocal
title Book Summarization Platform
echo ============================================
echo  Intelligent Book Summarization Platform
echo ============================================
echo.
echo Starting backend...
echo.

start "Backend - Port 8000" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend health endpoint...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline = (Get-Date).AddSeconds(30);" ^
  "do {" ^
  "  try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch {}" ^
  "  Start-Sleep -Milliseconds 200;" ^
  "} while ((Get-Date) -lt $deadline);" ^
  "exit 0"

echo Starting frontend...
cd /d "%~dp0frontend"
call npm run dev:frontend
