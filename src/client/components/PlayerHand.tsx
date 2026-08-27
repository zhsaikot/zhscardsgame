import React from 'react';
import type { Card, Suit } from '@shared/types';
import { useGameStore } from '../game/useGameStore';

interface PlayerHandProps {
  hand: Card[];
  isCurrentTurn: boolean;
  leadSuit: Suit | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, isCurrentTurn, leadSuit }) => {
  const { playCard, selectedCard, setSelectedCard } = useGameStore();

  const handleCardClick = (card: Card) => {
    if (!isCurrentTurn) return;

    if (selectedCard?.id === card.id) {
      // Play the card
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
      <div className="hand-cards">
        {hand.map((card) => {
          const isSelected = selectedCard?.id === card.id;
          const isLegal = legalCardIds.includes(card.id);
          const canPlay = isCurrentTurn && isLegal;

          return (
            <div
              key={card.id}
              className={`card ${isSelected ? 'selected' : ''} ${!canPlay && isCurrentTurn ? 'disabled' : ''}`}
              onClick={() => handleCardClick(card)}
              data-rank={card.rank}
              data-suit={card.suit}
            >
              <div className="card-face">
                <div className="card-corner top-left">
                  <span className="rank">{card.rank}</span>
                  <span className="suit-symbol">{getSuitSymbol(card.suit)}</span>
                </div>
                <div className="card-center">
                  <span className="suit-symbol large">{getSuitSymbol(card.suit)}</span>
                </div>
                <div className="card-corner bottom-right">
                  <span className="rank inverted">{card.rank}</span>
                  <span className="suit-symbol inverted">{getSuitSymbol(card.suit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {isCurrentTurn && selectedCard && (
        <div className="play-hint">Click again to play {selectedCard.rank}{getSuitSymbol(selectedCard.suit)}</div>
      )}
      {isCurrentTurn && leadSuit && (
        <div className="lead-suit-info">Must follow: {getSuitSymbol(leadSuit)} {leadSuit}</div>
      )}
    </div>
  );
};

function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
  }
}

export default PlayerHand;
