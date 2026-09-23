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
      <div className="hud-left">
        <div className="hud-badge">
          <span className="hud-label">Round</span>
          <span className="hud-value">{gameState.roundNumber || 1}</span>
        </div>
        <div className="hud-badge">
          <span className="hud-label">Trick</span>
          <span className="hud-value">{Math.min(trickNum, 8)}/8</span>
        </div>
        {gameState.dealer && (
          <div className="hud-badge" style={{ display: 'none' /* visible on desktop via CSS */ }}>
            <span className="hud-label">Dealer</span>
            <span className="hud-value">Seat {gameState.dealer}</span>
          </div>
        )}
      </div>

      {/* Center: Trump & Current Phase */}
      <div className="hud-center">
        {gameState.trumpSuit ? (
          <div className={`trump-pill ${gameState.trumpSuit}`}>
            <span className="suit-icon">{SUIT_SYMBOLS[gameState.trumpSuit]}</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>
              {gameState.trumpSuit}
            </span>
          </div>
        ) : (
          <div className="trump-pill" style={{ opacity: 0.7 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Trump: {gameState.phase === 'BIDDING' ? 'Bidding' : 'Hidden'}
            </span>
          </div>
        )}

        {gameState.highestBid && (
          <div className="hud-badge">
            <span className="hud-label">Target Bid</span>
            <span className="hud-value" style={{ color: 'var(--gold-primary)' }}>
              {gameState.highestBid}
            </span>
          </div>
        )}
      </div>

      {/* Right: Scores & Actions */}
      <div className="hud-right">
        <div className="scores-bar">
          <div className={`team-pill team-a ${isTeamABidder ? 'bidder-target' : ''}`}>
            <span>Team A:</span>
            <strong>{gameState.teamPoints.A}</strong>
            {gameState.gameScore && (
              <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>
                ({gameState.gameScore.teamA})
              </span>
            )}
          </div>

          <div className={`team-pill team-b ${isTeamBBidder ? 'bidder-target' : ''}`}>
            <span>Team B:</span>
            <strong>{gameState.teamPoints.B}</strong>
            {gameState.gameScore && (
              <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>
                ({gameState.gameScore.teamB})
              </span>
            )}
          </div>
        </div>

        {onToggleRules && (
          <button
            onClick={onToggleRules}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title="Rules & Point Values"
          >
            Rules
          </button>
        )}

        <button onClick={leaveGame} className="btn btn-leave" title="Leave Game">
          Leave
        </button>
      </div>
    </header>
  );
};

export default GameInfo;
