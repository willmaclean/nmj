from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
import json
import os
import logging
from typing import Dict, List, Optional
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from .prompts import (
    PLAYER_SYSTEM_PROMPT,
    PLAYER_TURN_PROMPT,
    PERSON_INFO_PROMPT,
    VALIDATOR_CHECK_PROMPT,
    VALIDATOR_SYSTEM_PROMPT
)
from .game_state import GameState, Move, Player

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Environment(Enum):
    """Environment types for production detection."""
    DEVELOPMENT = "development"
    PRODUCTION = "production"


@dataclass
class ValidationResult:
    """Result of move validation."""
    is_valid: bool
    violations: List[str]
    explanations: Dict[str, str]


class ProductionDetector:
    """Handles production environment detection."""
    
    @staticmethod
    def is_production() -> bool:
        """Detect if running in production environment."""
        return (
            os.environ.get('VERCEL') == '1' or
            os.environ.get('NODE_ENV') == 'production' or
            os.environ.get('ENVIRONMENT') == 'production'
        )


class LLMClientFactory:
    """Factory for creating LLM clients with appropriate configuration."""
    
    @staticmethod
    def create_anthropic_client(
        model_name: str,
        temperature: float,
        max_tokens: int,
        role: Optional[str] = None,
        player_id: Optional[int] = None
    ) -> ChatAnthropic:
        """Create ChatAnthropic client with environment-appropriate configuration."""
        logger.info(f"Creating LLM client for role: {role}, player: {player_id}")
        
        anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        helicone_key = os.environ.get('HELICONE_API_KEY')
        is_production = ProductionDetector.is_production()
        
        logger.info(f"Environment check - Production: {is_production}")
        logger.info(f"API Keys - Anthropic: {'SET' if anthropic_api_key else 'MISSING'}, "
                   f"Helicone: {'SET' if helicone_key else 'MISSING'}")
        
        if not anthropic_api_key:
            error_msg = "ANTHROPIC_API_KEY environment variable is required"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            # Production: Helicone required
            if is_production:
                logger.info("Production mode: Helicone monitoring required")
                if not helicone_key or helicone_key == 'your_helicone_key_here':
                    error_msg = "HELICONE_API_KEY environment variable is required in production"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                
                logger.info("Creating Helicone-enabled client for production")
                return LLMClientFactory._create_helicone_client(
                    model_name, temperature, max_tokens, anthropic_api_key, 
                    helicone_key, role, player_id
                )
            
            # Development: Helicone optional
            if helicone_key and helicone_key != 'your_helicone_key_here':
                logger.info("Development mode: Using Helicone monitoring")
                return LLMClientFactory._create_helicone_client(
                    model_name, temperature, max_tokens, anthropic_api_key,
                    helicone_key, role, player_id
                )
            
            # Development: Direct Anthropic API
            logger.info("Development mode: Using direct Anthropic API")
            return ChatAnthropic(
                model=model_name,
                anthropic_api_key=anthropic_api_key,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
        except Exception as e:
            logger.error(f"Failed to create LLM client: {str(e)}")
            logger.error(f"Environment: {dict(os.environ)}")
            raise
    
    @staticmethod
    def _create_helicone_client(
        model_name: str,
        temperature: float,
        max_tokens: int,
        anthropic_api_key: str,
        helicone_key: str,
        role: Optional[str],
        player_id: Optional[int]
    ) -> ChatAnthropic:
        """Create Helicone-enabled ChatAnthropic client."""
        headers = {
            "Helicone-Auth": f"Bearer {helicone_key}",
            "Helicone-Property-App": "no-more-jockeys",
        }
        
        if role:
            headers["Helicone-Property-Role"] = role
        if player_id:
            headers["Helicone-Property-Player"] = f"player-{player_id}"
        
        return ChatAnthropic(
            model=model_name,
            anthropic_api_key=anthropic_api_key,
            anthropic_api_url="https://api.helicone.ai/v1",
            temperature=temperature,
            max_tokens=max_tokens,
            default_headers=headers
        )


class JSONResponseParser:
    """Handles parsing JSON responses from LLM outputs."""
    
    @staticmethod
    def parse_json_response(response_content: str) -> Dict:
        """Extract and parse JSON from LLM response that might contain extra text."""
        content = response_content.strip()
        
        # Try to find a complete JSON object
        brace_count = 0
        start_idx = -1
        end_idx = -1
        
        for i, char in enumerate(content):
            if char == '{':
                if start_idx == -1:
                    start_idx = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_idx != -1:
                    end_idx = i + 1
                    break
        
        if start_idx != -1 and end_idx != -1:
            json_content = content[start_idx:end_idx]
            print(f"Extracted JSON: {json_content}")
            return json.loads(json_content)
        else:
            print(f"No valid JSON found, trying full content: {content}")
            return json.loads(content)

class JockeyAgent:
    """AI agent that plays the No More Jockeys game."""
    
    def __init__(self, player_id: int, model_name: str = "claude-3-5-sonnet-20241022"):
        """Initialize the jockey agent with LLM client and system prompt."""
        logger.info(f"Initializing JockeyAgent for player {player_id}")
        
        try:
            self.player_id = player_id
            self.llm = LLMClientFactory.create_anthropic_client(
                model_name=model_name,
                temperature=0.7,
                max_tokens=200,
                role="player",
                player_id=player_id
            )
            self.system_prompt = PLAYER_SYSTEM_PROMPT.format(player_id=player_id)
            logger.info(f"Successfully initialized JockeyAgent for player {player_id}")
        except Exception as e:
            logger.error(f"Failed to initialize JockeyAgent for player {player_id}: {str(e)}")
            raise
    
    def take_turn(self, game_state: GameState, feedback: str = None) -> dict:
        """Generate a move based on current game state.
        Optionally include feedback from a previous invalid attempt."""
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
        
        # Add feedback if this is a retry attempt
        feedback_text = f"\n\nPREVIOUS ATTEMPT FEEDBACK: {feedback}\nPlease choose a different person who does NOT fall into the banned categories." if feedback else ""
        
        turn_prompt = PLAYER_TURN_PROMPT.format(
            banned_categories=banned_cats,
            recent_moves=recent_moves,
            active_players=active_players,
            eliminated_players=eliminated or "None"
        ) + feedback_text
        
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=turn_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        try:
            print(f"Raw response content: {response.content}")
            move_data = JSONResponseParser.parse_json_response(response.content)
            # Validate required fields
            if not all(key in move_data for key in ["person", "category", "reasoning"]):
                raise ValueError("Missing required fields")
            return move_data
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing agent response: {e}")
            print(f"Response content was: '{response.content}'")
            # Fallback parsing
            return {
                "person": "Unknown Person",
                "category": "unknown category",
                "reasoning": f"Failed to parse response: {str(e)}"
            }

class ValidatorAgent:
    """AI agent that validates moves and provides person information."""
    
    def __init__(self, model_name: str = "claude-3-5-sonnet-20241022"):
        """Initialize the validator agent with LLM client."""
        logger.info("Initializing ValidatorAgent")
        
        try:
            self.llm = LLMClientFactory.create_anthropic_client(
                model_name=model_name,
                temperature=0.1,  # Low temperature for consistency
                max_tokens=300,
                role="validator"
            )
            logger.info("Successfully initialized ValidatorAgent")
        except Exception as e:
            logger.error(f"Failed to initialize ValidatorAgent: {str(e)}")
            raise
    
    def get_person_info(self, person: str) -> dict:
        """Get comprehensive info about a person"""
        messages = [
            SystemMessage(content="You are a factual information provider."),
            HumanMessage(content=PERSON_INFO_PROMPT.format(person=person))
        ]
        
        response = self.llm.invoke(messages)
        try:
            return JSONResponseParser.parse_json_response(response.content)
        except Exception as e:
            print(f"Error parsing person info: {e}")
            print(f"Person info response content was: '{response.content}'")
            return {"error": f"Could not parse person info: {str(e)}"}
    
    def validate_move(self, person: str, banned_categories: list[dict]) -> tuple[bool, list[str], dict]:
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
            result = JSONResponseParser.parse_json_response(response.content)
            return result["safe"], result.get("violations", []), result.get("explanations", {})
        except Exception as e:
            print(f"Error parsing validation response: {e}")
            print(f"Validation response content was: '{response.content}'")
            # If parsing fails, assume valid to keep game flowing
            return True, [], {"error": f"Validation parsing failed: {str(e)}"}

class GameOrchestrator:
    """Orchestrates the No More Jockeys game between human and AI players."""
    
    def __init__(self, human_player_name: str = None, ai_retry_attempts: int = 2):
        """Initialize the game orchestrator.
        
        Args:
            human_player_name: Name of human player, if any
            ai_retry_attempts: Number of retry attempts for AI players when invalid moves are made
        """
        logger.info(f"Initializing GameOrchestrator with human player: {human_player_name}")
        
        try:
            self.human_player_name = human_player_name
            self.has_human = human_player_name is not None
            self.ai_retry_attempts = ai_retry_attempts  # Number of retry attempts for AI players
            
            if self.has_human:
                logger.info("Setting up game with human player")
                # Human is player 1, AI agents are 2-4
                self.agents = {
                    i: JockeyAgent(player_id=i) for i in range(2, 5)
                }
                self.game_state = GameState(
                    players=[
                        Player(id=1, name=human_player_name, is_human=True),
                        Player(id=2, name="Claude-2", is_human=False),
                        Player(id=3, name="Claude-3", is_human=False),
                        Player(id=4, name="Claude-4", is_human=False)
                    ],
                    banned_categories=[],
                    moves=[]
                )
            else:
                logger.info("Setting up AI-only game")
                # All AI agents
                self.agents = {
                    i: JockeyAgent(player_id=i) for i in range(1, 5)
                }
                self.game_state = GameState(
                    players=[Player(id=i, name=f"Claude-{i}", is_human=False) for i in range(1, 5)],
                    banned_categories=[],
                    moves=[]
                )
            
            self.validator = ValidatorAgent()
            self.pending_human_turn = False
            logger.info("Successfully initialized GameOrchestrator")
            
        except Exception as e:
            logger.error(f"Failed to initialize GameOrchestrator: {str(e)}")
            raise
    
    def play_turn(self, human_move: dict = None) -> dict:
        """Execute one turn of the game"""
        current_player = self.game_state.get_current_player()
        
        if not current_player:
            return {"error": "Game over", "winner": self._get_winner()}
        
        # Handle human player turn
        if current_player.is_human:
            if human_move is None:
                self.pending_human_turn = True
                return {
                    "waiting_for_human": True,
                    "current_player": current_player.id,
                    "player_name": current_player.name,
                    "game_state": self.game_state.to_dict()
                }
            else:
                # Process human move
                move_data = {
                    "person": human_move.get("person", ""),
                    "category": human_move.get("category", ""),
                    "reasoning": human_move.get("reasoning", "Human player move")
                }
                self.pending_human_turn = False
        else:
            # AI agent turn with retry logic
            agent = self.agents[current_player.id]
            
            # First attempt
            move_data = agent.take_turn(self.game_state)
            is_valid, violations, explanations = self.validator.validate_move(
                move_data["person"],
                self.game_state.banned_categories
            )
            
            # If invalid and this is an AI player, allow configurable retries
            if not is_valid:
                print(f"🔄 AI Player {current_player.id} ({current_player.name}) first attempt failed: {violations}")
                
                # Track retry attempts
                current_move = move_data
                current_violations = violations
                
                for retry_num in range(1, self.ai_retry_attempts + 1):
                    # Generate feedback based on all previous attempts
                    if retry_num == 1:
                        feedback = f"Your choice '{current_move['person']}' violated: {', '.join(current_violations)}. Choose someone else."
                    else:
                        # For multiple retries, provide comprehensive feedback
                        feedback = "Multiple attempts failed. Choose a completely different person who does NOT fall into any banned categories."
                    
                    print(f"🔄 AI Player {current_player.id} attempting retry {retry_num}/{self.ai_retry_attempts}...")
                    
                    retry_move_data = agent.take_turn(self.game_state, feedback)
                    retry_valid, retry_violations, retry_explanations = self.validator.validate_move(
                        retry_move_data["person"],
                        self.game_state.banned_categories
                    )
                    
                    if retry_valid:
                        print(f"✅ AI Player {current_player.id} retry {retry_num} succeeded with: {retry_move_data['person']}")
                        move_data = retry_move_data
                        is_valid = retry_valid
                        violations = retry_violations
                        explanations = retry_explanations
                        break
                    else:
                        print(f"❌ AI Player {current_player.id} retry {retry_num} failed: {retry_violations}")
                        # Update for next iteration or final failure
                        current_move = retry_move_data
                        current_violations = retry_violations
                
                # If all retries failed
                if not is_valid:
                    print(f"💀 AI Player {current_player.id} exhausted all {self.ai_retry_attempts} retries. Player will be eliminated.")
        
        # For human players, validate move normally (no retries)
        if current_player.is_human:
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
            "game_state": self.game_state.to_dict(),
            "waiting_for_human": False
        }
    
    def _get_winner(self) -> Optional[int]:
        """Get the ID of the winning player, if any."""
        active = self.game_state.get_active_players()
        return active[0].id if len(active) == 1 else None
