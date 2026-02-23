@echo off
cls
echo ================================================
echo   Book Summarization Platform - FastAPI Backend
echo ================================================
echo.
echo Starting FastAPI server setup...
echo.

cd server

echo [1/2] Installing Python dependencies...
echo.
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please make sure Python and pip are installed
    pause
    exit /b 1
)

echo.
echo [2/2] Starting FastAPI server...
echo.
echo Server will start on: http://localhost:5000
echo API Documentation: http://localhost:5000/docs
echo.
echo Press Ctrl+C to stop the server
echo.
python main.py
