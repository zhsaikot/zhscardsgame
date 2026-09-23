import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';

interface GameInfoProps {
  onToggleRules?: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ onToggleRules }) => {
  const { gameState, leaveGame } = useGameStore();

  if (!gameState) return null;

  const trickNum = (gameState.completedTricks?.length || 0) + 1;
  const isTeamABidder = gameState.winningBidder && [1, 3].includes(gameState.winningBidder);
  const isTeamBBidder = gameState.winningBidder && [2, 4].includes(gameState.winningBidder);

  return (
    <header className="game-hud">
      {/* Left: Round & Trick info */}
      <div className="hud-section hud-left">
        <div className="hud-badge">
          <span className="hud-label">RND</span>
          <span className="hud-value">{gameState.roundNumber || 1}</span>
        </div>
        <div className="hud-badge">
          <span className="hud-label">TRICK</span>
          <span className="hud-value">{Math.min(trickNum, 8)}/8</span>
        </div>
      </div>

      {/* Center: Live Team Scores */}
      <div className="hud-section hud-center">
        <div className="scores-bar">
          <div className={`team-pill team-a ${isTeamABidder ? 'bidder-target' : ''}`} title="Team A (Seats 1 & 3)">
            <span className="team-indicator">🦁 A:</span>
            <span className="team-pts-main">{gameState.teamPoints.A}</span>
            {gameState.gameScore && (
              <span className="team-pts-sub">({gameState.gameScore.teamA})</span>
            )}
          </div>

          <div className={`team-pill team-b ${isTeamBBidder ? 'bidder-target' : ''}`} title="Team B (Seats 2 & 4)">
            <span className="team-indicator">🦅 B:</span>
            <span className="team-pts-main">{gameState.teamPoints.B}</span>
            {gameState.gameScore && (
              <span className="team-pts-sub">({gameState.gameScore.teamB})</span>
            )}
          </div>
        </div>

        {gameState.trumpSuit && (
          <div className={`hud-mini-trump ${gameState.trumpSuit}`}>
            <span className="mini-trump-icon">{SUIT_SYMBOLS[gameState.trumpSuit]}</span>
            <span className="mini-trump-name">{gameState.trumpSuit.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Right: Target Bid & Actions */}
      <div className="hud-section hud-right">
        {gameState.highestBid && (
          <div className="hud-badge target-bid-badge">
            <span className="hud-label">BID</span>
            <span className="hud-value gold-text">{gameState.highestBid}</span>
          </div>
        )}

        {onToggleRules && (
          <button
            onClick={onToggleRules}
            className="hud-btn btn-rules"
            title="Rules & Point Values"
          >
            Rules
          </button>
        )}

        <button onClick={leaveGame} className="hud-btn btn-leave-game" title="Leave Game">
          Leave
        </button>
      </div>
    </header>
  );
};

export default GameInfo;
