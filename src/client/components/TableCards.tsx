import React from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Card } from '@shared/types';

const TableCards: React.FC = () => {
  const { gameState } = useGameStore();

  if (!gameState || !gameState.currentTrick) {
    return (
      <div className="table-cards empty">
        <p>Waiting for cards...</p>
      </div>
    );
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'spades': return '♠';
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      default: return '';
    }
  };

  return (
    <div className="table-cards">
      <div className="trick-display">
        {gameState.currentTrick.plays.map((play, index) => (
          <div 
            key={index} 
            className={`played-card seat-${play.seat}`}
          >
            <div className="card mini" data-suit={play.card.suit}>
              <div className="card-corner top-left">
                <span className="rank">{play.card.rank}</span>
                <span className="suit-symbol">{getSuitSymbol(play.card.suit)}</span>
              </div>
              <div className="card-center">
                <span className="suit-symbol">{getSuitSymbol(play.card.suit)}</span>
              </div>
            </div>
            <span className="player-label">P{play.seat}</span>
          </div>
        ))}
      </div>
      
      {gameState.currentTrick.points > 0 && (
        <div className="trick-points">
          Points: {gameState.currentTrick.points}
        </div>
      )}
    </div>
  );
};

export default TableCards;
