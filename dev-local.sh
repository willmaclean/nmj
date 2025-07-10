#!/bin/bash

# =============================================================================
# No More Jockeys - Local Development (Frontend → Local Backend)
# =============================================================================
# Use Case: Run frontend locally connected to local backend
# Helicone: NO (direct Anthropic API)

set -e

echo "🎯 No More Jockeys - Local Development Mode"
echo "============================================="
echo "Frontend: http://localhost:3000 → Backend: http://localhost:8000"
echo "Helicone: DISABLED (direct Anthropic API for development)"
echo

# Check environment
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

if [ -z "$(grep ANTHROPIC_API_KEY .env | cut -d= -f2)" ]; then
    echo "❌ ANTHROPIC_API_KEY not set in .env file"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Unset Helicone to ensure direct API usage
unset HELICONE_API_KEY

# Ensure we're using local API URL
export NEXT_PUBLIC_API_URL=http://localhost:8000

echo "✅ Environment configured"
echo "   • API URL: $NEXT_PUBLIC_API_URL"
echo "   • Helicone: DISABLED"
echo

# Start both services
npm run dev
