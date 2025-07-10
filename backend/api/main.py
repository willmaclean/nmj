from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from .agents import GameOrchestrator

# Load environment variables from .env file
load_dotenv()

# Validate required environment variables
required_env_vars = {
    "ANTHROPIC_API_KEY": "Anthropic API key is required. Get one from https://console.anthropic.com/"
}

missing_vars = []
for var, description in required_env_vars.items():
    if not os.environ.get(var):
        missing_vars.append(f"- {var}: {description}")

if missing_vars:
    error_msg = "Missing required environment variables:\n" + "\n".join(missing_vars)
    print(f"❌ Configuration Error:\n{error_msg}")
    print("\n💡 Create a .env file in the backend directory with:")
    print("ANTHROPIC_API_KEY=your-key-here")
    raise RuntimeError(error_msg)

app = FastAPI()

# CORS configuration - allow all Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Store game instances (in production, use Redis)
games: dict[str, GameOrchestrator] = {}

class GameAction(BaseModel):
    game_id: str

class CreateGameRequest(BaseModel):
    human_player_name: str = None

class HumanMoveRequest(BaseModel):
    game_id: str
    person: str
    category: str
    reasoning: str = "Human player move"

@app.post("/api/game/create")
async def create_game(request: CreateGameRequest = CreateGameRequest()):
    """Create a new game instance"""
    import uuid
    game_id = str(uuid.uuid4())
    games[game_id] = GameOrchestrator(human_player_name=request.human_player_name)
    return {
        "game_id": game_id,
        "game_state": games[game_id].game_state.to_dict(),
        "has_human": games[game_id].has_human
    }

@app.post("/api/game/turn")
async def play_turn(action: GameAction):
    """Play one turn of the game (AI only)"""
    if action.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[action.game_id]
    result = orchestrator.play_turn()
    
    return result

@app.post("/api/game/human-move")
async def make_human_move(move: HumanMoveRequest):
    """Make a human player move"""
    if move.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[move.game_id]
    
    # Validate it's the human player's turn
    current_player = orchestrator.game_state.get_current_player()
    if not current_player or not current_player.is_human:
        raise HTTPException(status_code=400, detail="Not human player's turn")
    
    human_move = {
        "person": move.person,
        "category": move.category,
        "reasoning": move.reasoning
    }
    
    result = orchestrator.play_turn(human_move=human_move)
    return result

@app.get("/api/game/{game_id}/state")
async def get_game_state(game_id: str):
    """Get current game state"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return games[game_id].game_state.to_dict()

# For Vercel
handler = app
