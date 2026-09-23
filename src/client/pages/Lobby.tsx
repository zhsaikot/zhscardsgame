import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';

// SVG Shield with Lion Crest (Team A)
const LionShieldIcon = () => (
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 1L2 4.5V13C2 19.5 6.3 25.5 12 27C17.7 25.5 22 19.5 22 13V4.5L12 1Z"
      fill="#0c2e24"
      stroke="#34d399"
      strokeWidth="1.5"
    />
    {/* Lion silhouette / crown emblem */}
    <path
      d="M12 7L13.5 10H16L14 12L15 15L12 13.5L9 15L10 12L8 10H10.5L12 7Z"
      fill="#6ee7b7"
    />
    <circle cx="12" cy="18" r="1.5" fill="#34d399" />
  </svg>
);

// SVG Shield with Griffin / Eagle Crest (Team B)
const GriffinShieldIcon = () => (
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 1L2 4.5V13C2 19.5 6.3 25.5 12 27C17.7 25.5 22 19.5 22 13V4.5L12 1Z"
      fill="#29121a"
      stroke="#f87171"
      strokeWidth="1.5"
    />
    {/* Eagle / Griffin wings emblem */}
    <path
      d="M12 8L15 11L13 13L16 16L12 14L8 16L11 13L9 11L12 8Z"
      fill="#fca5a5"
    />
    <circle cx="12" cy="18" r="1.5" fill="#f87171" />
  </svg>
);

const Lobby: React.FC = () => {
  const { createGame, joinGame, startSoloGame } = useGameStore();
  const [username, setUsername] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartSolo = async () => {
    const finalName = username.trim() || 'Player 1';
    setLoading(true);
    setError('');

    try {
      await startSoloGame(finalName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch solo match');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMultiplayer = async () => {
    if (!username.trim()) {
      setError('Please enter your player alias first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createGame(username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!username.trim()) {
      setError('Please enter your player alias first');
      return;
    }

    if (!gameIdInput.trim()) {
      setError('Please enter a room / table ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinGame(gameIdInput.trim(), username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby-wrapper">
      {/* Background Sacred Geometry & Floating Suits */}
      <div className="bg-geometry-mandala" />
      <div className="bg-floating-suits">
        <span className="suit-float float-1">♠</span>
        <span className="suit-float float-2">♣</span>
        <span className="suit-float float-3">♦</span>
        <span className="suit-float float-4">♥</span>
      </div>

      <div className="lobby-container-modern">
        {/* Header exact match to user reference */}
        <header className="lobby-header-sleek">
          <div className="room-nav-title">&lt; ROYAL EMERALD CARD ROOM &gt;</div>
          <div className="emblem-29-container">
            <span className="emblem-diamond top">✦</span>
            <span className="emblem-diamond left">✦</span>
            <h1 className="emblem-29-numeral">29</h1>
            <span className="emblem-diamond right">✦</span>
            <span className="emblem-diamond bottom">✦</span>
          </div>
          <p className="room-subtitle-sleek">HIGH-STAKES MULTIPLAYER CARD GAME</p>
        </header>

        {/* Main Card with sharp rectangular styling & subtle glowing border */}
        <div className="card-box-sleek">
          <div className="card-corner-badge">✦</div>

          {/* Alias Input */}
          <div className="input-group-sleek">
            <label className="input-label-sleek" htmlFor="player-alias">
              YOUR PLAYER ALIAS
            </label>
            <input
              id="player-alias"
              type="text"
              className="input-field-glowing"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Maverick, Royale, Ace"
              disabled={loading}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleStartSolo()}
            />
          </div>

          {/* Action Buttons */}
          <div className="actions-stack">
            {/* Solo Mode Button (Player requested single-player vs bots) */}
            <button
              className="btn-emerald-sleek"
              onClick={handleStartSolo}
              disabled={loading}
              title="Play immediately against 3 smart AI bots"
            >
              <span>♦</span>
              <span>{loading ? 'Launching Match...' : 'Play Solo vs AI Bots'}</span>
            </button>

            {/* Multiplayer Create Table */}
            <button
              className="btn-emerald-sleek secondary-emerald"
              onClick={handleCreateMultiplayer}
              disabled={loading}
              title="Create a table for you and friends"
            >
              <span>♦</span>
              <span>Create New Table</span>
            </button>

            {/* Divider */}
            <div className="divider-sleek">
              <span>— OR JOIN AN EXISTING TABLE —</span>
            </div>

            {/* Join Table Section */}
            <div className="join-row-sleek">
              <input
                type="text"
                className="input-field-subtle"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                placeholder="Enter Room / Table ID"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <button
                className="btn-join-gold"
                onClick={handleJoinGame}
                disabled={loading}
              >
                Join Table
              </button>
            </div>
          </div>

          {error && <div className="error-toast-sleek">{error}</div>}

          {/* Table Seating Arrangement (Hexagon Pattern Container) */}
          <div className="seating-section-sleek">
            <div className="seating-title-sleek">TABLE SEATING ARRANGEMENT</div>
            <div className="seating-grid-sleek">
              {/* Seat 1 (South) */}
              <div className="seat-pod-sleek team-a-glow">
                <div className="shield-box team-a">
                  <LionShieldIcon />
                </div>
                <div className="seat-info-texts">
                  <div className="seat-main-text">Seat 1 (South)</div>
                  <div className="seat-sub-text">Team A (Partner: Seat 3)</div>
                </div>
              </div>

              {/* Seat 2 (West) */}
              <div className="seat-pod-sleek team-b-glow">
                <div className="shield-box team-b">
                  <GriffinShieldIcon />
                </div>
                <div className="seat-info-texts">
                  <div className="seat-main-text">Seat 2 (West)</div>
                  <div className="seat-sub-text">Team B (Partner: Seat 4)</div>
                </div>
              </div>

              {/* Seat 3 (North) */}
              <div className="seat-pod-sleek team-a-glow">
                <div className="shield-box team-a">
                  <LionShieldIcon />
                </div>
                <div className="seat-info-texts">
                  <div className="seat-main-text">Seat 3 (North)</div>
                  <div className="seat-sub-text">Team A (Partner: Seat 1)</div>
                </div>
              </div>

              {/* Seat 4 (East) */}
              <div className="seat-pod-sleek team-b-glow">
                <div className="shield-box team-b">
                  <GriffinShieldIcon />
                </div>
                <div className="seat-info-texts">
                  <div className="seat-main-text">Seat 4 (East)</div>
                  <div className="seat-sub-text">Team B (Partner: Seat 2)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
