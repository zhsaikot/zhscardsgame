import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { getSavedAvatar } from '../utils/avatar';

const Lobby: React.FC = () => {
  const { createGame, joinGame, startSoloGame } = useGameStore();
  const [username, setUsername] = useState('');
  const [gameIdInput, setGameIdInput] = useState('');
  const [avatar, setAvatar] = useState<string>(getSavedAvatar());
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartSolo = async () => {
    const finalName = username.trim() || 'Player 1';
    setLoading(true);
    setError('');

    try {
      await startSoloGame(finalName, avatar);
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
      await createGame(username.trim(), avatar);
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
      await joinGame(gameIdInput.trim(), username.trim(), avatar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="navy-green-lobby-viewport">
      {/* Background Floating Card Suit Emblems */}
      <div className="bg-floating-suits">
        <span className="suit-float float-1">♠</span>
        <span className="suit-float float-2">♥</span>
        <span className="suit-float float-3">♦</span>
        <span className="suit-float float-4">♣</span>
      </div>

      <div className="navy-green-lobby-container">
        {/* Header matching Navy Blue & Emerald Green theme */}
        <header className="navy-green-lobby-header">
          <div className="header-eyebrow">
            <span className="eyebrow-suit green">♣</span>
            <span className="eyebrow-text">ROYAL 29 CARD ARENA</span>
            <span className="eyebrow-suit navy">♠</span>
          </div>

          <div className="emblem-29-wrap">
            <h1 className="emblem-29-emerald">29</h1>
          </div>

          <p className="navy-green-lobby-subtitle">CLASSIC TRICK-TAKING PARTNERSHIP GAME</p>
        </header>

        {/* Main Midnight Navy & Emerald Plaque Card */}
        <div className="navy-green-lobby-card">
          {/* Profile Avatar Selection Row */}
          <div
            className="lobby-avatar-picker-bar"
            onClick={() => setShowAvatarModal(true)}
            title="Click to customize or upload your avatar"
          >
            <div className="avatar-emerald-ring">
              <img src={avatar} alt="Profile Avatar" className="avatar-img-circle" />
              <span className="avatar-edit-badge">📷</span>
            </div>
            <div className="avatar-text-block">
              <span className="avatar-title">PLAYER PROFILE AVATAR</span>
              <span className="avatar-subtitle">Click to choose or upload photo</span>
            </div>
          </div>

          {/* Alias Input Field */}
          <div className="navy-input-group">
            <label className="navy-input-label" htmlFor="player-alias">
              YOUR PLAYER NAME / ALIAS
            </label>
            <input
              id="player-alias"
              type="text"
              className="navy-input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Maverick, Royale, Ace"
              disabled={loading}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleStartSolo()}
            />
          </div>

          {/* Error Message */}
          {error && <div className="navy-error-banner">{error}</div>}

          {/* Game Action Buttons */}
          <div className="navy-actions-stack">
            {/* Solo Mode: Play vs Bots */}
            <button
              type="button"
              className="btn-emerald-gold"
              onClick={handleStartSolo}
              disabled={loading}
              title="Play immediately against 3 AI bots"
            >
              <span className="btn-icon">♠</span>
              <span className="btn-text">
                {loading ? 'Launching Match...' : 'Play Solo vs AI Bots'}
              </span>
              <span className="btn-icon">♠</span>
            </button>

            {/* Multiplayer: Create New Table */}
            <button
              type="button"
              className="btn-navy-sapphire"
              onClick={handleCreateMultiplayer}
              disabled={loading}
              title="Create a private room for friends"
            >
              <span>Create New Table</span>
            </button>

            {/* Divider */}
            <div className="navy-divider">
              <span>OR JOIN TABLE</span>
            </div>

            {/* Join Table Input & Button */}
            <div className="navy-join-row">
              <input
                type="text"
                className="navy-input-field join-input"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                placeholder="Enter Table / Room ID"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <button
                type="button"
                className="btn-emerald-gold btn-join"
                onClick={handleJoinGame}
                disabled={loading}
              >
                Join
              </button>
            </div>
          </div>

          {/* Table Seating Arrangement Card */}
          <div className="navy-seating-preview">
            <div className="seating-preview-title">TABLE PARTNERSHIP ARRANGEMENT</div>
            <div className="seating-preview-grid">
              <div className="seat-pod-pill team-a">
                <span className="seat-shield">🦁</span>
                <div className="seat-meta">
                  <strong>Seat 1 (South) • You</strong>
                  <span>Team A (Partner: Seat 3)</span>
                </div>
              </div>

              <div className="seat-pod-pill team-b">
                <span className="seat-shield">🦅</span>
                <div className="seat-meta">
                  <strong>Seat 2 (West)</strong>
                  <span>Team B (Partner: Seat 4)</span>
                </div>
              </div>

              <div className="seat-pod-pill team-a">
                <span className="seat-shield">🦁</span>
                <div className="seat-meta">
                  <strong>Seat 3 (North)</strong>
                  <span>Team A (Partner: Seat 1)</span>
                </div>
              </div>

              <div className="seat-pod-pill team-b">
                <span className="seat-shield">🦅</span>
                <div className="seat-meta">
                  <strong>Seat 4 (East)</strong>
                  <span>Team B (Partner: Seat 2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <AvatarPickerModal
          currentAvatar={avatar}
          onSelect={(newAv) => {
            setAvatar(newAv);
            useGameStore.getState().setAvatar(newAv);
            setShowAvatarModal(false);
          }}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
};

export default Lobby;
