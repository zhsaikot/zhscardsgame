import React from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Suit } from '@shared/types';

const TrumpSelection: React.FC = () => {
  const { selectTrump } = useGameStore();

  const suits: Array<{ suit: Suit; symbol: string; name: string }> = [
    { suit: 'spades', symbol: '♠', name: 'Spades' },
    { suit: 'hearts', symbol: '♥', name: 'Hearts' },
    { suit: 'diamonds', symbol: '♦', name: 'Diamonds' },
    { suit: 'clubs', symbol: '♣', name: 'Clubs' },
  ];

  return (
    <div className="trump-selection">
      <h3>Choose Trump Suit</h3>
      <p className="selection-hint">As the winning bidder, select your trump suit</p>
      
      <div className="suit-buttons">
        {suits.map(({ suit, symbol, name }) => (
          <button
            key={suit}
            className={`btn btn-suit btn-${suit}`}
            onClick={() => selectTrump(suit)}
          >
            <span className="suit-symbol large">{symbol}</span>
            <span className="suit-name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrumpSelection;
