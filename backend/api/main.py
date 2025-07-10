from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from dotenv import load_dotenv
from .agents import GameOrchestrator

# Load environment variables (development only - production uses system env vars)
load_dotenv()

app = FastAPI()

# CORS configuration - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Simple in-memory game storage
games = {}

class CreateGameRequest(BaseModel):
    human_player_name: str = None

class GameAction(BaseModel):
    game_id: str

class HumanMoveRequest(BaseModel):
    game_id: str
    person: str
    category: str
    reasoning: str = "Human player move"

@app.post("/api/game/create")
async def create_game(request: CreateGameRequest = CreateGameRequest()):
    """Create a new game instance"""
    game_id = str(uuid.uuid4())
    # Create game orchestrator
    orchestrator = GameOrchestrator(
        human_player_name=request.human_player_name
    )
    orchestrator.game_state.game_id = game_id
    
    games[game_id] = orchestrator
    
    return {
        "game_id": game_id,
        "game_state": orchestrator.game_state.to_dict(),
        "has_human": orchestrator.has_human
    }

@app.post("/api/game/turn")
async def play_turn(action: GameAction):
    """Play one turn of the game"""
    if action.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[action.game_id]
    
    # Play turn using orchestrator
    result = orchestrator.play_turn()
    
    return result

@app.get("/api/game/{game_id}/state")
async def get_game_state(game_id: str):
    """Get current game state"""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[game_id]
    return orchestrator.game_state.to_dict()

@app.post("/api/game/human-move")
async def make_human_move(request: HumanMoveRequest):
    """Make a move for human player"""
    if request.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    orchestrator = games[request.game_id]
    
    # Play turn with human move
    human_move = {
        "person": request.person,
        "category": request.category,
        "reasoning": request.reasoning
    }
    
    result = orchestrator.play_turn(human_move=human_move)
    
    return result

# For Vercel
handler = app
