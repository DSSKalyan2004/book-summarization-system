#!/bin/bash

clear
echo "================================================"
echo "  Book Summarization Platform - FastAPI Backend"
echo "================================================"
echo ""
echo "Starting FastAPI server setup..."
echo ""

cd backend

echo "[1/2] Installing Python dependencies..."
echo ""
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies"
    echo "Please make sure Python and pip are installed"
    exit 1
fi

echo ""
echo "[2/2] Starting FastAPI server..."
echo ""
echo "Server will start on: http://localhost:5000"
echo "API Documentation: http://localhost:5000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python main.py
