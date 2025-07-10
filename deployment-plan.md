# Deployment Plan for No More Jockeys (Commit f97e07a)

## Current State Analysis
- **Clean codebase** at commit f97e07a with working game functionality
- **No Helicone integration** - uses standard Anthropic API only
- **Simple Vercel configs** - basic setup without environment variable references
- **Frontend**: Next.js with dark mode, game interface, API calls to backend
- **Backend**: FastAPI with game logic, AI agents, move validation

## Step-by-Step Deployment

### 1. Push Current State
```bash
git push origin main
```

### 2. Deploy Backend First
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Import Git Repository** (if not already imported)
3. **Create New Project** for backend:
   - **Root Directory**: `backend`
   - **Framework**: Other (auto-detected as Python)
4. **Add Environment Variable**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key (starts with `sk-ant-api03-`)
   - Environment: All (Production, Preview, Development)
5. **Deploy** and copy the production URL (e.g., `https://your-backend.vercel.app`)

### 3. Deploy Frontend Second
1. **Create Another New Project** for frontend:
   - **Root Directory**: `frontend` 
   - **Framework**: Next.js (auto-detected)
2. **Add Environment Variable**:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: Your backend URL from step 2
   - Environment: All (Production, Preview, Development)
3. **Deploy**

### 4. Test Deployment
1. Open frontend URL
2. Click "🤖 Watch AI Battle" button
3. Verify game creates and AI agents make moves
4. Test "🎮 Join the Battle" mode if desired

## Key Points
- **No additional configuration needed** - this version has clean, working Vercel configs
- **Only requires ANTHROPIC_API_KEY** - no Helicone setup needed
- **Frontend connects to backend** via NEXT_PUBLIC_API_URL environment variable
- **URLs are permanent** - once deployed, they don't change

## Expected URLs
- Backend: `https://nmj-backend-[random].vercel.app`
- Frontend: `https://nmj-frontend-[random].vercel.app`

## Troubleshooting
- If backend fails: Check ANTHROPIC_API_KEY is set correctly
- If frontend can't connect: Verify NEXT_PUBLIC_API_URL points to backend
- If game doesn't start: Check browser console for API errors