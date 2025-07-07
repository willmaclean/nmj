#!/bin/bash

# No More Jockeys - Unified Startup Script
# Starts both backend and frontend simultaneously

set -e

echo "🎯 No More Jockeys - Starting Full Stack Application"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set it with: export ANTHROPIC_API_KEY='your-key-here'"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Backend Setup
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📥 Installing backend dependencies..."
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Start backend in background
echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn api.main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!

cd ..

# Frontend Setup
echo "🔧 Setting up frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

# Start frontend in background
echo "🚀 Starting Next.js frontend on http://localhost:3000"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 3

# Check if services are running
if kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; then
    echo ""
    echo "✅ All services started successfully!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 API Docs: http://localhost:8000/docs"
    echo ""
    echo "📝 Logs:"
    echo "   Backend: tail -f backend.log"
    echo "   Frontend: tail -f frontend.log"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Wait for user interrupt
    wait
else
    echo "❌ Failed to start services. Check logs:"
    echo "Backend log:"
    cat backend.log 2>/dev/null || echo "No backend log found"
    echo "Frontend log:"
    cat frontend.log 2>/dev/null || echo "No frontend log found"
    cleanup
fi
