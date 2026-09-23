import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { SUIT_SYMBOLS } from './PlayerHand';
import type { Card, Suit } from '@shared/types';

interface TableCardsProps {
  mySeat?: number;
}

const TableCards: React.FC<TableCardsProps> = ({ mySeat = 1 }) => {
  const { gameState, trickCelebration } = useGameStore();

  if (!gameState) return null;

  // Use celebration trick if active, otherwise current trick
  const isCelebrating = !!trickCelebration && !!trickCelebration.trick;
  const activeTrick = isCelebrating
    ? trickCelebration.trick
    : gameState.currentTrick;

  const plays = activeTrick?.plays || [];
  const points = activeTrick?.points || 0;
  const trickNum = (gameState.completedTricks?.length || 0) + (isCelebrating ? 0 : 1);

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
    const player = gameState.players.find((p) => p.seat === seat);
    return player?.username || `P${seat}`;
  };

  return (
    <div className={`trick-arena ${isCelebrating ? 'celebration-mode' : ''}`}>
      {/* Center Pot Chip / Winner Banner */}
      {isCelebrating ? (
        <div className="trick-winner-banner animate-pop">
          <div className="winner-crown">👑</div>
          <div className="winner-name-text">
            {trickCelebration.playerName} won!
          </div>
          <div className="winner-pts-text">
            +{trickCelebration.points} pts
          </div>
        </div>
      ) : (
        <div className="trick-pot-chip">
          <span className="trick-pot-label">
            {plays.length > 0 ? 'Trick Points' : 'Trick'}
          </span>
          <span className="trick-pot-val">
            {plays.length > 0 ? points : `${Math.min(trickNum, 8)}/8`}
          </span>
        </div>
      )}

      {/* Spatially positioned played cards */}
      {plays.map((play: { card: Card; seat: number; playerId?: string }, index: number) => {
        const dirClass = getDirectionClass(play.seat);
        const isWinner = isCelebrating && trickCelebration.winnerSeat === play.seat;
        const suit = play.card.suit as Suit;

        return (
          <div
            key={`${play.card.id}-${index}`}
            className={`trick-play ${dirClass} ${isWinner ? 'winner-card' : ''} slide-in-play`}
          >
            <div className="card mini" data-suit={suit}>
              {isWinner && <div className="card-winner-tag">WIN</div>}
              <div className="card-face">
                <div className="card-corner top-left">
                  <span className="rank">{play.card.rank}</span>
                  <span className="suit-symbol">{SUIT_SYMBOLS[suit]}</span>
                </div>
                <div className="card-center">
                  <span className="suit-symbol large">{SUIT_SYMBOLS[suit]}</span>
                </div>
                <div className="card-corner bottom-right">
                  <span className="rank">{play.card.rank}</span>
                  <span className="suit-symbol">{SUIT_SYMBOLS[suit]}</span>
                </div>
              </div>
            </div>
            <span className={`play-seat-tag ${isWinner ? 'winner-tag' : ''}`}>
              {getPlayerLabel(play.seat)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TableCards;
