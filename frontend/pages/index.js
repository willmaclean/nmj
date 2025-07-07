import { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';

export default function Home() {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-backend.vercel.app' 
    : 'http://localhost:8000';

  const createGame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/create`, {
        method: 'POST',
      });
      const data = await res.json();
      setGameId(data.game_id);
      setGameState(data.game_state);
    } catch (error) {
      console.error('Error creating game:', error);
    }
    setLoading(false);
  };

  const playTurn = async () => {
    if (!gameId || loading) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId }),
      });
      const data = await res.json();
      setGameState(data.game_state);
      
      // Log the move
      console.log(`Player ${data.move.player_id}: ${data.move.person} - no more ${data.move.category}`);
      if (!data.valid) {
        console.log(`ELIMINATED! Violations: ${data.violations.join(', ')}`);
      }
    } catch (error) {
      console.error('Error playing turn:', error);
    }
    setLoading(false);
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && gameState && !gameState.game_over && !loading) {
      const timer = setTimeout(playTurn, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, gameState, loading]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎭 No More Jockeys - LLM Battle</h1>
        <p>Watch AI agents compete in the ultimate naming game!</p>
      </header>
      
      {!gameId ? (
        <div className="start-screen">
          <div className="start-card">
            <h2>Ready to Begin?</h2>
            <p>Four AI agents will battle it out in a game of wit and knowledge!</p>
            <button className="start-button" onClick={createGame} disabled={loading}>
              {loading ? '🤖 Initializing...' : '🚀 Start New Game'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="controls">
            <button 
              className="control-button" 
              onClick={playTurn} 
              disabled={loading || gameState?.game_over}
            >
              {loading ? '🤔 Thinking...' : '⚡ Next Turn'}
            </button>
            <label className="auto-play-toggle">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
              />
              <span className="toggle-text">🔄 Auto-play</span>
            </label>
          </div>
          
          {gameState && <GameBoard gameState={gameState} />}
        </>
      )}
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #ff8a65, #ff7043, #ff5722);
          padding: 20px;
        }

        .app-header {
          text-align: center;
          margin-bottom: 30px;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .app-header h1 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          font-weight: bold;
        }

        .app-header p {
          font-size: 1.2rem;
          margin: 0;
          opacity: 0.9;
        }

        .start-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .start-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          max-width: 500px;
          border: 3px solid #ff6b35;
        }

        .start-card h2 {
          color: #d63031;
          font-size: 2rem;
          margin: 0 0 15px 0;
        }

        .start-card p {
          color: #666;
          font-size: 1.1rem;
          margin: 0 0 30px 0;
          line-height: 1.5;
        }

        .start-button {
          background: linear-gradient(45deg, #ff6b35, #f7931e);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.2rem;
          font-weight: bold;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
        }

        .start-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.6);
        }

        .start-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .control-button {
          background: linear-gradient(45deg, #ff6b35, #f7931e);
          color: white;
          border: none;
          padding: 12px 25px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
          min-width: 150px;
        }

        .control-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.6);
        }

        .control-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auto-play-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 107, 53, 0.3);
        }

        .auto-play-toggle:hover {
          background: white;
          border-color: #ff6b35;
        }

        .auto-play-toggle input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .toggle-text {
          font-weight: 500;
          color: #d63031;
          cursor: pointer;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .app-header h1 {
            font-size: 2rem;
          }
          
          .app-header p {
            font-size: 1rem;
          }
          
          .start-card {
            margin: 0 10px;
            padding: 30px 20px;
          }
          
          .controls {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
}
