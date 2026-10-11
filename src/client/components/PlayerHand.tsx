import React from 'react';
import type { Card, Suit } from '@shared/types';
import { useGameStore } from '../game/useGameStore';

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
        // Double-click/second tap directly plays
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
      playCard(selectedCard.id);
      setSelectedCard(null);
    }
  };

  const count = hand.length;
  const centerIndex = (count - 1) / 2;

  return (
    <div className="player-hand-wrapper">
      {/* Floating Action / Turn Play Prompt Bar */}
      <div className="hand-action-bar">
        {isPlayingPhase && isCurrentTurn && (
          <div className="hand-turn-banner animate-pulse">
            <span className="turn-banner-bilingual">তোমার চাল / YOUR TURN</span>
            {selectedCard && legalCardIds.includes(selectedCard.id) && (
              <button
                type="button"
                className="btn-play-action-glow"
                onClick={handlePlaySelected}
              >
                <span>PLAY</span>
                <span className="play-card-spec">
                  {selectedCard.rank}{SUIT_SYMBOLS[selectedCard.suit]}
                </span>
                <span className="play-bengali-sub">চাল দিন</span>
              </button>
            )}
          </div>
        )}

        {/* Lead Suit Reminder */}
        {isPlayingPhase && isCurrentTurn && leadSuit && (
          <div className="lead-suit-badge">
            <span className="lead-suit-label">Must Follow:</span>
            <span className={`lead-suit-val suit-${leadSuit}`}>
              {SUIT_SYMBOLS[leadSuit]} {leadSuit.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Fan Arc Hand Cards */}
      {hand.length === 0 ? (
        <div className="empty-hand-notice">
          <div className="loading-spinner mini" />
          <span>Dealing cards...</span>
        </div>
      ) : (
        <div className="fan-hand-container">
          {hand.map((card, idx) => {
            const isSelected = selectedCard?.id === card.id;
            const isLegal = legalCardIds.includes(card.id);
            const canPlay = isPlayingPhase && isCurrentTurn && isLegal;
            const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

            // Parabolic fan geometry:
            const offset = idx - centerIndex;
            const rotateDeg = offset * 4.5;
            const translateYPx = Math.abs(offset) * Math.abs(offset) * 2.2;

            // When selected, card straightens and pops up:
            const transformStyle = isSelected
              ? 'translateY(-34px) scale(1.12) rotate(0deg)'
              : `rotate(${rotateDeg}deg) translateY(${translateYPx}px)`;

            return (
              <div
                key={card.id}
                className={`fan-card-item ${isSelected ? 'is-selected' : ''} ${
                  canPlay ? 'can-play' : ''
                } ${!canPlay && isCurrentTurn && isPlayingPhase ? 'is-disabled' : ''} ${
                  isRed ? 'red-suit' : 'black-suit'
                }`}
                style={{
                  transform: transformStyle,
                  zIndex: isSelected ? 50 : 10 + idx,
                }}
                onClick={() => handleCardClick(card)}
                data-rank={card.rank}
                data-suit={card.suit}
                title={`${card.rank} of ${card.suit} (${card.pointValue} pts)`}
              >
                {/* Point badge visible during bidding & play */}
                {card.pointValue > 0 && (
                  <div className="fan-card-point-badge">
                    +{card.pointValue}
                  </div>
                )}

                <div className="card-face">
                  {/* Top-Left Corner */}
                  <div className="card-corner top-left">
                    <span className="rank">{card.rank}</span>
                    <span className="suit-symbol">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>

                  {/* Large Center Suit Symbol */}
                  <div className="card-center">
                    <span className="suit-symbol large">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>

                  {/* Bottom-Right Corner */}
                  <div className="card-corner bottom-right">
                    <span className="rank">{card.rank}</span>
                    <span className="suit-symbol">{SUIT_SYMBOLS[card.suit]}</span>
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
