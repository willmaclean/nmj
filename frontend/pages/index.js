import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [darkMode, setDarkMode] = useState(false);

  // API URL configuration based on environment
  const getApiUrl = () => {
    // 1. Explicit override via environment variable (highest priority)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // 2. Auto-detect based on NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'https://backend-pu7w8cumu-set4.vercel.app';
    }
    
    // 3. Default to local development
    return 'http://localhost:8000';
  };
  
  const API_URL = getApiUrl();

  const createGame = async (withHuman = false, playerName = '') => {
    setLoading(true);
    try {
      const requestBody = withHuman 
        ? { human_player_name: playerName || 'You' }
        : {};
        
      const res = await fetch(`${API_URL}/api/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      
      setGameId(data.game_id);
      setGameState(data.game_state);
      setIsHuman(withHuman);
      setShowPlayerSetup(false);
    } catch (error) {
      console.error('Error creating game:', error);
      // Fallback to mock for demo if API fails
      const gameId = 'demo-' + Math.random().toString(36).substr(2, 9);
      const mockGameState = {
        id: gameId,
        players: withHuman ? [playerName || 'You', 'AI Player 1', 'AI Player 2', 'AI Player 3'] : ['AI Player 1', 'AI Player 2', 'AI Player 3', 'AI Player 4'],
        current_turn: 0,
        banned_categories: [],
        moves: [],
        game_over: false
      };
      
      setGameId(gameId);
      setGameState(mockGameState);
      setIsHuman(withHuman);
      setShowPlayerSetup(false);
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
      setWaitingForHuman(data.waiting_for_human || false);
      
      // Log the move
      if (data.move) {
        console.log(`${data.move.player_id}: ${data.move.person} - no more ${data.move.category}`);
        if (!data.valid) {
          console.log(`ELIMINATED! Violations: ${data.violations.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error playing turn:', error);
      // Fallback to mock behavior if API fails
      const currentPlayer = gameState.players[gameState.current_turn];
      const mockPersons = ['Albert Einstein', 'Marie Curie', 'Leonardo da Vinci', 'Shakespeare', 'Mozart'];
      const mockCategories = ['Scientists', 'Nobel Prize Winners', 'Renaissance Artists', 'Playwrights', 'Composers'];
      
      const randomPerson = mockPersons[Math.floor(Math.random() * mockPersons.length)];
      const randomCategory = mockCategories[Math.floor(Math.random() * mockCategories.length)];
      
      const mockMove = {
        player_id: currentPlayer,
        person: randomPerson,
        category: randomCategory,
        reasoning: `${randomPerson} is a famous ${randomCategory.toLowerCase().slice(0, -1)}`
      };
      
      const newGameState = {
        ...gameState,
        moves: [...gameState.moves, mockMove],
        banned_categories: [...gameState.banned_categories, randomCategory],
        current_turn: (gameState.current_turn + 1) % gameState.players.length
      };
      
      setGameState(newGameState);
      setWaitingForHuman(false);
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
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Dark Mode Toggle */}
      <div className="dark-mode-toggle">
        <button 
          className="toggle-button"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <header className="app-header">
        <nav className="header-nav">
          <Link href="/about" className="about-link">About</Link>
        </nav>
        <h1>No More Jockeys - AI Battle</h1>
        <p>Watch AI agents compete or join the battle yourself!</p>
      </header>
      
      {!gameId ? (
        <>
          {!showPlayerSetup ? (
            <div className="start-screen">
              <div className="start-card">

                
                {/* Game Rules Section */}
                <div className="rules-section">
                  <h3>How to Play</h3>
                  <ul className="rules-list">
                    <li><strong>Name a Person</strong> - Choose any real, famous person</li>
                    <li><strong>Declare Category</strong> - State ONE category they belong to</li>
                    <li><strong>Category Banned</strong> - That category becomes off-limits forever</li>
                    <li><strong>Don't Violate</strong> - Avoid naming anyone from banned categories</li>
                  </ul>
                  
                  <div className="strategy-tip">
                    <strong>Strategy Tip:</strong> Be creative with categories! Instead of "actors" try "people who have been in a Woody Allen film"
                  </div>
                </div>
                <h3>Choose your game mode:</h3>
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
          
          {gameState && <GameBoard gameState={gameState} darkMode={darkMode} />}
        </>
      )}
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #ffffff;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 0.3s ease;
        }

        .app-container.dark {
          background: #111827;
        }

        /* Dark Mode Toggle */
        .dark-mode-toggle {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
        }

        .toggle-button {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .app-container.dark .toggle-button {
          background: #374151;
          border-color: #4b5563;
          color: white;
        }

        .toggle-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .app-header {
          text-align: center;
          padding: 40px 20px;
          background: #ffffff;
          border-bottom: 1px solid #f3f4f6;
          transition: all 0.3s ease;
          position: relative;
        }

        .app-container.dark .app-header {
          background: #111827;
          border-bottom-color: #374151;
        }

        .app-header h1 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          font-weight: 700;
          color: #1f2937;
          transition: color 0.3s ease;
        }

        .app-container.dark .app-header h1 {
          color: #f9fafb;
        }

        .app-header p {
          font-size: 1.1rem;
          margin: 0;
          color: #6b7280;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        .app-container.dark .app-header p {
          color: #9ca3af;
        }

        .header-nav {
          position: absolute;
          top: 20px;
          right: 20px;
        }

        .about-link {
          color: #0066cc;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .about-link:hover {
          color: #0052cc;
          text-decoration: underline;
        }

        .app-container.dark .about-link {
          color: #66b3ff;
        }

        .app-container.dark .about-link:hover {
          color: #99ccff;
        }

        .start-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 40px 20px;
        }

        .start-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          max-width: 600px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .app-container.dark .start-card {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .start-card h2 {
          color: #1f2937;
          font-size: 1.5rem;
          margin: 0 0 12px 0;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .app-container.dark .start-card h2 {
          color: #f9fafb;
        }

        .start-card p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0 0 24px 0;
          line-height: 1.5;
          transition: color 0.3s ease;
        }

        .app-container.dark .start-card p {
          color: #9ca3af;
        }

        .start-card h3 {
          color: #1f2937;
          font-size: 1.25rem;
          margin: 0 0 20px 0;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .app-container.dark .start-card h3 {
          color: #f9fafb;
        }

        .rules-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 24px;
          margin: 20px 0 30px 0;
          border: 1px solid #f3f4f6;
          text-align: left;
          transition: all 0.3s ease;
        }

        .app-container.dark .rules-section {
          background: #374151;
          border-color: #4b5563;
        }

        .rules-section h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .app-container.dark .rules-section h3 {
          color: #f9fafb;
        }

        .rules-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
          text-align: left;
        }

        .rules-list li {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          line-height: 1.5;
          text-align: left;
          color: #4b5563;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .app-container.dark .rules-list li {
          color: #d1d5db;
        }

        .rules-list li::before {
          content: '•';
          color: #1f2937;
          font-size: 1.2em;
          font-weight: bold;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.3s ease;
        }

        .app-container.dark .rules-list li::before {
          color: #9ca3af;
        }

        .rules-list li strong {
          color: #1f2937;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .app-container.dark .rules-list li strong {
          color: #f9fafb;
        }

        .strategy-tip {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #4b5563;
          padding: 12px;
          border-radius: 6px;
          text-align: left;
          font-size: 0.85rem;
          line-height: 1.4;
          border-left: 3px solid #9ca3af;
          transition: all 0.3s ease;
        }

        .app-container.dark .strategy-tip {
          background: #2d3748;
          border-color: #4a5568;
          color: #d1d5db;
          border-left-color: #6b7280;
        }

        .game-mode-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .mode-button {
          background: #ffffff;
          color: #1f2937;
          border: 2px solid #e5e7eb;
          padding: 20px;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          text-align: left;
        }

        .app-container.dark .mode-button {
          background: #374151;
          color: #f9fafb;
          border-color: #4b5563;
        }

        .mode-button:hover:not(:disabled) {
          border-color: #1f2937;
          background: #f9fafb;
        }

        .app-container.dark .mode-button:hover:not(:disabled) {
          border-color: #6b7280;
          background: #4b5563;
        }

        .mode-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mode-description {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        .app-container.dark .mode-description {
          color: #9ca3af;
        }

        .player-name-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          margin-bottom: 20px;
          box-sizing: border-box;
          background: #ffffff;
          color: #1f2937;
        }

        .player-name-input:focus {
          outline: none;
          border-color: #1f2937;
        }

        .setup-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .back-button {
          background: #ffffff;
          color: #6b7280;
          border: 2px solid #e5e7eb;
          padding: 10px 20px;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-button:hover:not(:disabled) {
          border-color: #9ca3af;
          color: #1f2937;
        }

        .human-turn {
          background: #ffffff;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          text-align: center;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .human-turn h2 {
          color: #1f2937;
          margin: 0 0 12px 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .human-turn p {
          color: #6b7280;
          margin: 0 0 24px 0;
          font-size: 1rem;
        }

        .human-move-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 400px;
          margin: 0 auto;
        }

        .move-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          box-sizing: border-box;
          background: #ffffff;
          color: #1f2937;
        }

        .move-input:focus {
          outline: none;
          border-color: #1f2937;
        }

        .submit-move-button {
          background: #1f2937;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-move-button:hover:not(:disabled) {
          background: #374151;
        }

        .submit-move-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .start-button {
          background: #1f2937;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-button:hover:not(:disabled) {
          background: #374151;
        }

        .start-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .control-button {
          background: #1f2937;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .control-button:hover:not(:disabled) {
          background: #374151;
        }

        .control-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auto-play-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid #e5e7eb;
        .auto-play-toggle:hover {
          border-color: #9ca3af;
        }

        .auto-play-toggle input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .toggle-text {
          font-weight: 500;
          color: #1f2937;
          cursor: pointer;
          font-size: 0.9rem;
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

          .rules-list li {
            margin-bottom: 10px;
            padding-left: 18px;
            text-align: left;
          }
          
          .rules-section {
            padding: 20px;
            margin: 15px 0 25px 0;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
