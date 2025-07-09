import { useState, useEffect } from 'react';

export default function GameBoard({ gameState, darkMode: parentDarkMode }) {
  const [animatingPlayer, setAnimatingPlayer] = useState(null);
  const [showReasoningFor, setShowReasoningFor] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [darkMode, setDarkMode] = useState(parentDarkMode || false);

  // Sync with parent dark mode
  useEffect(() => {
    if (parentDarkMode !== undefined) {
      setDarkMode(parentDarkMode);
    }
  }, [parentDarkMode]);

  // Trigger animation when current player changes
  useEffect(() => {
    if (gameState.current_player) {
      setAnimatingPlayer(gameState.current_player);
      const timer = setTimeout(() => setAnimatingPlayer(null), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState.current_player]);

  const getPlayerEmoji = (player) => {
    if (player.is_human) return '🎮';
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
    <div className={`game-arena ${darkMode ? 'dark' : ''}`}>
      {/* Floating Rules Button */}
      <div className="rules-float-container">
        <button 
          className="rules-float-button"
          onMouseEnter={() => setShowRules(true)}
          onMouseLeave={() => setShowRules(false)}
        >
          📖 Rules
        </button>
        {showRules && (
          <div className="rules-tooltip">
            <div className="rules-tooltip-header">🎯 Game Rules</div>
            <div className="rules-list">
              <div className="rule-line">
                <span className="rule-number">1</span>
                <span className="rule-desc">Name a real, famous person</span>
              </div>
              <div className="rule-line">
                <span className="rule-number">2</span>
                <span className="rule-desc">Declare ONE category they belong to</span>
              </div>
              <div className="rule-line">
                <span className="rule-number">3</span>
                <span className="rule-desc">That category becomes permanently banned</span>
              </div>
              <div className="rule-line">
                <span className="rule-number">4</span>
                <span className="rule-desc">Don't name anyone from banned categories</span>
              </div>
              <div className="rule-line">
                <span className="rule-number">5</span>
                <span className="rule-desc">Last player standing wins!</span>
              </div>
            </div>
            <div className="rules-tip">
              💡 <strong>Tip:</strong> Be creative with categories!
            </div>
          </div>
        )}
      </div>

      {/* Main Player Arena */}
      <div className="player-arena">
        {gameState.players.map(player => {
          const isCurrentPlayer = gameState.current_player === player.id;
          const isAnimating = animatingPlayer === player.id;
          const latestMove = getLatestMove(player);
          
          return (
            <div 
              key={player.id} 
              className={`player-character ${!player.active ? 'eliminated' : ''} ${isCurrentPlayer ? 'current-turn' : ''} ${isAnimating ? 'animating' : ''} ${player.is_human ? 'human-player' : ''}`}
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
          background: #ffffff;
          padding: 24px;
          margin-top: 20px;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .game-arena.dark {
          background: #1f2937;
          border-color: #374151;
        }



        .player-arena {
          flex: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 20px;
          align-items: center;
          justify-items: center;
          position: relative;
          width: 100%;
          height: 100%;
        }

        .player-character {
          position: relative;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-origin: center;
        }

        .player-character.current-turn {
          transform: scale(1.05) translateY(-2px);
          z-index: 10;
        }

        .player-character.animating {
          animation: playerHighlight 0.6s ease-in-out;
        }

        @keyframes playerHighlight {
          0% { transform: scale(1); }
          50% { transform: scale(1.1) translateY(-4px); }
          100% { transform: scale(1.05) translateY(-2px); }
        }

        .character-body {
          background: #ffffff;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          position: relative;
          overflow: visible;
          transition: all 0.2s ease;
        }

        .game-arena.dark .character-body {
          background: #374151;
          border-color: #4b5563;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .player-character.current-turn .character-body {
          border-color: #333333;
          background: #f8f9fa;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .game-arena.dark .player-character.current-turn .character-body {
          border-color: #6b7280;
          background: #4b5563;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .player-character.eliminated .character-body {
          background: #f8f9fa;
          border-color: #d1d5db;
          opacity: 0.6;
          filter: grayscale(1);
        }

        .game-arena.dark .player-character.eliminated .character-body {
          background: #2d3748;
          border-color: #4a5568;
        }

        .player-character.human-player .character-body {
          border-color: #6b7280;
          background: #ffffff;
        }

        .game-arena.dark .player-character.human-player .character-body {
          border-color: #9ca3af;
          background: #374151;
        }

        .player-character.human-player.current-turn .character-body {
          border-color: #000000;
          background: #f8f9fa;
        }

        .game-arena.dark .player-character.human-player.current-turn .character-body {
          border-color: #d1d5db;
          background: #4b5563;
        }

        .emoji-face {
          font-size: 2.5rem;
          margin-bottom: 12px;
          display: block;
          filter: grayscale(0.8);
        }

        .player-character.current-turn .emoji-face {
          filter: grayscale(0);
        }

        .player-name {
          font-weight: 600;
          font-size: 1rem;
          color: #1f2937;
          margin-bottom: 8px;
          transition: color 0.3s ease;
        }

        .game-arena.dark .player-name {
          color: #f9fafb;
        }

        .player-status {
          font-size: 0.8rem;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .game-arena.dark .player-status {
          background: #2d3748;
          color: #9ca3af;
          border-color: #4a5568;
        }

        .player-character.current-turn .player-status {
          background: #1f2937;
          color: white;
          border-color: #1f2937;
        }

        .game-arena.dark .player-character.current-turn .player-status {
          background: #6b7280;
          color: white;
          border-color: #6b7280;
        }

        .player-character.eliminated .player-status {
          background: #f3f4f6;
          color: #9ca3af;
          border-color: #e5e7eb;
        }

        .game-arena.dark .player-character.eliminated .player-status {
          background: #2d3748;
          color: #6b7280;
          border-color: #4a5568;
        }

        .move-count {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }

        .game-arena.dark .move-count {
          color: #9ca3af;
        }

        .latest-move {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          border-left: 3px solid #e5e7eb;
          border: 1px solid #f3f4f6;
          transition: all 0.3s ease;
        }

        .game-arena.dark .latest-move {
          background: #2d3748;
          border-color: #4a5568;
          border-left-color: #4b5563;
        }

        .move-text {
          font-weight: 500;
          color: #1f2937;
          font-size: 0.9rem;
          margin-bottom: 4px;
          transition: color 0.3s ease;
        }

        .game-arena.dark .move-text {
          color: #f9fafb;
        }

        .category-text {
          font-size: 0.8rem;
          color: #6b7280;
          font-style: italic;
          transition: color 0.3s ease;
        }

        .game-arena.dark .category-text {
          color: #9ca3af;
        }

        .elimination-reason {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 8px;
          margin-top: 8px;
          font-size: 0.8rem;
          color: #dc2626;
        }

        .reasoning-popup {
          position: absolute;
          top: -10px;
          left: 110%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          width: 320px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 100;
          animation: popIn 0.2s ease-out;
          transition: all 0.3s ease;
        }

        .game-arena.dark .reasoning-popup {
          background: #374151;
          border-color: #4b5563;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateX(-5px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }

        .reasoning-header {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .game-arena.dark .reasoning-header {
          color: #f9fafb;
          border-bottom-color: #4b5563;
        }

        .reasoning-text {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #4b5563;
          margin-bottom: 12px;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 200px;
          overflow-y: auto;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .game-arena.dark .reasoning-text {
          color: #d1d5db;
          background: #2d3748;
        }

        .violations {
          background: #fef2f2;
          border-radius: 6px;
          padding: 12px;
          border: 1px solid #fecaca;
        }

        .violations-header {
          font-weight: 600;
          color: #dc2626;
          font-size: 0.8rem;
          margin-bottom: 6px;
        }

        .violation {
          font-size: 0.8rem;
          color: #dc2626;
          margin-left: 12px;
          margin-bottom: 2px;
        }

        .game-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-section {
          background: #ffffff;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .game-arena.dark .info-section {
          background: #374151;
          border-color: #4b5563;
        }

        .info-section h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .game-arena.dark .info-section h3 {
          color: #f9fafb;
        }

        .stat {
          padding: 6px 0;
          font-weight: 400;
          color: #4b5563;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .game-arena.dark .stat {
          color: #d1d5db;
        }

        .winner {
          background: #1f2937;
          color: white;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-top: 12px;
          transition: background-color 0.3s ease;
        }

        .game-arena.dark .winner {
          background: #6b7280;
        }

        .banned-list, .moves-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .banned-item {
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: border-color 0.3s ease;
        }

        .game-arena.dark .banned-item {
          border-bottom-color: #4b5563;
        }

        .category-name {
          font-weight: 500;
          color: #1f2937;
          transition: color 0.3s ease;
        }

        .game-arena.dark .category-name {
          color: #f9fafb;
        }

        .banned-by {
          font-size: 0.8rem;
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .game-arena.dark .banned-by {
          color: #9ca3af;
        }

        .move-item {
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
          border-left: 3px solid #e5e7eb;
          margin-bottom: 6px;
          border-radius: 0 6px 6px 0;
          background: #fafafa;
          transition: all 0.3s ease;
        }

        .game-arena.dark .move-item {
          border-bottom-color: #4b5563;
          border-left-color: #4b5563;
          background: #2d3748;
        }

        .move-item.invalid {
          border-left-color: #dc2626;
          background: #fef2f2;
        }

        .game-arena.dark .move-item.invalid {
          background: #2d1b1b;
        }

        .move-player {
          font-weight: 500;
          font-size: 0.8rem;
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .game-arena.dark .move-player {
          color: #9ca3af;
        }

        .move-details {
          font-size: 0.9rem;
          color: #1f2937;
          margin: 4px 0;
          transition: color 0.3s ease;
        }

        .game-arena.dark .move-details {
          color: #f9fafb;
        }

        .move-violation {
          font-size: 0.8rem;
          color: #dc2626;
          font-weight: 500;
        }

        /* Floating Rules */
        .rules-float-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .rules-float-button {
          background: #1f2937;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #374151;
        }

        .game-arena.dark .rules-float-button {
          background: #374151;
          border-color: #4b5563;
        }

        .rules-float-button:hover {
          background: #374151;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .game-arena.dark .rules-float-button:hover {
          background: #4b5563;
        }

        .rules-tooltip {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          width: 320px;
          animation: fadeInUp 0.2s ease;
          transition: all 0.3s ease;
        }

        .game-arena.dark .rules-tooltip {
          background: #374151;
          border-color: #4b5563;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rules-tooltip-header {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 8px;
          transition: all 0.3s ease;
        }

        .game-arena.dark .rules-tooltip-header {
          color: #f9fafb;
          border-bottom-color: #4b5563;
        }

        .rules-list {
          margin-bottom: 16px;
        }

        .rule-line {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
          padding: 8px 0;
        }

        .rule-number {
          background: #1f2937;
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          flex-shrink: 0;
          transition: background-color 0.3s ease;
        }

        .game-arena.dark .rule-number {
          background: #6b7280;
        }

        .rule-desc {
          color: #4b5563;
          font-size: 0.9rem;
          line-height: 1.4;
          transition: color 0.3s ease;
        }

        .game-arena.dark .rule-desc {
          color: #d1d5db;
        }

        .rules-tip {
          background: #f9fafb;
          color: #4b5563;
          padding: 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          text-align: left;
          line-height: 1.4;
          border-left: 3px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .game-arena.dark .rules-tip {
          background: #2d3748;
          color: #d1d5db;
          border-left-color: #4b5563;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .game-arena {
            flex-direction: column;
            padding: 16px;
          }
          
          .player-arena {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            gap: 15px;
          }
          
          .reasoning-popup {
            left: -160px;
            top: 110%;
            width: 280px;
            max-height: 300px;
          }

          .rules-float-container {
            top: 10px;
            right: 10px;
          }

          .rules-tooltip {
            width: 280px;
            right: -20px;
          }

          .rules-float-button {
            padding: 10px 14px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
