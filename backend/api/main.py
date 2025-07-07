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
