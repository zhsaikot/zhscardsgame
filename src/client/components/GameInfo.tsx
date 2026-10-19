import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';
import { getSavedAvatar } from '../utils/avatar';

interface GameInfoProps {
  onToggleRules?: () => void;
  onToggleChat?: () => void;
  onToggleSettings?: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({
  onToggleRules,
  onToggleChat,
  onToggleSettings,
}) => {
  const { gameState, playerId, leaveGame } = useGameStore();
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  if (!gameState) return null;

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];

  const userAvatar = currentPlayer?.avatar || getSavedAvatar();
  const isHidden = !gameState.trumpRevealed && gameState.settings?.hiddenTrump;

  const handleExitConfirm = () => {
    if (window.confirm('Are you sure you want to leave the table? / আপনি কি খেলা ছেড়ে যেতে চান?')) {
      leaveGame();
    }
  };

  return (
    <>
      <header className="esports-top-nav">
        {/* Left: Brand Name & Round Tag */}
        <div className="esports-nav-brand">
          <div className="brand-title-wrap">
            <span className="brand-logo-text">29 ARENA</span>
            <span className="brand-badge-tag">CHAMPIONSHIP</span>
          </div>
          <span className="round-pill-badge">Round {gameState.roundNumber || 1}</span>
        </div>

        {/* Center: Match Status & Trump Pill */}
        <div className="esports-nav-center">
          {/* Team A Score Pill */}
          <div className="nav-score-pill team-a">
            <span className="team-indicator-dot a">●</span>
            <span className="score-lbl">TEAM A:</span>
            <strong className="score-num">{gameState.teamPoints?.A ?? 0}</strong>
            <span className="score-won">({gameState.gameScore?.teamA ?? 0})</span>
          </div>

          {/* Trump Card Pill */}
          <div
            className={`nav-trump-pill ${gameState.trumpSuit || 'no-trump'}`}
            title="Trump Card (ট্রাম্প)"
          >
            <span className="trump-pill-label">TRUMP:</span>
            {gameState.trumpSuit ? (
              isHidden ? (
                <span className="trump-secret-text">🔒 ?</span>
              ) : (
                <span className={`trump-revealed-suit suit-${gameState.trumpSuit}`}>
                  {SUIT_SYMBOLS[gameState.trumpSuit]} {gameState.trumpSuit.toUpperCase()}
                </span>
              )
            ) : (
              <span className="trump-unrevealed-text">Pending</span>
            )}
          </div>

          {/* Team B Score Pill */}
          <div className="nav-score-pill team-b">
            <span className="team-indicator-dot b">●</span>
            <span className="score-lbl">TEAM B:</span>
            <strong className="score-num">{gameState.teamPoints?.B ?? 0}</strong>
            <span className="score-won">({gameState.gameScore?.teamB ?? 0})</span>
          </div>
        </div>

        {/* Right: Quick Links & User Profile Pill */}
        <div className="esports-nav-right">
          {/* Quick Nav Links (Desktop) */}
          <div className="nav-action-links">
            <button
              type="button"
              className="nav-link-btn"
              onClick={onToggleRules}
              title="Game Rules & Points"
            >
              ℹ️ Rules
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={onToggleChat}
              title="Table Chat & Move Log"
            >
              💬 Chat
            </button>
            <button
              type="button"
              className="nav-link-btn"
              onClick={onToggleSettings}
              title="Audio & Game Settings"
            >
              ⚙️ Settings
            </button>
          </div>

          {/* User Profile Pill matching reference image */}
          <div
            className="esports-profile-pill"
            onClick={() => setShowMobileDrawer(!showMobileDrawer)}
            title="User Profile & Quick Menu"
          >
            <div className="profile-pill-avatar">
              <img src={userAvatar} alt="Avatar" className="profile-img" />
            </div>
            <div className="profile-pill-meta">
              <span className="profile-username">{currentPlayer?.username || 'You'}</span>
              <span className="profile-elo">3,290 ELO</span>
            </div>
            <span className="profile-arrow">▾</span>
          </div>

          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setShowMobileDrawer(!showMobileDrawer)}
            title="Menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Menu Drawer */}
      {showMobileDrawer && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileDrawer(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">29 ARENA</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Menu</span>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setShowMobileDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-menu-items">
              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileDrawer(false);
                  onToggleRules?.();
                }}
              >
                <span>ℹ️</span> Game Rules & Points (নিয়মাবলী)
              </button>
              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileDrawer(false);
                  onToggleChat?.();
                }}
              >
                <span>💬</span> Table Chat & Move Log (চ্যাট)
              </button>
              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileDrawer(false);
                  onToggleSettings?.();
                }}
              >
                <span>⚙️</span> Audio & Settings (সেটিংস)
              </button>
              <button
                type="button"
                className="mobile-menu-item danger"
                onClick={() => {
                  setShowMobileDrawer(false);
                  handleExitConfirm();
                }}
              >
                <span>🚪</span> Leave Table (খেলা ত্যাগ করুন)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameInfo;
