import { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';

export default function Home() {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [humanPlayerName, setHumanPlayerName] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [waitingForHuman, setWaitingForHuman] = useState(false);
  const [humanMove, setHumanMove] = useState({ person: '', category: '' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const createGame = async (withHuman = false, playerName = '') => {
    setLoading(true);
    try {
      const requestBody = withHuman ? { human_player_name: playerName } : {};
      const res = await fetch(`${API_URL}/api/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      setGameId(data.game_id);
      setGameState(data.game_state);
      setIsHuman(data.has_human);
      setShowPlayerSetup(false);
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
      
      if (data.waiting_for_human) {
        setWaitingForHuman(true);
        setGameState(data.game_state);
      } else {
        setGameState(data.game_state);
        setWaitingForHuman(false);
        
        // Log the move
        console.log(`Player ${data.move.player_id}: ${data.move.person} - no more ${data.move.category}`);
        if (!data.valid) {
          console.log(`ELIMINATED! Violations: ${data.violations.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error playing turn:', error);
    }
    setLoading(false);
  };

  const makeHumanMove = async () => {
    if (!gameId || !humanMove.person || !humanMove.category || loading) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/human-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          person: humanMove.person,
          category: humanMove.category,
          reasoning: `I chose ${humanMove.person} because they are associated with ${humanMove.category}`
        }),
      });
      const data = await res.json();
      setGameState(data.game_state);
      setWaitingForHuman(false);
      setHumanMove({ person: '', category: '' });
      
      // Log the move
      console.log(`You: ${data.move.person} - no more ${data.move.category}`);
      if (!data.valid) {
        console.log(`ELIMINATED! Violations: ${data.violations.join(', ')}`);
      }
    } catch (error) {
      console.error('Error making human move:', error);
    }
    setLoading(false);
  };

  // Auto-play functionality (but not when waiting for human)
  useEffect(() => {
    if (autoPlay && gameState && !gameState.game_over && !loading && !waitingForHuman) {
      const timer = setTimeout(playTurn, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, gameState, loading, waitingForHuman]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎭 No More Jockeys - AI Battle</h1>
        <p>Watch AI agents compete or join the battle yourself!</p>
      </header>
      
      {!gameId ? (
        <>
          {!showPlayerSetup ? (
            <div className="start-screen">
              <div className="start-card">
                <h2>Ready to Begin?</h2>
                <p>Choose your game mode:</p>
                <div className="game-mode-buttons">
                  <button 
                    className="mode-button ai-mode" 
                    onClick={() => createGame(false)} 
                    disabled={loading}
                  >
                    {loading ? '🤖 Initializing...' : '🤖 Watch AI Battle'}
                    <span className="mode-description">Four AI agents compete</span>
                  </button>
                  <button 
                    className="mode-button human-mode" 
                    onClick={() => setShowPlayerSetup(true)}
                    disabled={loading}
                  >
                    🎮 Join the Battle
                    <span className="mode-description">Play against 3 AI agents</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="start-screen">
              <div className="start-card">
                <h2>Join the Game</h2>
                <p>Enter your name to play against three AI agents:</p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={humanPlayerName}
                  onChange={(e) => setHumanPlayerName(e.target.value)}
                  className="player-name-input"
                  maxLength={20}
                />
                <div className="setup-buttons">
                  <button 
                    className="start-button" 
                    onClick={() => createGame(true, humanPlayerName)}
                    disabled={loading || !humanPlayerName.trim()}
                  >
                    {loading ? '🚀 Starting...' : '🚀 Start Game'}
                  </button>
                  <button 
                    className="back-button" 
                    onClick={() => setShowPlayerSetup(false)}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {waitingForHuman ? (
            <div className="human-turn">
              <h2>🎮 Your Turn!</h2>
              <p>Name a person and choose a category to ban:</p>
              <div className="human-move-form">
                <input
                  type="text"
                  placeholder="Person's name (e.g., Barack Obama)"
                  value={humanMove.person}
                  onChange={(e) => setHumanMove({...humanMove, person: e.target.value})}
                  className="move-input"
                />
                <input
                  type="text"
                  placeholder="Category (e.g., US Presidents)"
                  value={humanMove.category}
                  onChange={(e) => setHumanMove({...humanMove, category: e.target.value})}
                  className="move-input"
                />
                <button 
                  className="submit-move-button" 
                  onClick={makeHumanMove}
                  disabled={loading || !humanMove.person.trim() || !humanMove.category.trim()}
                >
                  {loading ? '🤔 Thinking...' : '✨ Make Move'}
                </button>
              </div>
            </div>
          ) : (
            <div className="controls">
              <button 
                className="control-button" 
                onClick={playTurn} 
                disabled={loading || gameState?.game_over}
              >
                {loading ? '🤔 Thinking...' : '⚡ Next Turn'}
              </button>
              {!isHuman && (
                <label className="auto-play-toggle">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                  />
                  <span className="toggle-text">🔄 Auto-play</span>
                </label>
              )}
            </div>
          )}
          
          {gameState && <GameBoard gameState={gameState} />}
        </>
      )}
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #ff8a65, #ff7043, #ff5722);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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

        .game-mode-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
        }

        .mode-button {
          background: linear-gradient(45deg, #ff6b35, #f7931e);
          color: white;
          border: none;
          padding: 20px 30px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .mode-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.6);
        }

        .mode-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .mode-description {
          font-size: 0.9rem;
          opacity: 0.9;
          font-weight: normal;
        }

        .player-name-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #ff6b35;
          border-radius: 10px;
          font-size: 1.1rem;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        .player-name-input:focus {
          outline: none;
          border-color: #d63031;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
        }

        .setup-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .back-button {
          background: #666;
          color: white;
          border: none;
          padding: 12px 25px;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover:not(:disabled) {
          background: #555;
          transform: translateY(-2px);
        }

        .human-turn {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: 3px solid #ff6b35;
        }

        .human-turn h2 {
          color: #d63031;
          margin: 0 0 15px 0;
          font-size: 1.8rem;
        }

        .human-turn p {
          color: #666;
          margin: 0 0 25px 0;
          font-size: 1.1rem;
        }

        .human-move-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-width: 400px;
          margin: 0 auto;
        }

        .move-input {
          padding: 15px;
          border: 2px solid #ff6b35;
          border-radius: 10px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .move-input:focus {
          outline: none;
          border-color: #d63031;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
        }

        .submit-move-button {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }

        .submit-move-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.6);
        }

        .submit-move-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
