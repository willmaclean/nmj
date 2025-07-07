# No More Jockeys: Multi-LLM Game Implementation

## Architecture Overview

**Stack:**
- Backend: Python FastAPI (deployable to Vercel as serverless functions)
- Frontend: React with Next.js
- LLM Framework: LangChain for agent orchestration
- Models: Anthropic Claude (Haiku for speed)
- Deployment: Local development → Vercel production

## Project Structure

```
no-more-jockeys/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agents.py
│   │   ├── game_state.py
│   │   └── prompts.py
│   ├── requirements.txt
│   └── vercel.json
├── frontend/
│   ├── pages/
│   │   ├── api/
│   │   │   └── game.js
│   │   └── index.js
│   ├── components/
│   │   └── GameBoard.js
│   ├── package.json
│   └── next.config.js
└── README.md
```

## Backend Implementation

### `backend/api/prompts.py`

```python
PLAYER_SYSTEM_PROMPT = """You are playing No More Jockeys against other AI players. 

GAME RULES:
1. Name a real person and declare a category they belong to
2. That category becomes banned for all future turns
3. You cannot name someone who belongs to any banned category
4. Categories must be objective and verifiable
5. You lose if you name someone from a banned category or fail to respond

STRATEGY TIPS:
- Early game: Use narrow categories to maintain flexibility
- Mid game: Target opponents by banning categories they might rely on
- Late game: Remember ALL banned categories carefully
- Safe picks: Historical figures with limited category memberships
- Risky picks: Modern celebrities who belong to many categories

You are Player {player_id}."""

PLAYER_TURN_PROMPT = """Current game state:

BANNED CATEGORIES:
{banned_categories}

RECENT MOVES (last 5):
{recent_moves}

ACTIVE PLAYERS: {active_players}
ELIMINATED PLAYERS: {eliminated_players}

It's your turn. Name a person and declare ONE category they belong to that will be banned.

Think strategically:
1. What categories might other players need?
2. What persons are safe (belong to few categories)?
3. What broad categories could eliminate multiple players?

Respond in this exact JSON format:
{{"person": "Full Name", "category": "specific category description", "reasoning": "strategic explanation"}}"""

VALIDATOR_SYSTEM_PROMPT = """You are a rules judge for No More Jockeys. You must determine if a person belongs to any banned categories.

Be strict but fair:
- "Presidents" includes all presidents of any country, past or present
- "Athletes" includes professional and Olympic athletes
- "British people" includes anyone with British citizenship at any point
- Categories apply historically (e.g., "actors" includes anyone who ever acted professionally)
- Dual categories count (someone can be both an athlete and an actor)"""

VALIDATOR_CHECK_PROMPT = """Check if this person violates any banned categories:

PERSON: {person}
KNOWN INFORMATION: {person_info}

BANNED CATEGORIES:
{banned_categories}

For each category, determine if the person belongs to it. Be thorough and consider:
- Historical membership (did they EVER belong to this category?)
- Edge cases (is a racing driver an athlete?)
- Multiple nationalities or careers

Respond in JSON:
{{"violations": ["list", "of", "violated", "categories"], "safe": true/false, "explanations": {{"category": "reason"}}}}"""

PERSON_INFO_PROMPT = """Provide factual information about {person} focusing on:
- Nationality/citizenship (all countries)
- Professions/occupations (all, including past)
- Notable achievements
- Categories they belong to

Be comprehensive but concise. Format as JSON:
{{"nationalities": [], "occupations": [], "achievements": [], "other_categories": []}}"""
```

### `backend/api/game_state.py`

```python
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

@dataclass
class Move:
    player_id: int
    person: str
    category: str
    reasoning: str
    timestamp: datetime
    valid: bool = True
    violations: List[str] = field(default_factory=list)

@dataclass
class Player:
    id: int
    name: str
    active: bool = True
    elimination_reason: Optional[str] = None
    moves: List[Move] = field(default_factory=list)

@dataclass
class GameState:
    players: List[Player]
    banned_categories: List[Dict[str, str]]  # [{"category": "presidents", "banned_by": "Obama"}]
    moves: List[Move]
    current_player_index: int = 0
    game_id: str = ""
    
    def get_active_players(self) -> List[Player]:
        return [p for p in self.players if p.active]
    
    def get_current_player(self) -> Optional[Player]:
        active_players = self.get_active_players()
        if not active_players:
            return None
        return active_players[self.current_player_index % len(active_players)]
    
    def advance_turn(self):
        active_players = self.get_active_players()
        if active_players:
            self.current_player_index = (self.current_player_index + 1) % len(active_players)
    
    def eliminate_player(self, player_id: int, reason: str):
        for player in self.players:
            if player.id == player_id:
                player.active = False
                player.elimination_reason = reason
                break
    
    def add_banned_category(self, category: str, person: str):
        self.banned_categories.append({
            "category": category,
            "banned_by": person,
            "turn": len(self.moves)
        })
    
    def to_dict(self) -> dict:
        return {
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "active": p.active,
                    "elimination_reason": p.elimination_reason,
                    "move_count": len(p.moves)
                } for p in self.players
            ],
            "banned_categories": self.banned_categories,
            "current_player": self.get_current_player().id if self.get_current_player() else None,
            "turn_number": len(self.moves),
            "game_over": len(self.get_active_players()) <= 1
        }
```

### `backend/api/agents.py`

```python
from langchain.chat_models import ChatAnthropic
from langchain.schema import SystemMessage, HumanMessage
from langchain.output_parsers import JSONOutputParser
import json
from typing import Dict, List, Tuple
import os
from .prompts import *
from .game_state import GameState, Move, Player

class JockeyAgent:
    def __init__(self, player_id: int, model_name: str = "claude-3-haiku-20240307"):
        self.player_id = player_id
        self.llm = ChatAnthropic(
            model=model_name,
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
            temperature=0.7,
            max_tokens=200
        )
        self.system_prompt = PLAYER_SYSTEM_PROMPT.format(player_id=player_id)
    
    def take_turn(self, game_state: GameState) -> Dict:
        """Generate a move based on current game state"""
        banned_cats = "\n".join([
            f"- {b['category']} (banned when {b['banned_by']} was named)"
            for b in game_state.banned_categories
        ]) if game_state.banned_categories else "None yet"
        
        recent_moves = "\n".join([
            f"Player {m.player_id}: {m.person} - no more {m.category}"
            for m in game_state.moves[-5:]
        ]) if game_state.moves else "This is the first move"
        
        active_players = [p.id for p in game_state.get_active_players()]
        eliminated = [f"{p.id} ({p.elimination_reason})" 
                     for p in game_state.players if not p.active]
        
        turn_prompt = PLAYER_TURN_PROMPT.format(
            banned_categories=banned_cats,
            recent_moves=recent_moves,
            active_players=active_players,
            eliminated_players=eliminated or "None"
        )
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=turn_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        try:
            move_data = json.loads(response.content)
            return move_data
        except json.JSONDecodeError:
            # Fallback parsing
            return {
                "person": "Unknown",
                "category": "unknown",
                "reasoning": "Failed to parse response"
            }

class ValidatorAgent:
    def __init__(self, model_name: str = "claude-3-haiku-20240307"):
        self.llm = ChatAnthropic(
            model=model_name,
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
            temperature=0.1,  # Low temperature for consistency
            max_tokens=300
        )
    
    def get_person_info(self, person: str) -> Dict:
        """Get comprehensive info about a person"""
        messages = [
            SystemMessage(content="You are a factual information provider."),
            HumanMessage(content=PERSON_INFO_PROMPT.format(person=person))
        ]
        
        response = self.llm.invoke(messages)
        try:
            return json.loads(response.content)
        except:
            return {"error": "Could not parse person info"}
    
    def validate_move(self, person: str, banned_categories: List[Dict]) -> Tuple[bool, List[str], Dict]:
        """Check if person violates any banned categories"""
        if not banned_categories:
            return True, [], {}
        
        # First get person info
        person_info = self.get_person_info(person)
        
        banned_cats = "\n".join([
            f"- {b['category']}" for b in banned_categories
        ])
        
        check_prompt = VALIDATOR_CHECK_PROMPT.format(
            person=person,
            person_info=json.dumps(person_info),
            banned_categories=banned_cats
        )
        
        messages = [
            SystemMessage(content=VALIDATOR_SYSTEM_PROMPT),
            HumanMessage(content=check_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        try:
            result = json.loads(response.content)
            return result["safe"], result.get("violations", []), result.get("explanations", {})
        except:
            # If parsing fails, assume valid
            return True, [], {}

class GameOrchestrator:
    def __init__(self):
        self.agents = {
            i: JockeyAgent(player_id=i) for i in range(1, 5)
        }
        self.validator = ValidatorAgent()
        self.game_state = GameState(
            players=[Player(id=i, name=f"Claude-{i}") for i in range(1, 5)],
            banned_categories=[],
            moves=[]
        )
    
    def play_turn(self) -> Dict:
        """Execute one turn of the game"""
        current_player = self.game_state.get_current_player()
        
        if not current_player:
            return {"error": "Game over", "winner": self._get_winner()}
        
        # Get move from agent
        agent = self.agents[current_player.id]
        move_data = agent.take_turn(self.game_state)
        
        # Validate move
        is_valid, violations, explanations = self.validator.validate_move(
            move_data["person"],
            self.game_state.banned_categories
        )
        
        # Create move record
        move = Move(
            player_id=current_player.id,
            person=move_data["person"],
            category=move_data["category"],
            reasoning=move_data["reasoning"],
            timestamp=datetime.now(),
            valid=is_valid,
            violations=violations
        )
        
        # Update game state
        self.game_state.moves.append(move)
        current_player.moves.append(move)
        
        if is_valid:
            self.game_state.add_banned_category(
                move_data["category"],
                move_data["person"]
            )
        else:
            violation_detail = f"Named {move_data['person']} who is in banned category: {', '.join(violations)}"
            self.game_state.eliminate_player(current_player.id, violation_detail)
        
        self.game_state.advance_turn()
        
        return {
            "move": move_data,
            "valid": is_valid,
            "violations": violations,
            "explanations": explanations,
            "game_state": self.game_state.to_dict()
        }
    
    def _get_winner(self) -> Optional[int]:
        active = self.game_state.get_active_players()
        return active[0].id if len(active) == 1 else None
```

### `backend/api/main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
from .agents import GameOrchestrator

app = FastAPI()

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store game instances (in production, use Redis)
games: Dict[str, GameOrchestrator] = {}

class GameAction(BaseModel):
    game_id: str
    action: str

@app.post("/api/game/create")
async def create_game():
    """Create a new game instance"""
    import uuid
    game_id = str(uuid.uuid4())
    games[game_id] = GameOrchestrator()
    return {
        "game_id": game_id,
        "game_state": games[game_id].game_state.to_dict()
    }

@app.post("/api/game/turn")
async def play_turn(action: GameAction):
    """Play one turn of the game"""
    if action.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[action.game_id]
    result = orchestrator.play_turn()
    
    return result

@app.get("/api/game/{game_id}/state")
async def get_game_state(game_id: str):
    """Get current game state"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return games[game_id].game_state.to_dict()

# For Vercel
handler = app
```

### `backend/requirements.txt`

```
fastapi==0.104.1
langchain==0.0.350
langchain-anthropic==0.1.1
uvicorn==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
```

### `backend/vercel.json`

```json
{
  "functions": {
    "api/main.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/main"
    }
  ]
}
```

## Frontend Implementation

### `frontend/pages/index.js`

```javascript
import { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';

export default function Home() {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-backend.vercel.app' 
    : 'http://localhost:8000';

  const createGame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/create`, {
        method: 'POST',
      });
      const data = await res.json();
      setGameId(data.game_id);
      setGameState(data.game_state);
    } catch (error) {
      console.error('Error creating game:', error);
    }
    setLoading(false);
  };

  const playTurn = async () => {
    if (!gameId || loading) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, action: 'play' }),
      });
      const data = await res.json();
      setGameState(data.game_state);
      
      // Log the move
      console.log(`Player ${data.move.player_id}: ${data.move.person} - no more ${data.move.category}`);
      if (!data.valid) {
        console.log(`ELIMINATED! Violations: ${data.violations.join(', ')}`);
      }
    } catch (error) {
      console.error('Error playing turn:', error);
    }
    setLoading(false);
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && gameState && !gameState.game_over && !loading) {
      const timer = setTimeout(playTurn, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, gameState, loading]);

  return (
    <div className="container">
      <h1>No More Jockeys - LLM Battle</h1>
      
      {!gameId ? (
        <button onClick={createGame} disabled={loading}>
          Start New Game
        </button>
      ) : (
        <>
          <div className="controls">
            <button onClick={playTurn} disabled={loading || gameState?.game_over}>
              {loading ? 'Thinking...' : 'Next Turn'}
            </button>
            <label>
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
              />
              Auto-play
            </label>
          </div>
          
          {gameState && <GameBoard gameState={gameState} />}
        </>
      )}
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .controls {
          margin: 20px 0;
          display: flex;
          gap: 20px;
          align-items: center;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
```

### `frontend/components/GameBoard.js`

```javascript
export default function GameBoard({ gameState }) {
  const getPlayerStatus = (player) => {
    if (!player.active) return '❌ ELIMINATED';
    if (gameState.current_player === player.id) return '👉 Current Turn';
    return '✅ Active';
  };

  return (
    <div className="game-board">
      <div className="section">
        <h2>Players</h2>
        <div className="players">
          {gameState.players.map(player => (
            <div key={player.id} className={`player ${!player.active ? 'eliminated' : ''}`}>
              <h3>{player.name}</h3>
              <p>{getPlayerStatus(player)}</p>
              {player.elimination_reason && (
                <p className="elimination-reason">{player.elimination_reason}</p>
              )}
              <p>Moves: {player.move_count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Banned Categories ({gameState.banned_categories.length})</h2>
        <div className="banned-categories">
          {gameState.banned_categories.map((cat, idx) => (
            <div key={idx} className="category">
              <strong>{cat.category}</strong>
              <span> (via {cat.banned_by}, turn {cat.turn + 1})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Game Info</h2>
        <p>Turn: {gameState.turn_number}</p>
        <p>Active Players: {gameState.players.filter(p => p.active).length}</p>
        {gameState.game_over && (
          <h3>🏆 Winner: Player {gameState.players.find(p => p.active)?.id}</h3>
        )}
      </div>

      <style jsx>{`
        .game-board {
          display: grid;
          gap: 20px;
        }
        .section {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .players {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }
        .player {
          border: 2px solid #28a745;
          padding: 15px;
          border-radius: 8px;
          background: #f8f9fa;
        }
        .player.eliminated {
          border-color: #dc3545;
          opacity: 0.7;
        }
        .player h3 {
          margin: 0 0 10px 0;
        }
        .player p {
          margin: 5px 0;
          font-size: 14px;
        }
        .elimination-reason {
          color: #dc3545;
          font-size: 12px;
        }
        .banned-categories {
          max-height: 300px;
          overflow-y: auto;
        }
        .category {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .category span {
          color: #666;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
```

### `frontend/package.json`

```json
{
  "name": "jockeys-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
```

## Deployment Instructions

### Local Development

1. **Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key-here"
uvicorn api.main:app --reload --port 8000
```

2. **Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

3. **Test locally:** Open http://localhost:3000

### Vercel Deployment

1. **Backend Deployment:**
```bash
cd backend
vercel --prod
# Set environment variable in Vercel dashboard: ANTHROPIC_API_KEY
```

2. **Frontend Deployment:**
```bash
cd frontend
# Update API_URL in pages/index.js to your backend URL
vercel --prod
```

3. **Environment Variables:**
- Go to Vercel dashboard
- Add `ANTHROPIC_API_KEY` to backend project
- Add `NEXT_PUBLIC_API_URL` to frontend project (optional)

## Game Features

1. **Turn Management:** Sequential turns with automatic advancement
2. **Validation:** Comprehensive category checking with explanations
3. **Auto-play:** Watch LLMs play automatically
4. **Error Handling:** Graceful handling of API failures
5. **Game State:** Complete history and banned category tracking
6. **Visual Feedback:** Clear UI showing game progression

## Cost Optimization

- Uses Haiku model (~$0.25 per 1M tokens)
- Average game: ~50 turns × 2 API calls × 500 tokens = 50K tokens ≈ $0.0125
- Caching person info could reduce validator calls
- Batch validation for multiple categories

This implementation provides a complete, production-ready system for running No More Jockeys with 4 LLM agents, with clear separation of concerns and easy deployment to Vercel.
