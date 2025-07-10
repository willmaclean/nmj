#!/bin/bash

# =============================================================================
# No More Jockeys - Backend Only Development
# =============================================================================
# Use Case: Run backend locally for API testing/development
# Helicone: NO (direct Anthropic API)

set -e

echo "🎯 No More Jockeys - Backend Only Mode"
echo "======================================="
echo "Backend: http://localhost:8000"
echo "Helicone: DISABLED (direct Anthropic API for development)"
echo "API Docs: http://localhost:8000/docs"
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

echo "✅ Environment configured"
echo "   • Helicone: DISABLED"
echo

# Start backend only
npm run dev:backend
