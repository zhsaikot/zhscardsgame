import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';
import type { Suit } from '@shared/types';

const SUIT_NAMES: Record<Suit, string> = {
  spades: 'Spades ♠',
  hearts: 'Hearts ♥',
  diamonds: 'Diamonds ♦',
  clubs: 'Clubs ♣',
};

export const TrumpCardIndicator: React.FC = () => {
  const { gameState, playerId } = useGameStore();

  if (!gameState) return null;

  const { trumpSuit, trumpRevealed, winningBidder, highestBid, phase } = gameState;

  // Don't render until bidding has completed or trump is chosen
  if (phase === 'BIDDING' && !highestBid) return null;

  const bidderPlayer = gameState.players.find((p) => p.seat === winningBidder);
  const isMe = bidderPlayer?.id === playerId;
  const bidderName = isMe ? 'You' : bidderPlayer?.username || (winningBidder ? `Seat ${winningBidder}` : 'Bidder');

  if (!trumpSuit && phase === 'TRUMP_SELECTION') {
    return (
      <div className="trump-indicator-panel choosing">
        <div className="trump-indicator-badge">
          <span className="trump-badge-title">TRUMP SELECTION</span>
          <span className="trump-badge-sub">{bidderName} is selecting Trump</span>
        </div>
      </div>
    );
  }

  if (!trumpSuit) return null;

  const isHidden = !trumpRevealed && gameState.settings?.hiddenTrump;

  return (
    <div className={`trump-indicator-panel active ${trumpSuit} ${isHidden ? 'hidden-trump' : 'revealed'}`}>
      <div className="trump-card-visual" data-suit={trumpSuit}>
        {isHidden ? (
          <div className="trump-card-back">
            <span className="trump-lock-icon">🔒</span>
            <span className="trump-hidden-text">TRUMP</span>
          </div>
        ) : (
          <div className="trump-card-front">
            <span className="trump-suit-large">{SUIT_SYMBOLS[trumpSuit]}</span>
          </div>
        )}
      </div>

      <div className="trump-details">
        <div className="trump-header-row">
          <span className="trump-status-tag">{isHidden ? 'HIDDEN TRUMP' : 'TRUMP SUIT'}</span>
        </div>
        <div className="trump-suit-name">
          {isHidden ? 'Secret Trump' : SUIT_NAMES[trumpSuit]}
        </div>
        {highestBid && (
          <div className="trump-bid-info">
            Contract: <strong>{highestBid} pts</strong> ({bidderName})
          </div>
        )}
      </div>
    </div>
  );
};

export default TrumpCardIndicator;

