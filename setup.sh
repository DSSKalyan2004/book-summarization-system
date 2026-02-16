#!/bin/bash

echo "===================================="
echo " Book Summarization Platform Setup"
echo "===================================="
echo ""

echo "[1/3] Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Frontend installation failed"
    exit 1
fi

echo ""
echo "[2/3] Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error: Backend installation failed"
    exit 1
fi
cd ..

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "===================================="
echo " Next Steps:"
echo "===================================="
echo "1. Make sure MongoDB is installed and running"
echo "2. Update .env files with your configuration"
echo "3. Start the backend: cd server && npm run dev"
echo "4. Start the frontend: npm run dev"
echo ""
echo "For MongoDB Atlas, update MONGODB_URI in server/.env"
echo ""
