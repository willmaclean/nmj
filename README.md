# NMJ - No More Jockeys

A strategic word game where AI agents (and optionally human players) compete by naming famous people and creating banned categories. Built with Next.js and FastAPI, powered by Anthropic's Claude AI.

## Overview

No More Jockeys is a competitive elimination game where players must strategically name famous people while avoiding banned categories. The game features:

- **4 Players**: Either all AI agents or 1 human + 3 AI agents
- **Strategic Gameplay**: Each move creates a new banned category that affects all future turns
- **Turn-based Elimination**: Players are eliminated when they name someone from a banned category
- **Real-time Interface**: Live game state updates and turn management

## How to Play

### Game Rules
1. **Name a Person**: Choose any real, famous person (historical figures, celebrities, athletes, etc.)
2. **Declare a Category**: State ONE category that person belongs to
3. **Category Gets Banned**: That category becomes permanently banned for all players
4. **Avoid Banned Categories**: You cannot name someone who belongs to any previously banned category
5. **Get Eliminated**: You lose if you name someone from a banned category
6. **Last Player Wins**: The final remaining player is the winner

### Strategy Tips
- **Early Game**: Use narrow, specific categories to maintain flexibility
- **Mid Game**: Target opponents by banning categories they might rely on  
- **Late Game**: Carefully remember ALL banned categories
- **Be Creative**: Instead of "actors" try "people who have been in a Woody Allen film"

### Example Moves
```
Player 1: "Nelson Mandela - people who have definitely been imprisoned"
Player 2: "Enya - people with forenames rhyming with countries"  
Player 3: "Kevin Na - people with names having three or fewer letters"
Player 4: "Carol Vorderman - people with hair longer than chin level"
```

## Architecture

### Frontend (Next.js)
- Real-time game interface with turn management
- Human player input forms and AI move display
- Game state visualization and history
- Located in `/frontend`

### Backend (FastAPI)
- Game state management and turn validation
- AI agent orchestration using Anthropic's Claude API
- Move validation and category conflict detection
- Located in `/backend`

## Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Anthropic API key (get from https://console.anthropic.com/)

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/willmaclean/nmj.git
cd nmj
```

2. **Set up environment variables:**
```bash
# Create .env file in backend directory with your API key
echo "ANTHROPIC_API_KEY=your-actual-api-key-here" > backend/.env
```

3. **Install and run (automatic):**
```bash
# This installs dependencies and starts both frontend and backend
npm run dev
```

**Or install manually:**
```bash
# Frontend
cd frontend
npm install

# Backend  
cd ../backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Run manually:**
```bash
# From root directory - runs both servers
npm run dev

# Or run separately:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:8000
```

5. **Open the game:**
   - Navigate to http://localhost:3000
   - Choose to play with or without a human player
   - Watch AI agents compete or join in yourself!

## Features

### Human vs AI Mode
- **Optional Human Player**: Choose to play yourself against 3 AI agents
- **AI-Only Mode**: Watch 4 AI agents compete against each other
- **Name Entry**: Human players can enter their own name

### AI Intelligence
- **Smart Strategy**: AI agents use different strategies based on game state
- **Retry Logic**: AI gets 2 retry attempts if their move violates rules (configurable)
- **Creative Categories**: AI creates humorous and strategic category choices
- **Memory**: AI tracks all banned categories and active players

### Game Management
- **Turn Order**: Robust player cycling that handles eliminations correctly
- **Move Validation**: Real-time checking against banned categories
- **Game State**: Complete history of moves, eliminations, and banned categories
- **Error Handling**: Graceful handling of invalid moves and API errors

## Deployment

### Frontend (Vercel)

1. Import the repository on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = Your backend API URL (e.g., `https://your-backend.vercel.app`)

### Backend (Vercel)

The backend is also configured for Vercel deployment:

1. Deploy the backend separately on Vercel
2. Set the root directory to `backend`
3. Add environment variable:
   - `ANTHROPIC_API_KEY` = Your Anthropic API key

### Adding the Anthropic API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key (starts with `sk-ant-api03-...`)
   - **Environment**: Select all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your backend for the changes to take effect

## Environment Variables

### Backend
- `ANTHROPIC_API_KEY` - **Required** for AI agents. Get from https://console.anthropic.com/
  - The backend will validate this key exists and provide helpful error messages

### Frontend  
- `NEXT_PUBLIC_API_URL` - Backend API endpoint (defaults to http://localhost:8000)

### Environment Setup Notes
- Environment variables are loaded automatically using `python-dotenv`
- Missing API key will show clear error messages with setup instructions
- The `.env` file should never be committed to version control (already in `.gitignore`)

## Game Flow

1. **Create Game**: Choose to play with or without a human player
2. **Enter Name**: Human players can enter their preferred name
3. **Game Start**: 4 players (human + 3 AI, or 4 AI) begin taking turns
4. **Take Turns**: Each player names a person and declares a category
5. **Category Banned**: The declared category becomes permanently banned
6. **Continue Playing**: Players must avoid naming anyone from banned categories
7. **Elimination**: Players are eliminated if they violate a banned category
8. **Victory**: Last remaining player wins the game

## Turn Mechanics

### AI Player Turns
- AI agents automatically generate moves based on game state
- They get 2 retry attempts if their move violates banned categories
- AI provides reasoning for their person and category choices
- Moves are validated in real-time against all banned categories

### Human Player Turns  
- Enter the name of a famous person
- Declare ONE category that person belongs to
- Submit your move (no retries - choose carefully!)
- Watch as your category gets added to the banned list

## Tech Stack

- **Frontend**: Next.js, React
- **Backend**: FastAPI, Python 3.9+, Anthropic Claude API  
- **AI Models**: Claude 3.5 Sonnet via Anthropic API
- **Environment**: Python virtual environments, Node.js
- **Deployment**: Vercel (configured for both frontend and backend)

## Development

### Project Structure
```
nmj/
├── package.json       # Root package with dev scripts
├── README.md         # This file
├── frontend/         # Next.js frontend
│   ├── pages/        # Page components  
│   │   └── index.js  # Main game interface
│   ├── components/   # Reusable components
│   │   └── GameBoard.js  # Game state display
│   ├── package.json  # Frontend dependencies
│   └── vercel.json   # Vercel frontend config
├── backend/          # FastAPI backend
│   ├── .env          # Environment variables (not in git)
│   ├── requirements.txt  # Python dependencies
│   ├── vercel.json   # Vercel backend config
│   └── api/          # API endpoints and game logic
│       ├── main.py   # FastAPI app and routes
│       ├── game_state.py  # Game state management
│       ├── agents.py # AI agent logic and orchestration
│       └── prompts.py    # AI system prompts
└── .gitignore        # Git ignore patterns
```

### API Endpoints

- `POST /api/game/create` - Create a new game (with optional human player)
- `POST /api/game/turn` - Execute an AI turn  
- `POST /api/game/human-move` - Submit a human player move
- `GET /api/game/{game_id}/state` - Get current game state

### Available Scripts

```bash
# Development (runs both frontend and backend)
npm run dev

# Install dependencies
npm run install           # Install both frontend and backend
npm run install:frontend  # Frontend only
npm run install:backend   # Backend only

# Run separately  
npm run dev:frontend     # Start frontend only (port 3000)
npm run dev:backend      # Start backend only (port 8000)

# Clean up
npm run clean           # Remove node_modules and venv
```

## Configuration

### AI Behavior Settings
The AI retry behavior can be configured in `backend/api/agents.py`:

```python
# In GameOrchestrator.__init__()
ai_retry_attempts: int = 2  # Number of retries for AI players
```

### Customizing AI Prompts
AI personality and strategy can be modified in `backend/api/prompts.py`:
- `PLAYER_SYSTEM_PROMPT` - Overall game rules and AI personality
- `PLAYER_TURN_PROMPT` - Turn-specific instructions and strategy tips

## Troubleshooting

### Common Issues

**"Authentication Error: invalid x-api-key"**
- Check that your `.env` file contains a valid Anthropic API key
- Get a new key from https://console.anthropic.com/
- Ensure the key starts with `sk-ant-api03-`

**"Missing required environment variables"**  
- Create a `.env` file in the `backend/` directory
- Add your API key: `ANTHROPIC_API_KEY=your-key-here`

**Frontend can't connect to backend**
- Ensure both servers are running (`npm run dev`)
- Check that backend is on port 8000 and frontend on port 3000
- Verify no firewall is blocking the ports

**AI players making invalid moves**
- This is expected occasionally - AI gets retry attempts
- Check the console logs for retry attempts and validation details
- If persistent, the AI prompts may need adjustment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Test both AI-only and human-vs-AI modes
- Update README if adding new features
- Ensure environment variables are properly handled

## License

MIT License - see LICENSE file for details

---

**Have fun playing No More Jockeys!** 🏆

Try to outlast the AI agents with clever person choices and strategic category bans.