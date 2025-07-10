# No More Jockeys

Multi-LLM No More Jockeys game implementation with separate backend and frontend deployments.

## Architecture

- **Backend**: FastAPI Python application (`/backend`)
- **Frontend**: Next.js React application (`/frontend`)

## Quick Start

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
./dev-local.sh
```

## Development

### Development Modes

```bash
./dev-local.sh      # Frontend + Backend locally
./dev-hybrid.sh     # Frontend local → Production backend  
./dev-backend.sh    # Backend only
```

### Alternative Development Commands

```bash
# Install dependencies and start both services
npm run dev

# Or start individually:
npm run dev:backend  # Starts on http://localhost:8000
npm run dev:frontend # Starts on http://localhost:3000
```

### Environment

Edit `.env`:
```bash
ANTHROPIC_API_KEY=your_api_key_here
HELICONE_API_KEY=your_helicone_key_here  # Required in production
# NEXT_PUBLIC_API_URL=optional_override
```

## Deployment

This project uses GitHub Actions to automatically deploy to Vercel when changes are pushed to the main branch.

### Setup GitHub Actions Deployment

1. **Create Vercel Projects**:
   - Create separate Vercel projects for backend and frontend
   - Note the project IDs from each project's settings

2. **Get Vercel Credentials**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and get your tokens
   vercel login
   vercel --scope your-team-name
   ```

3. **Add GitHub Secrets**:
   Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:
   - `VERCEL_TOKEN`: Your Vercel token
   - `VERCEL_ORG_ID`: Your Vercel organization/team ID  
   - `VERCEL_BACKEND_PROJECT_ID`: Backend project ID from Vercel
   - `VERCEL_FRONTEND_PROJECT_ID`: Frontend project ID from Vercel

4. **Manual Deployment** (if needed):
   ```bash
   # Deploy backend
   cd backend && vercel --prod
   
   # Deploy frontend  
   cd frontend && vercel --prod
   ```

### Environment Variables

For production deployments, set these in your Vercel project settings:

**Backend**:
- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `HELICONE_API_KEY`: Your Helicone API key (required in production for monitoring)

**Frontend**:
- `NEXT_PUBLIC_API_URL`: Your backend Vercel URL

## Game Rules

No More Jockeys is a game where players take turns naming a person and a category that person belongs to. That category becomes banned. Don't name anyone from banned categories or you're eliminated.

## Tech Stack

- **Backend**: FastAPI, Python, Anthropic Claude API
- **Frontend**: Next.js, React
- **Deployment**: Vercel with GitHub Actions
- **Development**: Concurrent local development setup