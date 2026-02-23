#!/bin/bash

echo "========================================"
echo "FastAPI Backend Setup"
echo "========================================"
echo ""

echo "[1/3] Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

echo "[2/3] Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file - Please update with your configuration"
else
    echo ".env file already exists"
fi
echo ""

echo "[3/3] Creating uploads directory..."
mkdir -p uploads
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To start the server:"
echo "  python main.py"
echo ""
echo "API Documentation will be available at:"
echo "  http://localhost:5000/docs"
echo ""
