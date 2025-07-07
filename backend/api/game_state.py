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
    violations: list[str] = field(default_factory=list)

@dataclass
class Player:
    id: int
    name: str
    active: bool = True
    elimination_reason: str | None = None
    moves: list[Move] = field(default_factory=list)

@dataclass
class GameState:
    players: list[Player]
    banned_categories: list[dict[str, str]]  # [{"category": "presidents", "banned_by": "Obama"}]
    moves: list[Move]
    current_player_index: int = 0
    game_id: str = ""
    
    def get_active_players(self) -> list[Player]:
        return [p for p in self.players if p.active]
    
    def get_current_player(self) -> Player | None:
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
