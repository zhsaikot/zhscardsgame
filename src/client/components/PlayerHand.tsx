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
  const { playCard, selectedCard, setSelectedCard } = useGameStore();

  const handleCardClick = (card: Card) => {
    if (!isCurrentTurn) return;

    const isLegal = getLegalCards().includes(card.id);
    if (!isLegal) return;

    if (selectedCard?.id === card.id) {
      // Play the card immediately
      playCard(card.id);
      setSelectedCard(null);
    } else {
      // Select the card
      setSelectedCard(card);
    }
  };

  // Determine which cards are legal to play
  const getLegalCards = () => {
    if (!leadSuit) return hand.map(c => c.id);
    
    const matchingCards = hand.filter(c => c.suit === leadSuit);
    if (matchingCards.length > 0) {
      return matchingCards.map(c => c.id);
    }
    return hand.map(c => c.id);
  };

  const legalCardIds = isCurrentTurn ? getLegalCards() : [];

  return (
    <div className="player-hand">
      {hand.length === 0 ? (
        <div className="empty-hand-notice">
          <div className="loading-spinner mini" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
          <span>Dealing cards...</span>
        </div>
      ) : (
        <div className="hand-cards">
          {hand.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            const isLegal = legalCardIds.includes(card.id);
            const canPlay = isCurrentTurn && isLegal;

            return (
              <div
                key={card.id}
                className={`card ${isSelected ? 'selected' : ''} ${canPlay ? 'legal-move' : ''} ${!canPlay && isCurrentTurn ? 'disabled' : ''}`}
                onClick={() => handleCardClick(card)}
                data-rank={card.rank}
                data-suit={card.suit}
                title={canPlay ? `Play ${card.rank} of ${card.suit}` : undefined}
              >
                <div className="card-face">
                  <div className="card-corner top-left">
                    <span className="rank">{card.rank}</span>
                    <span className="suit-symbol">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
                  <div className="card-center">
                    <span className="suit-symbol large">{SUIT_SYMBOLS[card.suit]}</span>
                  </div>
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

      <div className="hand-hints-row">
        {isCurrentTurn && selectedCard && legalCardIds.includes(selectedCard.id) && (
          <button
            className="btn-play-action"
            onClick={() => {
              playCard(selectedCard.id);
              setSelectedCard(null);
            }}
          >
            ▶ Play {selectedCard.rank}{SUIT_SYMBOLS[selectedCard.suit]}
          </button>
        )}
        {isCurrentTurn && selectedCard && (
          <div className="play-hint">
            Tap card again to play
          </div>
        )}
        {isCurrentTurn && leadSuit && (
          <div className="lead-suit-info">
            Must follow suit: {SUIT_SYMBOLS[leadSuit]} {leadSuit}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
