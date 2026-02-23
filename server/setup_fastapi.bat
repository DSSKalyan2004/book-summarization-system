@echo off
echo ========================================
echo FastAPI Backend Setup
echo ========================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/3] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo Created .env file - Please update with your configuration
) else (
    echo .env file already exists
)
echo.

echo [3/3] Creating uploads directory...
if not exist uploads mkdir uploads
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the server:
echo   python main.py
echo.
echo API Documentation will be available at:
echo   http://localhost:5000/docs
echo.
pause
