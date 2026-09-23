import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';

interface TableCardsProps {
  mySeat?: number;
}

const TableCards: React.FC<TableCardsProps> = ({ mySeat = 1 }) => {
  const { gameState } = useGameStore();

  if (!gameState || !gameState.currentTrick) {
    return (
      <div className="trick-arena">
        <div className="trick-pot-chip">
          <span className="trick-pot-label">Trick</span>
          <span className="trick-pot-val">
            {(gameState?.completedTricks?.length || 0) + 1}/8
          </span>
        </div>
      </div>
    );
  }

  const plays = gameState.currentTrick.plays || [];
  const points = gameState.currentTrick.points || 0;

  // Map seat number to spatial position relative to local player (South)
  const getDirectionClass = (seat: number) => {
    const diff = (seat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'play-from-south';
      case 1: return 'play-from-west';
      case 2: return 'play-from-north';
      case 3: return 'play-from-east';
      default: return 'play-from-south';
    }
  };

  const getPlayerLabel = (seat: number) => {
    if (seat === mySeat) return 'You';
    const player = gameState.players.find(p => p.seat === seat);
    return player?.username || `P${seat}`;
  };

  return (
    <div className="trick-arena">
      {/* Center Pot Chip */}
      <div className="trick-pot-chip">
        <span className="trick-pot-label">Points</span>
        <span className="trick-pot-val">{points}</span>
      </div>

      {/* Spatially positioned played cards */}
      {plays.map((play, index) => {
        const dirClass = getDirectionClass(play.seat);
        return (
          <div key={`${play.card.id}-${index}`} className={`trick-play ${dirClass}`}>
            <div className="card mini" data-suit={play.card.suit}>
              <div className="card-face">
                <div className="card-corner top-left">
                  <span className="rank">{play.card.rank}</span>
                  <span className="suit-symbol">{SUIT_SYMBOLS[play.card.suit]}</span>
                </div>
                <div className="card-center">
                  <span className="suit-symbol large">{SUIT_SYMBOLS[play.card.suit]}</span>
                </div>
                <div className="card-corner bottom-right">
                  <span className="rank">{play.card.rank}</span>
                  <span className="suit-symbol">{SUIT_SYMBOLS[play.card.suit]}</span>
                </div>
              </div>
            </div>
            <span className="play-seat-tag">{getPlayerLabel(play.seat)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TableCards;
