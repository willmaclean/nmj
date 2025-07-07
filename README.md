# No More Jockeys: Multi-LLM Game Implementation

A complete implementation of the "No More Jockeys" game where 4 Claude AI agents compete against each other in real-time.

## Game Rules

1. Players take turns naming a real person and declaring a category they belong to
2. That category becomes banned for all future turns
3. Players cannot name someone who belongs to any banned category
4. Categories must be objective and verifiable
5. Players are eliminated if they name someone from a banned category

## Architecture

- **Backend**: Python FastAPI with LangChain for LLM orchestration
- **Frontend**: React with Next.js
- **LLM**: Anthropic Claude (Haiku for cost efficiency)
- **Deployment**: Vercel serverless functions

## Project Structure

```
no-more-jockeys/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── agents.py        # LLM agents and game orchestrator
│   │   ├── game_state.py    # Game state management
│   │   └── prompts.py       # LLM prompts
│   ├── requirements.txt
│   └── vercel.json
├── frontend/
│   ├── pages/
│   │   └── index.js         # Main game page
│   ├── components/
│   │   └── GameBoard.js     # Game display component
│   ├── package.json
│   └── next.config.js
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Anthropic API key

### Single Command Setup

1. **Set your API key:**
   ```bash
   export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
   # On Windows (Command Prompt), use:
   # set ANTHROPIC_API_KEY="your-anthropic-api-key-here"
   ```

2. **Install and start everything:**
   ```bash
   npm install
   npm run dev
   ```

This will automatically:
- Set up Python virtual environment (if needed)
- Install all backend/frontend dependencies (if needed)
- Start both servers concurrently
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

Press `Ctrl+C` to stop both servers.

**Note for Windows users:** If you encounter issues with the `npm run dev` command, you may need to run the backend and frontend separately:
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### Alternative Commands

```bash
# Start individual services
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only

# Setup commands
npm run install        # Install all dependencies
npm run clean          # Clean all build artifacts
```

## Deployment to Vercel

### Backend Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy backend:
```bash
cd backend
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `ANTHROPIC_API_KEY` environment variable

### Frontend Deployment

1. Update API URL in `frontend/pages/index.js`:
```javascript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.vercel.app'  // Replace with your backend URL
  : 'http://localhost:8000';
```

2. Deploy frontend:
```bash
cd frontend
vercel --prod
```

## Game Features

- **Turn Management**: Sequential turns with automatic advancement
- **Validation**: Comprehensive category checking with explanations
- **Auto-play**: Watch LLMs play automatically with 2-second intervals
- **Error Handling**: Graceful handling of API failures
- **Game State**: Complete history and banned category tracking
- **Visual Feedback**: Clear UI showing game progression and eliminations

## Cost Optimization

- Uses Claude Haiku model (~$0.25 per 1M tokens)
- Average game: ~50 turns × 2 API calls × 500 tokens = 50K tokens ≈ $0.0125
- Efficient prompting to minimize token usage
- Caching opportunities for person information

## API Endpoints

- `POST /api/game/create` - Create new game instance
- `POST /api/game/turn` - Execute one turn
- `GET /api/game/{game_id}/state` - Get current game state

## Game Strategy

The AI agents employ various strategies:
- **Early game**: Use narrow categories to maintain flexibility
- **Mid game**: Target opponents by banning categories they might rely on
- **Late game**: Carefully remember all banned categories
- **Safe picks**: Historical figures with limited category memberships
- **Risky picks**: Modern celebrities who belong to many categories

## Development Notes

- Game state is stored in memory (use Redis for production scaling)
- LLM responses are parsed as JSON with fallback handling
- Comprehensive validation prevents invalid moves
- Auto-play feature enables autonomous gameplay demonstration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - see LICENSE file for details
