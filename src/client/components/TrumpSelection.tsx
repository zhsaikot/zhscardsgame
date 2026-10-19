import React from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Suit } from '@shared/types';
import { SUIT_SYMBOLS } from './PlayerHand';
import { playTrumpRevealSound } from '../utils/audio';

const TrumpSelection: React.FC = () => {
  const { gameState, playerId, selectTrump } = useGameStore();

  if (!gameState || gameState.phase !== 'TRUMP_SELECTION') return null;

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];

  const mySeat = currentPlayer?.seat || 1;
  const isWinningBidder = gameState.winningBidder === mySeat;
  const winningPlayer = gameState.players.find((p) => p.seat === gameState.winningBidder);

  const suits: Array<{ suit: Suit; name: string }> = [
    { suit: 'spades', name: 'Spades' },
    { suit: 'hearts', name: 'Hearts' },
    { suit: 'diamonds', name: 'Diamonds' },
    { suit: 'clubs', name: 'Clubs' },
  ];

  // Count cards per suit in player's hand
  const hand = currentPlayer?.hand || [];
  const getSuitCount = (suit: Suit) => {
    return hand.filter((c) => c.suit === suit).length;
  };

  const handleSelect = (suit: Suit) => {
    if (!isWinningBidder) return;
    playTrumpRevealSound();
    selectTrump(suit);
  };

  return (
    <div className="classic-trump-selection-console animate-fade-in">
      {/* Status Header */}
      <div className={`trump-header-banner ${isWinningBidder ? 'my-turn' : 'waiting'}`}>
        {isWinningBidder ? (
          <span className="banner-title active-glow">
            👑 YOU WON BID ({gameState.highestBid} PTS) • SELECT TRUMP SUIT
          </span>
        ) : (
          <span className="banner-title">
            ⏳ {winningPlayer?.username || `Seat ${gameState.winningBidder}`} is choosing Trump suit...
          </span>
        )}
        <span className="banner-hint">
          {isWinningBidder
            ? 'Review your 4 cards below and click a suit to set as Trump:'
            : 'Waiting for trump selection to begin round'}
        </span>
      </div>

      {/* 4 Interactive Suit Option Cards */}
      {isWinningBidder && (
        <div className="trump-suits-deck-row">
          {suits.map(({ suit, name }) => {
            const count = getSuitCount(suit);
            const isRed = suit === 'hearts' || suit === 'diamonds';

            return (
              <button
                key={suit}
                type="button"
                className={`trump-suit-card-btn ${isRed ? 'red-suit' : 'black-suit'} ${
                  count > 0 ? 'has-cards' : 'no-cards'
                }`}
                onClick={() => handleSelect(suit)}
                title={`Set ${name} as Trump (${count} card${count === 1 ? '' : 's'} in hand)`}
              >
                <div className="suit-symbol-large">{SUIT_SYMBOLS[suit]}</div>
                <div className="suit-name-text">{name}</div>
                <div className="suit-hand-count">
                  {count > 0 ? `${count} in hand` : 'None in hand'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrumpSelection;
