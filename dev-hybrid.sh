#!/bin/bash

# =============================================================================
# No More Jockeys - Hybrid Development (Frontend → Production Backend)
# =============================================================================
# Use Case: Run frontend locally connected to production backend
# Helicone: YES (production monitoring)

set -e

echo "🎯 No More Jockeys - Hybrid Development Mode"
echo "=============================================="
echo "Frontend: http://localhost:3000 → Backend: https://backend-pu7w8cumu-set4.vercel.app"
echo "Helicone: ENABLED (production backend requires monitoring)"
echo

# Check environment
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Set production backend URL
export NEXT_PUBLIC_API_URL=https://backend-pu7w8cumu-set4.vercel.app

echo "✅ Environment configured"
echo "   • API URL: $NEXT_PUBLIC_API_URL"
echo "   • Helicone: ${HELICONE_API_KEY:+ENABLED}${HELICONE_API_KEY:-DISABLED}"
echo

# Start frontend only
cd frontend && npm run dev
