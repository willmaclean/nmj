# No More Jockeys

Multi-LLM No More Jockeys game with FastAPI backend and Next.js frontend.

## Quick Start

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
./dev-local.sh
```

## Development Modes

```bash
./dev-local.sh      # Frontend + Backend locally
./dev-hybrid.sh     # Frontend local → Production backend  
./dev-backend.sh    # Backend only
```

## Environment

Edit `.env`:
```bash
ANTHROPIC_API_KEY=your_api_key_here
HELICONE_API_KEY=optional_dev_key  # Required in production
# NEXT_PUBLIC_API_URL=optional_override
```

## Deployment

Set in Vercel dashboard:
- **Backend**: `ANTHROPIC_API_KEY`, `HELICONE_API_KEY` (required in production)
- **Frontend**: `NEXT_PUBLIC_API_URL`

## Game Rules

Players take turns naming a person and declaring a category they belong to. That category becomes banned. Don't name anyone from banned categories or you're eliminated.