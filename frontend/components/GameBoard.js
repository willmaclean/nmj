import { useState, useEffect } from 'react';

export default function GameBoard({ gameState }) {
  const [animatingPlayer, setAnimatingPlayer] = useState(null);
  const [showReasoningFor, setShowReasoningFor] = useState(null);

  // Trigger animation when current player changes
  useEffect(() => {
    if (gameState.current_player) {
      setAnimatingPlayer(gameState.current_player);
      const timer = setTimeout(() => setAnimatingPlayer(null), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.current_player]);

  const getPlayerEmoji = (player) => {
    const emojis = ['🤖', '👨‍💼', '👩‍🎨', '🧑‍🚀'];
    return emojis[player.id - 1] || '🤖';
  };

  const getLatestMove = (player) => {
    return gameState.moves
      .filter(move => move.player_id === player.id)
      .slice(-1)[0];
  };

  const getPlayerStatus = (player) => {
    if (!player.active) return 'ELIMINATED';
    if (gameState.current_player === player.id) return 'YOUR TURN';
    return 'WAITING';
  };

  return (
    <div className="game-arena">
      {/* Main Player Arena */}
      <div className="player-arena">
        {gameState.players.map(player => {
          const isCurrentPlayer = gameState.current_player === player.id;
          const isAnimating = animatingPlayer === player.id;
          const latestMove = getLatestMove(player);
          
          return (
            <div 
              key={player.id} 
              className={`player-character ${!player.active ? 'eliminated' : ''} ${isCurrentPlayer ? 'current-turn' : ''} ${isAnimating ? 'animating' : ''}`}
              onClick={() => latestMove && setShowReasoningFor(showReasoningFor === player.id ? null : player.id)}
            >
              <div className="character-body">
                <div className="emoji-face">{getPlayerEmoji(player)}</div>
                <div className="player-name">{player.name}</div>
                <div className="player-status">{getPlayerStatus(player)}</div>
                <div className="move-count">Moves: {player.move_count}</div>
                
                {latestMove && (
                  <div className="latest-move">
                    <div className="move-text">"{latestMove.person}"</div>
                    <div className="category-text">No more {latestMove.category}</div>
                  </div>
                )}
                
                {player.elimination_reason && (
                  <div className="elimination-reason">
                    💀 {player.elimination_reason}
                  </div>
                )}
              </div>
              
              {/* Reasoning Trace Popup */}
              {showReasoningFor === player.id && latestMove && (
                <div className="reasoning-popup">
                  <div className="reasoning-header">🧠 Reasoning</div>
                  <div className="reasoning-text">{latestMove.reasoning}</div>
                  {latestMove.violations && latestMove.violations.length > 0 && (
                    <div className="violations">
                      <div className="violations-header">⚠️ Violations:</div>
                      {latestMove.violations.map((violation, idx) => (
                        <div key={idx} className="violation">{violation}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Game Info Sidebar */}
      <div className="game-info">
        <div className="info-section">
          <h3>🎯 Game Status</h3>
          <div className="stat">Turn: {gameState.turn_number}</div>
          <div className="stat">Active: {gameState.players.filter(p => p.active).length}/4</div>
          {gameState.game_over && gameState.players.find(p => p.active) && (
            <div className="winner">🏆 Winner: {gameState.players.find(p => p.active).name}</div>
          )}
        </div>

        <div className="info-section">
          <h3>🚫 Banned Categories ({gameState.banned_categories.length})</h3>
          <div className="banned-list">
            {gameState.banned_categories.slice(-8).map((cat, idx) => (
              <div key={idx} className="banned-item">
                <span className="category-name">{cat.category}</span>
                <span className="banned-by">via {cat.banned_by}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h3>📜 Recent Moves</h3>
          <div className="moves-list">
            {gameState.moves.slice(-5).map((move, idx) => (
              <div key={idx} className={`move-item ${!move.valid ? 'invalid' : ''}`}>
                <div className="move-player">Player {move.player_id}</div>
                <div className="move-details">"{move.person}" - no more {move.category}</div>
                {!move.valid && <div className="move-violation">❌ ELIMINATED</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .game-arena {
          display: flex;
          gap: 30px;
          min-height: 600px;
          background: linear-gradient(135deg, #ff6b35, #f7931e, #ff6b35);
          padding: 20px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
        }

        .player-arena {
          flex: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: center;
          justify-items: center;
          position: relative;
        }

        .player-character {
          position: relative;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-origin: center;
        }

        .player-character.current-turn {
          transform: scale(1.2) translateY(-10px);
          z-index: 10;
        }

        .player-character.animating {
          animation: playerHighlight 0.8s ease-in-out;
        }

        @keyframes playerHighlight {
          0% { transform: scale(1); }
          25% { transform: scale(1.3) translateY(-15px) rotate(5deg); }
          50% { transform: scale(1.4) translateY(-20px) rotate(-5deg); }
          75% { transform: scale(1.3) translateY(-15px) rotate(3deg); }
          100% { transform: scale(1.2) translateY(-10px) rotate(0deg); }
        }

        .character-body {
          background: linear-gradient(145deg, #fff, #ffe8e0);
          border: 4px solid #ff6b35;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
          min-width: 200px;
          position: relative;
          overflow: visible;
        }

        .player-character.current-turn .character-body {
          border-color: #ff4500;
          background: linear-gradient(145deg, #fff5f0, #ffe8e0);
          box-shadow: 0 0 30px rgba(255, 69, 0, 0.6), 0 8px 25px rgba(255, 107, 53, 0.4);
        }

        .player-character.eliminated .character-body {
          background: linear-gradient(145deg, #f5f5f5, #e0e0e0);
          border-color: #999;
          opacity: 0.6;
          filter: grayscale(0.8);
        }

        .emoji-face {
          font-size: 3rem;
          margin-bottom: 10px;
          display: block;
          animation: float 3s ease-in-out infinite;
        }

        .player-character.current-turn .emoji-face {
          animation: bounce 0.6s ease-in-out infinite alternate;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes bounce {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-8px) scale(1.1); }
        }

        .player-name {
          font-weight: bold;
          font-size: 1.1rem;
          color: #d63031;
          margin-bottom: 5px;
        }

        .player-status {
          font-size: 0.9rem;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .player-character:not(.eliminated) .player-status {
          background: #ff6b35;
          color: white;
        }

        .player-character.current-turn .player-status {
          background: #ff4500;
          color: white;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .player-character.eliminated .player-status {
          background: #999;
          color: white;
        }

        .move-count {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 10px;
        }

        .latest-move {
          background: rgba(255, 107, 53, 0.1);
          border-radius: 8px;
          padding: 8px;
          margin-top: 10px;
          border-left: 3px solid #ff6b35;
        }

        .move-text {
          font-weight: bold;
          color: #d63031;
          font-size: 0.9rem;
        }

        .category-text {
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        }

        .elimination-reason {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 6px;
          padding: 6px;
          margin-top: 8px;
          font-size: 0.8rem;
          color: #dc3545;
        }

        .reasoning-popup {
          position: absolute;
          top: -10px;
          left: 110%;
          background: white;
          border: 2px solid #ff6b35;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          width: 320px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 100;
          animation: popIn 0.3s ease-out;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8) translateX(-10px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }

        .reasoning-header {
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 8px;
          border-bottom: 1px solid #ffe8e0;
          padding-bottom: 4px;
        }

        .reasoning-text {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #333;
          margin-bottom: 10px;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 200px;
          overflow-y: auto;
          padding: 8px;
          background: rgba(255, 107, 53, 0.05);
          border-radius: 6px;
        }

        .violations {
          background: rgba(220, 53, 69, 0.1);
          border-radius: 6px;
          padding: 8px;
        }

        .violations-header {
          font-weight: bold;
          color: #dc3545;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }

        .violation {
          font-size: 0.8rem;
          color: #dc3545;
          margin-left: 10px;
        }

        .game-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-section {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 15px;
          padding: 20px;
          border: 2px solid rgba(255, 107, 53, 0.3);
        }

        .info-section h3 {
          margin: 0 0 15px 0;
          color: #d63031;
          font-size: 1.1rem;
        }

        .stat {
          padding: 5px 0;
          font-weight: 500;
          color: #333;
        }

        .winner {
          background: linear-gradient(45deg, #ff6b35, #f7931e);
          color: white;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          margin-top: 10px;
          animation: celebrate 2s ease-in-out infinite;
        }

        @keyframes celebrate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .banned-list, .moves-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .banned-item {
          padding: 8px;
          border-bottom: 1px solid #ffe8e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-name {
          font-weight: 500;
          color: #d63031;
        }

        .banned-by {
          font-size: 0.8rem;
          color: #666;
        }

        .move-item {
          padding: 8px;
          border-bottom: 1px solid #ffe8e0;
          border-left: 3px solid #ff6b35;
          margin-bottom: 5px;
          border-radius: 0 6px 6px 0;
        }

        .move-item.invalid {
          border-left-color: #dc3545;
          background: rgba(220, 53, 69, 0.05);
        }

        .move-player {
          font-weight: bold;
          font-size: 0.8rem;
          color: #ff6b35;
        }

        .move-details {
          font-size: 0.9rem;
          color: #333;
          margin: 2px 0;
        }

        .move-violation {
          font-size: 0.8rem;
          color: #dc3545;
          font-weight: bold;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .game-arena {
            flex-direction: column;
          }
          
          .player-arena {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .reasoning-popup {
            left: -160px;
            top: 110%;
            width: 280px;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
