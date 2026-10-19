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
  const isFlying = isCelebrating && trickCelebration.phase === 'flying';
  const activeTrick = isCelebrating
    ? trickCelebration.trick
    : gameState.currentTrick;

  const plays = activeTrick?.plays || [];
  const points = activeTrick?.points || 0;
  const trickNum = (gameState.completedTricks?.length || 0) + (isCelebrating ? 0 : 1);

  // Determine winner direction relative to South (mySeat)
  const getWinnerFlightDirection = (winnerSeat: number) => {
    const diff = (winnerSeat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'south'; // You (Bottom)
      case 1: return 'west';  // Left Opponent
      case 2: return 'north'; // Partner (Top)
      case 3: return 'east';  // Right Opponent
      default: return 'south';
    }
  };

  const winnerDir = isCelebrating
    ? getWinnerFlightDirection(trickCelebration.winnerSeat)
    : 'south';

  // Seat label helper
  const getPlayerLabel = (seat: number) => {
    if (seat === mySeat) return 'You (আপনি)';
    const player = gameState.players.find((p) => p.seat === seat);
    return player?.username || `Seat ${seat}`;
  };

  // Cardinal position class for each played card
  const getCardPositionClass = (seat: number) => {
    const diff = (seat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'card-pos-south'; // Bottom
      case 1: return 'card-pos-west';  // Left
      case 2: return 'card-pos-north'; // Top
      case 3: return 'card-pos-east';  // Right
      default: return 'card-pos-south';
    }
  };

  // Point badge formatter
  const formatCardPoints = (pts: number) => {
    if (pts === 1) return '1 pt';
    return `${pts} pts`;
  };

  return (
    <div
      className={`center-trick-stage ${isCelebrating ? 'is-celebrating' : ''} ${
        isFlying ? `is-flying fly-${winnerDir}` : ''
      }`}
    >
      {/* Center Trick Status Header or Winner Announcement */}
      <div className="trick-status-badge">
        {isCelebrating ? (
          <div className="trick-winner-spotlight animate-pop">
            <div className="spotlight-crown">👑</div>
            <div className="spotlight-title">
              <strong>{trickCelebration.playerName}</strong> চালটি জিতেছেন!
            </div>
            <div className="spotlight-pts-banner">
              +{trickCelebration.points} পয়েন্ট যোগ হয়েছে
            </div>
            <div className="spotlight-sub-direction">
              কার্ড সংগ্রহ করছেন: <strong>{getPlayerLabel(trickCelebration.winnerSeat)}</strong>
            </div>
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

      {/* Cards Played in Cardinal Diamond Layout (North Top, South Bottom, West Left, East Right) */}
      <div className={`trick-diamond-cluster ${isFlying ? `cards-flight-group fly-to-${winnerDir}` : ''}`}>
        {plays.length === 0 ? (
          <div className="empty-trick-cluster">
            <span className="stand-lead-prompt">
              {gameState.phase === 'PLAYING'
                ? 'Lead the trick'
                : 'Waiting for trick...'}
            </span>
          </div>
        ) : (
          plays.map((play: { card: Card; seat: number; playerId?: string }, index: number) => {
            const isWinnerCard = isCelebrating && trickCelebration.winnerSeat === play.seat;
            const suit = play.card.suit as Suit;
            const isRed = suit === 'hearts' || suit === 'diamonds';
            const isTrump = gameState.trumpSuit && suit === gameState.trumpSuit;
            const posClass = getCardPositionClass(play.seat);

            return (
              <div
                key={`${play.card.id}-${index}`}
                className={`diamond-card-slot ${posClass} ${isWinnerCard ? 'is-winner-card' : ''} ${
                  isRed ? 'red-suit' : 'black-suit'
                } animate-card-drop`}
              >
                {/* Winner Card Top Crown Callout */}
                {isWinnerCard && (
                  <div className="winner-card-halo animate-bounce-subtle">
                    <span className="halo-crown">👑</span>
                    <span className="halo-text">WINNER</span>
                  </div>
                )}

                {/* Upright Card Surface */}
                <div className={`card-face mini-upright ${isWinnerCard ? 'card-glow-gold' : ''}`}>
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

                  {isWinnerCard && <div className="card-win-overlay">জয়ী</div>}
                </div>

                {/* Meta details underneath card */}
                <div className="card-under-meta">
                  {/* Point Value Badge Underneath Card */}
                  <div
                    className={`card-points-badge ${
                      play.card.pointValue > 0 ? 'badge-has-pts' : 'badge-zero-pts'
                    }`}
                  >
                    {formatCardPoints(play.card.pointValue)}
                  </div>

                  {/* Trump Cut Indicator */}
                  {isTrump && gameState.trumpRevealed && (
                    <div className="card-trump-cut-tag">TRUMP</div>
                  )}

                  {/* Player Name Tag Underneath Point Badge */}
                  <div className={`card-player-tag ${isWinnerCard ? 'tag-winner-player' : ''}`} title={getPlayerLabel(play.seat)}>
                    {getPlayerLabel(play.seat)}
                  </div>
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
