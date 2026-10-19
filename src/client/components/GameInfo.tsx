import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';

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
  const { gameState, leaveGame } = useGameStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!gameState) return null;

  const isHidden = !gameState.trumpRevealed && gameState.settings?.hiddenTrump;
  const isTeamABidder = gameState.winningBidder && [1, 3].includes(gameState.winningBidder);
  const isTeamBBidder = gameState.winningBidder && [2, 4].includes(gameState.winningBidder);

  const handleExitConfirm = () => {
    if (window.confirm('Are you sure you want to leave the table? / আপনি কি খেলা ছেড়ে যেতে চান?')) {
      leaveGame();
    }
  };

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header className="stadium-notch-header">
        {/* Left Branding & Target Column */}
        <div className="notch-left-branding">
          <div className="brand-logo-row">
            <span className="brand-bengali-numeral">২৯</span>
            <span className="brand-dash">-</span>
            <span className="brand-english-numeral">29</span>
          </div>
          <div className="brand-subtitle">29 Card Game</div>
          <div className="brand-target-pill">
            <span className="target-lbl">TARGET:</span>
            <span className="target-val">29</span>
          </div>
        </div>

        {/* Center Stadium Hanging Curved Notch with Scores & Trump Card */}
        <div className="curved-center-notch">
          {/* Left Team A Score Inside Notch */}
          <div className={`notch-team-box team-a ${isTeamABidder ? 'bidding-team' : ''}`}>
            <div className="notch-team-label">
              <span className="team-dot team-a-dot">●</span> TEAM A
            </div>
            <div className="notch-team-points">
              {gameState.teamPoints?.A ?? 0}
              <span className="notch-team-match-score">
                ({gameState.gameScore?.teamA ?? 0})
              </span>
            </div>
            {isTeamABidder && gameState.highestBid && (
              <div className="notch-team-bid-tag">Target: {gameState.highestBid}</div>
            )}
          </div>

          {/* Center Golden Trump Card Showcase Badge */}
          <div
            className={`notch-trump-badge ${gameState.trumpSuit || 'no-trump'} ${
              isHidden ? 'is-hidden' : 'is-revealed'
            }`}
            title={
              gameState.trumpSuit
                ? isHidden
                  ? 'Trump Card is hidden (secret)'
                  : `Trump Suit: ${gameState.trumpSuit}`
                : 'Trump suit not chosen yet'
            }
          >
            <div className="notch-trump-banner">
              <span className="trump-bilingual-title">TRUMP ট্রাম্প</span>
            </div>

            <div className="notch-trump-card-slot">
              {gameState.trumpSuit ? (
                isHidden ? (
                  <div className="notch-trump-card-back">
                    <span className="notch-trump-question">?</span>
                  </div>
                ) : (
                  <div className={`notch-trump-card-face suit-${gameState.trumpSuit}`}>
                    <span className="notch-trump-suit-icon">
                      {SUIT_SYMBOLS[gameState.trumpSuit]}
                    </span>
                    <span className="notch-trump-suit-name">
                      {gameState.trumpSuit.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )
              ) : (
                <div className="notch-trump-card-empty">
                  <span className="notch-trump-empty-icon">♠</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Team B Score Inside Notch */}
          <div className={`notch-team-box team-b ${isTeamBBidder ? 'bidding-team' : ''}`}>
            <div className="notch-team-label">
              <span className="team-dot team-b-dot">●</span> TEAM B
            </div>
            <div className="notch-team-points">
              {gameState.teamPoints?.B ?? 0}
              <span className="notch-team-match-score">
                ({gameState.gameScore?.teamB ?? 0})
              </span>
            </div>
            {isTeamBBidder && gameState.highestBid && (
              <div className="notch-team-bid-tag">Target: {gameState.highestBid}</div>
            )}
          </div>
        </div>

        {/* Right Column: 4 Circular Gold Buttons */}
        <div className="notch-right-controls">
          <button
            className="circle-gold-btn"
            onClick={onToggleSettings}
            title="Settings / সেটিংস"
          >
            <span className="btn-icon">⚙️</span>
          </button>

          <button
            className="circle-gold-btn"
            onClick={onToggleChat}
            title="Game Chat & Log / চ্যাট"
          >
            <span className="btn-icon">💬</span>
          </button>

          <button
            className="circle-gold-btn"
            onClick={onToggleRules}
            title="Game Rules & Points / নিয়মাবলী"
          >
            <span className="btn-icon">ℹ️</span>
          </button>

          <button
            className="circle-gold-btn exit-btn"
            onClick={handleExitConfirm}
            title="Leave Table / খেলা ত্যাগ করুন"
          >
            <span className="btn-icon">🚪</span>
          </button>
        </div>
      </header>

      {/* Mobile Streamlined Top HUD Bar */}
      <header className="mobile-hud-bar">
        {/* Left: Brand logo & Round */}
        <div className="mobile-hud-left">
          <span className="mobile-brand-numeral">২৯</span>
          <span className="mobile-round-tag">R{gameState.roundNumber || 1}</span>
        </div>

        {/* Center: Team Scores + Trump Pill */}
        <div className="mobile-hud-center">
          <div className="mobile-score-box team-a">
            <span className="mobile-score-lbl">A:</span>
            <span className="mobile-score-val">{gameState.teamPoints?.A ?? 0}</span>
          </div>

          {/* Compact Trump Card Slot */}
          <div className="mobile-trump-pill" title="Trump status">
            {gameState.trumpSuit ? (
              isHidden ? (
                <span className="mobile-trump-secret">🔒 ?</span>
              ) : (
                <span className={`mobile-trump-revealed suit-${gameState.trumpSuit}`}>
                  {SUIT_SYMBOLS[gameState.trumpSuit]}
                </span>
              )
            ) : (
              <span className="mobile-trump-empty">♠</span>
            )}
          </div>

          <div className="mobile-score-box team-b">
            <span className="mobile-score-lbl">B:</span>
            <span className="mobile-score-val">{gameState.teamPoints?.B ?? 0}</span>
          </div>
        </div>

        {/* Right: Quick Menu Trigger Button */}
        <div className="mobile-hud-right">
          <button
            className="mobile-btn-icon"
            onClick={onToggleChat}
            title="Chat & Log"
          >
            💬
          </button>
          <button
            className="mobile-btn-menu"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            title="Menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown Drawer */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="gold-text" style={{ fontWeight: 800 }}>Game Menu</span>
              <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>✕</button>
            </div>
            <div className="mobile-menu-items">
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onToggleRules?.();
                }}
              >
                <span>ℹ️</span> 29 Game Rules & Points (নিয়মাবলী)
              </button>
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onToggleSettings?.();
                }}
              >
                <span>⚙️</span> Audio & Settings (সেটিংস)
              </button>
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onToggleChat?.();
                }}
              >
                <span>💬</span> Table Chat & Move Log (চ্যাট)
              </button>
              <button
                className="mobile-menu-item danger"
                onClick={() => {
                  setShowMobileMenu(false);
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
