import React from 'react';
import type { Card, Suit } from '@shared/types';
import { useGameStore } from '../game/useGameStore';
import { playCardSound } from '../utils/audio';

interface PlayerHandProps {
  hand: Card[];
  isCurrentTurn: boolean;
  leadSuit: Suit | null;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, isCurrentTurn, leadSuit }) => {
  const { gameState, playCard, selectedCard, setSelectedCard } = useGameStore();

  const isBiddingPhase = gameState?.phase === 'BIDDING';
  const isPlayingPhase = gameState?.phase === 'PLAYING';

  // Determine legal cards to play
  const getLegalCards = () => {
    if (!leadSuit) return hand.map((c) => c.id);

    const matchingCards = hand.filter((c) => c.suit === leadSuit);
    if (matchingCards.length > 0) {
      return matchingCards.map((c) => c.id);
    }
    return hand.map((c) => c.id);
  };

  const legalCardIds = isCurrentTurn && isPlayingPhase ? getLegalCards() : [];

  const handleCardClick = (card: Card) => {
    if (!isCurrentTurn && !isBiddingPhase) return;

    if (isPlayingPhase && isCurrentTurn) {
      const isLegal = legalCardIds.includes(card.id);
      if (!isLegal) return;

      if (selectedCard?.id === card.id) {
        // Second tap or click plays the card immediately!
        playCardSound();
        playCard(card.id);
        setSelectedCard(null);
      } else {
        setSelectedCard(card);
      }
    } else {
      // Just select/inspect during bidding or waiting
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  const handlePlaySelected = () => {
    if (selectedCard && legalCardIds.includes(selectedCard.id)) {
      playCardSound();
      playCard(selectedCard.id);
      setSelectedCard(null);
    }
  };

  const count = hand.length;
  const centerIndex = (count - 1) / 2;

  return (
    <div className="classic-hand-wrapper">
      {/* Turn Action Banner */}
      <div className="hand-action-banner-row">
        {isPlayingPhase && isCurrentTurn && (
          <div className="turn-play-prompt">
            <span className="prompt-text-glow">YOUR TURN TO PLAY</span>
            {leadSuit && (
              <span className={`lead-suit-pill suit-${leadSuit}`}>
                Lead Suit: {SUIT_SYMBOLS[leadSuit]} {leadSuit.toUpperCase()}
              </span>
            )}
            {selectedCard && legalCardIds.includes(selectedCard.id) && (
              <button
                type="button"
                className="btn-play-card-action"
                onClick={handlePlaySelected}
              >
                <span>PLAY</span>
                <span className="play-card-spec">
                  {selectedCard.rank}{SUIT_SYMBOLS[selectedCard.suit]}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fan Cards */}
      {hand.length === 0 ? (
        <div className="empty-hand-notice">
          <div className="loading-spinner mini" />
          <span>Dealing cards...</span>
        </div>
      ) : (
        <div className="classic-fan-container">
          {hand.map((card, idx) => {
            const isSelected = selectedCard?.id === card.id;
            const isLegal = legalCardIds.includes(card.id);
            const canPlay = isPlayingPhase && isCurrentTurn && isLegal;
            const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

            // Fan geometry
            const offset = idx - centerIndex;
            const rotateDeg = offset * 3.5;
            const translateYPx = Math.abs(offset) * 1.5;

            const transformStyle = isSelected
              ? 'translateY(-24px) scale(1.1) rotate(0deg)'
              : `rotate(${rotateDeg}deg) translateY(${translateYPx}px)`;

            return (
              <div
                key={card.id}
                className={`fan-card ${isSelected ? 'is-selected' : ''} ${
                  canPlay ? 'can-play' : ''
                } ${!canPlay && isCurrentTurn && isPlayingPhase ? 'is-disabled' : ''} ${
                  isRed ? 'red-suit' : 'black-suit'
                }`}
                style={{
                  transform: transformStyle,
                  zIndex: isSelected ? 50 : 10 + idx,
                }}
                onClick={() => handleCardClick(card)}
                title={`${card.rank} of ${card.suit} (${card.pointValue} pts)`}
              >
                {/* Point badge */}
                {card.pointValue > 0 && (
                  <div className="card-pt-badge">
                    +{card.pointValue}
                  </div>
                )}

                <div className="card-face-surface">
                  <div className="corner top-left">
                    <span className="rank">{card.rank}</span>
                    <span className="suit">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>

                  <div className="center-symbol">
                    <span>{SUIT_SYMBOLS[card.suit]}</span>
                  </div>

                  <div className="corner bottom-right">
                    <span className="rank">{card.rank}</span>
                    <span className="suit">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
