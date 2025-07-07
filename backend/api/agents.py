from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
import json
import os
from .prompts import *
from .game_state import GameState, Move, Player
from datetime import datetime

def _parse_json_response(response_content: str) -> dict:
    """Extracts and parses JSON from a string that might contain extra text."""
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
    def __init__(self, player_id: int, model_name: str = "claude-3-5-sonnet-20241022"):
        self.player_id = player_id
        self.llm = ChatAnthropic(
            model=model_name,
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
            temperature=0.7,
            max_tokens=200
        )
        self.system_prompt = PLAYER_SYSTEM_PROMPT.format(player_id=player_id)
    
    def take_turn(self, game_state: GameState) -> dict:
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
            print(f"Raw response content: {response.content}")
            move_data = _parse_json_response(response.content)
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
    def __init__(self, model_name: str = "claude-3-5-sonnet-20241022"):
        self.llm = ChatAnthropic(
            model=model_name,
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
            temperature=0.1,  # Low temperature for consistency
            max_tokens=300
        )
    
    def get_person_info(self, person: str) -> dict:
        """Get comprehensive info about a person"""
        messages = [
            SystemMessage(content="You are a factual information provider."),
            HumanMessage(content=PERSON_INFO_PROMPT.format(person=person))
        ]
        
        response = self.llm.invoke(messages)
        try:
            return _parse_json_response(response.content)
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
            result = _parse_json_response(response.content)
            return result["safe"], result.get("violations", []), result.get("explanations", {})
        except Exception as e:
            print(f"Error parsing validation response: {e}")
            print(f"Validation response content was: '{response.content}'")
            # If parsing fails, assume valid to keep game flowing
            return True, [], {"error": f"Validation parsing failed: {str(e)}"}

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
    
    def play_turn(self) -> dict:
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
    
    def _get_winner(self) -> int | None:
        active = self.game_state.get_active_players()
        return active[0].id if len(active) == 1 else None
