#!/bin/bash

# No More Jockeys Backend Startup Script

echo "🎯 Starting No More Jockeys Backend..."

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY environment variable is not set"
    echo "Please set it with: export ANTHROPIC_API_KEY='your-key-here'"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📊 API docs available at http://localhost:8000/docs"
uvicorn api.main:app --reload --port 8000
