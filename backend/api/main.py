from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables (development only - production uses system env vars)
load_dotenv()

logger.info("Starting FastAPI application...")

try:
    from .agents import GameOrchestrator
    logger.info("Successfully imported GameOrchestrator")
except Exception as e:
    logger.error(f"Failed to import GameOrchestrator: {str(e)}")
    raise

app = FastAPI()

# CORS configuration - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Cannot be True with allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"message": "FastAPI backend is running", "status": "healthy"}

@app.get("/api/health")
async def health_check():
    """API health check endpoint"""
    return {"message": "API is healthy", "status": "ok"}

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
    logger.info(f"Creating new game with human player: {request.human_player_name}")
    
    try:
        game_id = str(uuid.uuid4())
        logger.info(f"Generated game ID: {game_id}")
        
        # Create game orchestrator
        orchestrator = GameOrchestrator(
            human_player_name=request.human_player_name
        )
        orchestrator.game_state.game_id = game_id
        
        games[game_id] = orchestrator
        logger.info(f"Successfully created game {game_id}")
        
        return {
            "game_id": game_id,
            "game_state": orchestrator.game_state.to_dict(),
            "has_human": orchestrator.has_human
        }
        
    except Exception as e:
        logger.error(f"Failed to create game: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create game: {str(e)}")

@app.post("/api/game/turn")
async def play_turn(action: GameAction):
    """Play one turn of the game"""
    logger.info(f"Playing turn for game {action.game_id}")
    
    try:
        if action.game_id not in games:
            logger.error(f"Game {action.game_id} not found")
            raise HTTPException(status_code=404, detail="Game not found")
        
        orchestrator = games[action.game_id]
        
        # Play turn using orchestrator
        result = orchestrator.play_turn()
        logger.info(f"Successfully played turn for game {action.game_id}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to play turn for game {action.game_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to play turn: {str(e)}")

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

# FastAPI app is automatically detected by Vercel for ASGI deployment
