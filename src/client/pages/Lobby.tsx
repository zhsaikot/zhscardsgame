import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';

const Lobby: React.FC = () => {
  const { createGame, joinGame } = useGameStore();
  const [username, setUsername] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameId = await createGame(username);
      console.log('Game created:', gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!gameIdInput.trim()) {
      setError('Please enter a game ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinGame(gameIdInput, username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1 className="logo">29</h1>
        <p className="subtitle">Premium Card Game</p>
      </div>

      <div className="lobby-content">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={handleCreateGame}
            disabled={loading || !username.trim()}
          >
            {loading ? 'Creating...' : 'Create Game'}
          </button>

          <div className="join-section">
            <input
              type="text"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              placeholder="Enter Game ID"
              disabled={loading}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoinGame}
              disabled={loading || !username.trim() || !gameIdInput.trim()}
            >
              Join Game
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="lobby-info">
          <h3>How to Play</h3>
          <ul>
            <li>4 players form 2 teams (seats 1+3 vs 2+4)</li>
            <li>32 cards: J, 9, A, 10, K, Q, 8, 7 in each suit</li>
            <li>Bid 16-28 points, highest bidder chooses trump</li>
            <li>Win tricks to earn points (J=3, 9=2, A=1, 10=1)</li>
            <li>Final trick bonus: +1 point</li>
            <li>Total: 29 points per round</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
