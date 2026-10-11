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

  const isCelebrating = !!trickCelebration && !!trickCelebration.trick;
  const activeTrick = isCelebrating
    ? trickCelebration.trick
    : gameState.currentTrick;

  const plays = activeTrick?.plays || [];
  const points = activeTrick?.points || 0;
  const trickNum = (gameState.completedTricks?.length || 0) + (isCelebrating ? 0 : 1);

  // Seat label helper
  const getPlayerLabel = (seat: number) => {
    if (seat === mySeat) return 'You (আপনি)';
    const player = gameState.players.find((p) => p.seat === seat);
    return player?.username || `Seat ${seat}`;
  };

  // Point badge formatter
  const formatCardPoints = (pts: number) => {
    if (pts === 1) return '1 pt';
    return `${pts} pts`;
  };

  return (
    <div className={`center-trick-stage ${isCelebrating ? 'is-celebrating' : ''}`}>
      {/* Center Trick Status Header */}
      <div className="trick-status-badge">
        {isCelebrating ? (
          <div className="trick-winner-pill animate-pop">
            <span className="trophy-icon">👑</span>
            <span className="winner-lead">
              {trickCelebration.playerName} won the trick!
            </span>
            <span className="winner-pts-pill">+{trickCelebration.points} pts</span>
          </div>
        ) : (
          <div className="trick-pot-pill">
            <span className="pot-title">TRICK {Math.min(trickNum, 8)}/8</span>
            {plays.length > 0 && (
              <span className="pot-value">
                Points: <strong>{points}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards Played in Center Side-by-Side Standings */}
      <div className="trick-cards-stand">
        {plays.length === 0 ? (
          <div className="empty-trick-stand">
            <span className="stand-lead-prompt">
              {gameState.phase === 'PLAYING'
                ? 'Lead the first card of the trick'
                : 'Waiting for trick play...'}
            </span>
          </div>
        ) : (
          plays.map((play: { card: Card; seat: number; playerId?: string }, index: number) => {
            const isWinner = isCelebrating && trickCelebration.winnerSeat === play.seat;
            const suit = play.card.suit as Suit;
            const isRed = suit === 'hearts' || suit === 'diamonds';

            return (
              <div
                key={`${play.card.id}-${index}`}
                className={`standing-trick-card ${isWinner ? 'is-winner-card' : ''} ${
                  isRed ? 'red-suit' : 'black-suit'
                } animate-card-drop`}
              >
                {/* Upright Card Surface */}
                <div className="card-face mini-upright">
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

                  {isWinner && <div className="card-win-overlay">WIN</div>}
                </div>

                {/* Point Value Badge Underneath Card (Matching Reference 3 pts, 2 pts, 1 pt, 0 pts) */}
                <div
                  className={`card-points-badge ${
                    play.card.pointValue > 0 ? 'badge-has-pts' : 'badge-zero-pts'
                  }`}
                >
                  {formatCardPoints(play.card.pointValue)}
                </div>

                {/* Player Name Tag Underneath Point Badge */}
                <div className="card-player-tag" title={getPlayerLabel(play.seat)}>
                  {getPlayerLabel(play.seat)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TableCards;
