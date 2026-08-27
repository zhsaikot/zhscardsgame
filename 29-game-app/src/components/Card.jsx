import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../game/constants.js';

function Card({ card, selected, disabled, onClick, small = false }) {
  if (!card) return null;

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitColor = SUIT_COLORS[card.suit];
  
  const cardStyle = {
    width: small ? '50px' : '80px',
    height: small ? '75px' : '120px',
  };

  return (
    <div
      className={`card ${isRed ? 'card-red' : 'card-black'} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      style={cardStyle}
      onClick={() => !disabled && onClick && onClick(card)}
    >
      <div className="card-rank card-corner-top">
        {card.rank}{SUIT_SYMBOLS[card.suit]}
      </div>
      <div className="card-suit" style={{ color: suitColor, fontSize: small ? '20px' : '24px' }}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div className="card-rank card-corner-bottom">
        {card.rank}{SUIT_SYMBOLS[card.suit]}
      </div>
    </div>
  );
}

export default Card;
