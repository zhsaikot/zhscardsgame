import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Suit } from '@shared/types';
import { SUIT_SYMBOLS } from './PlayerHand';

const TrumpSelection: React.FC = () => {
  const { selectTrump } = useGameStore();
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  const suits: Array<{ suit: Suit; name: string }> = [
    { suit: 'spades', name: 'Spades' },
    { suit: 'hearts', name: 'Hearts' },
    { suit: 'diamonds', name: 'Diamonds' },
    { suit: 'clubs', name: 'Clubs' },
  ];

  const handleConfirm = () => {
    if (selectedSuit) {
      selectTrump(selectedSuit);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '460px' }}>
        <h2 className="modal-title gold-text">Select Trump Suit</h2>
        <p className="modal-subtitle">
          You won the contract! Select the trump suit for this round:
        </p>

        <div className="trump-selector-grid">
          {suits.map(({ suit, name }) => {
            const isSelected = selectedSuit === suit;
            return (
              <div
                key={suit}
                className={`trump-card-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedSuit(suit)}
                data-suit={suit}
              >
                <div
                  className="trump-option-symbol"
                  style={{
                    color:
                      suit === 'hearts' || suit === 'diamonds'
                        ? 'var(--ruby-red)'
                        : suit === 'clubs'
                        ? '#34d399'
                        : '#f8fafc',
                  }}
                >
                  {SUIT_SYMBOLS[suit]}
                </div>
                <div className="trump-option-name">{name}</div>
              </div>
            );
          })}
        </div>

        <button
          className="btn-emerald-sleek"
          onClick={handleConfirm}
          disabled={!selectedSuit}
          style={{ width: '100%', marginTop: '1.2rem', padding: '0.9rem' }}
        >
          {selectedSuit ? `Set ${selectedSuit.toUpperCase()} as Trump` : 'Choose a Suit'}
        </button>
      </div>
    </div>
  );
};

export default TrumpSelection;
