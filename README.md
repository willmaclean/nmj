# NMJ - No More Jokes

A multiplayer party game where AI agents try to answer questions seriously while one tries to be funny. Built with Next.js and FastAPI.

## Overview

NMJ is a party game where:
- Players submit questions
- AI agents (powered by Claude) provide answers
- Most agents try to answer seriously, but one secret "Joker" tries to be funny
- Players vote on which answer they think is the joke
- Points are awarded for correct guesses and fooling other players

## Architecture

### Frontend (Next.js)
- Real-time game interface
- WebSocket connection for live updates
- Responsive design for mobile and desktop
- Located in `/frontend`

### Backend (FastAPI)
- Game state management
- AI agent orchestration using Anthropic's Claude API
- WebSocket support for real-time gameplay
- Located in `/backend`

## Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Anthropic API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/willmaclean/nmj.git
cd nmj
```

2. Set up environment variables:
```bash
# Create .env file in backend directory
echo "ANTHROPIC_API_KEY=your-api-key-here" > backend/.env
```

3. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

4. Run the development servers:
```bash
# From root directory
./start.sh

# Or run separately:
# Backend: ./start_backend.sh
# Frontend: ./start_frontend.sh
```

5. Open http://localhost:3000

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

#### Backend
- `ANTHROPIC_API_KEY` - Required for AI agents (get from https://console.anthropic.com/)

#### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API endpoint (defaults to http://localhost:8000)

## Game Flow

1. **Create/Join Game**: Players enter a game code or create a new game
2. **Submit Questions**: Each player submits a question
3. **AI Answers**: AI agents generate answers (one is the secret joker)
4. **Voting**: Players vote on which answer is the joke
5. **Scoring**: Points awarded based on correct guesses
6. **Next Round**: Continues until all questions are answered

## Scoring System

- **Correct Guess**: 2 points for identifying the joker
- **Fooling Players**: 1 point for each player who incorrectly votes for your serious answer
- **Joker Success**: 1 point for each player who doesn't identify you as the joker

## Tech Stack

- **Frontend**: Next.js, React, Socket.io-client
- **Backend**: FastAPI, Python 3.9+, Anthropic Claude API
- **Deployment**: Vercel
- **Real-time**: WebSockets

## Development

### Project Structure
```
nmj/
├── frontend/          # Next.js frontend
│   ├── pages/        # Page components
│   ├── components/   # Reusable components
│   └── vercel.json   # Vercel configuration
├── backend/          # FastAPI backend
│   ├── api/          # API endpoints and game logic
│   │   ├── main.py   # FastAPI app and routes
│   │   ├── game_state.py  # Game state management
│   │   ├── agents.py      # AI agent logic
│   │   └── prompts.py     # AI prompts
│   └── vercel.json   # Vercel configuration
└── README.md         # This file
```

### API Endpoints

- `POST /create-game` - Create a new game
- `POST /join-game` - Join an existing game
- `GET /game/{game_id}/state` - Get current game state
- `WebSocket /ws/{game_id}` - Real-time game updates

## Quick Start Commands

```bash
# Install everything
npm install

# Run both frontend and backend
npm run dev

# Run individually
npm run dev:frontend
npm run dev:backend

# Clean build artifacts
npm run clean
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details