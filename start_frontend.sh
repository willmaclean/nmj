#!/bin/bash

# No More Jockeys Frontend Startup Script

echo "🎮 Starting No More Jockeys Frontend..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting Next.js development server on http://localhost:3000"
npm run dev
