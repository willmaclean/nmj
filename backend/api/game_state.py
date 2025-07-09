from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Move:
    player_id: int
    person: str
    category: str
    reasoning: str
    timestamp: datetime
    valid: bool = True
    violations: list[str] = field(default_factory=list)

@dataclass
class Player:
    id: int
    name: str
    is_human: bool = False
    active: bool = True
    elimination_reason: str | None = None
    moves: list[Move] = field(default_factory=list)

@dataclass
class GameState:
    players: list[Player]
    banned_categories: list[dict[str, str]]  # [{"category": "presidents", "banned_by": "Obama"}]
    moves: list[Move]
    current_player_id: int = 1  # Track by ID instead of index
    game_id: str = ""
    
    def get_active_players(self) -> list[Player]:
        return [p for p in self.players if p.active]
    
    def get_current_player(self) -> Player | None:
        # Find the current player by ID
        for player in self.players:
            if player.id == self.current_player_id and player.active:
                return player
        
        # If current player is eliminated, find next active player
        active_players = self.get_active_players()
        if not active_players:
            return None
            
        # Find next active player after current_player_id
        player_ids = [p.id for p in self.players]
        current_index = player_ids.index(self.current_player_id) if self.current_player_id in player_ids else 0
        
        for i in range(len(player_ids)):
            next_index = (current_index + i) % len(player_ids)
            next_player_id = player_ids[next_index]
            next_player = next(p for p in self.players if p.id == next_player_id)
            if next_player.active:
                self.current_player_id = next_player_id
                return next_player
        
        return None

    def advance_turn(self):
        active_players = self.get_active_players()
        if not active_players:
            return
            
        # Get ordered list of all player IDs
        player_ids = [p.id for p in self.players]
        current_index = player_ids.index(self.current_player_id)
        
        # Find next active player
        for i in range(1, len(player_ids) + 1):
            next_index = (current_index + i) % len(player_ids)
            next_player_id = player_ids[next_index]
            next_player = next(p for p in self.players if p.id == next_player_id)
            if next_player.active:
                self.current_player_id = next_player_id
                return
    
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
                    "is_human": p.is_human,
                    "active": p.active,
                    "elimination_reason": p.elimination_reason,
                    "move_count": len(p.moves)
                } for p in self.players
            ],
            "banned_categories": self.banned_categories,
            "current_player": self.get_current_player().id if self.get_current_player() else None,
            "turn_number": len(self.moves),
            "game_over": len(self.get_active_players()) <= 1,
            "moves": [
                {
                    "player_id": m.player_id,
                    "person": m.person,
                    "category": m.category,
                    "reasoning": m.reasoning,
                    "valid": m.valid,
                    "violations": m.violations,
                    "timestamp": m.timestamp.isoformat() if m.timestamp else None
                } for m in self.moves
            ]
        }
