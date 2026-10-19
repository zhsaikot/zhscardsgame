import React from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Card, Suit } from '@shared/types';
import { SUIT_SYMBOLS } from './PlayerHand';

interface TableCardsProps {
  mySeat?: number;
}

const TableCards: React.FC<TableCardsProps> = ({ mySeat = 1 }) => {
  const { gameState, trickCelebration } = useGameStore();

  if (!gameState) return null;

  const currentTrick = gameState.currentTrick;
  const plays = currentTrick?.plays || [];
  const points = currentTrick?.points ?? 0;
  const trickNum = (gameState.completedTricks?.length || 0) + 1;

  const isCelebrating = !!trickCelebration;
  const isFlying = trickCelebration?.phase === 'flying';

  // Get label for player seat
  const getPlayerLabel = (seat?: number) => {
    if (!seat) return '';
    const player = gameState.players.find((p) => p.seat === seat);
    if (seat === mySeat) return 'You (সাউথ)';
    return player?.username || `Seat ${seat}`;
  };

  // Cardinal position class for each played card (North top, South bottom, West left, East right)
  const getCardPositionClass = (seat: number) => {
    const diff = (seat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'card-pos-south'; // Bottom (Me)
      case 1: return 'card-pos-west';  // Left
      case 2: return 'card-pos-north'; // Top (Partner)
      case 3: return 'card-pos-east';  // Right
      default: return 'card-pos-south';
    }
  };

  // Flight direction
  const getWinnerFlightDirection = (winnerSeat?: number): string => {
    if (!winnerSeat) return 'south';
    const diff = (winnerSeat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'south';
      case 1: return 'west';
      case 2: return 'north';
      case 3: return 'east';
      default: return 'south';
    }
  };

  const winnerDir = getWinnerFlightDirection(trickCelebration?.winnerSeat);

  // Format card point values
  const formatCardPoints = (pts: number) => {
    if (pts > 0) return `+${pts}`;
    return '0';
  };

  // Determine which seats have played so far
  const playedSeats = plays.map((p) => p.seat);
  const allSeats = [mySeat, (mySeat % 4) + 1, ((mySeat + 1) % 4) + 1, ((mySeat + 2) % 4) + 1];
  const pendingSeats = allSeats.filter((s) => !playedSeats.includes(s));

  return (
    <div className="esports-trick-zone">
      {/* POT / Trick Points Pill matching reference image (POT: $240) */}
      <div className="esports-pot-banner">
        {isCelebrating ? (
          <div className="esports-winner-announcement animate-pop">
            <span className="announcement-crown">👑</span>
            <span className="announcement-text">
              <strong>{trickCelebration.playerName}</strong> চাল জিতেছেন! (+{trickCelebration.points} pts)
            </span>
          </div>
        ) : (
          <div className="esports-pot-chip">
            <span className="pot-lbl">POT:</span>
            <strong className="pot-amount">{points > 0 ? `${points * 60} pts (${points} pts)` : 'Trick ' + Math.min(trickNum, 8) + '/8'}</strong>
          </div>
        )}
      </div>

      {/* Played Cards in Cardinal Diamond Arrangement */}
      <div className={`esports-cards-stage ${isFlying ? `cards-flight-group fly-to-${winnerDir}` : ''}`}>
        {plays.length === 0 ? (
          <div className="esports-empty-table-slots">
            <div className="slot-dashed top"><span>?</span></div>
            <div className="slot-dashed left"><span>?</span></div>
            <div className="slot-dashed right"><span>?</span></div>
            <div className="slot-dashed bottom"><span>?</span></div>
            <span className="empty-lead-hint">
              {gameState.phase === 'PLAYING' ? 'Lead the trick' : 'Waiting for play...'}
            </span>
          </div>
        ) : (
          <>
            {plays.map((play: { card: Card; seat: number }, index: number) => {
              const isWinnerCard = isCelebrating && trickCelebration.winnerSeat === play.seat;
              const suit = play.card.suit as Suit;
              const isRed = suit === 'hearts' || suit === 'diamonds';
              const isTrump = gameState.trumpSuit && suit === gameState.trumpSuit;
              const posClass = getCardPositionClass(play.seat);

              return (
                <div
                  key={`${play.card.id}-${index}`}
                  className={`esports-card-slot ${posClass} ${isWinnerCard ? 'is-winner-card' : ''} ${
                    isRed ? 'red-suit' : 'black-suit'
                  } animate-card-drop`}
                >
                  {/* Winner Top Halo Callout */}
                  {isWinnerCard && (
                    <div className="winner-halo-chip">
                      <span>👑 WINNER</span>
                    </div>
                  )}

                  {/* Upright Card Surface matching reference image */}
                  <div className={`esports-card-face ${isWinnerCard ? 'card-glow-gold' : ''}`}>
                    <div className="card-corner top-left">
                      <span className="card-rank">{play.card.rank}</span>
                      <span className="card-suit-icon">{SUIT_SYMBOLS[suit]}</span>
                    </div>

                    <div className="card-center">
                      <span className="card-center-icon">{SUIT_SYMBOLS[suit]}</span>
                    </div>

                    <div className="card-corner bottom-right">
                      <span className="card-rank">{play.card.rank}</span>
                      <span className="card-suit-icon">{SUIT_SYMBOLS[suit]}</span>
                    </div>
                  </div>

                  {/* Meta Details Underneath Card */}
                  <div className="esports-card-meta">
                    <span
                      className={`card-pts-pill ${
                        play.card.pointValue > 0 ? 'has-points' : 'zero-points'
                      }`}
                    >
                      {formatCardPoints(play.card.pointValue)}
                    </span>
                    {isTrump && gameState.trumpRevealed && (
                      <span className="trump-cut-tag">TRUMP</span>
                    )}
                    <span className="card-player-label" title={getPlayerLabel(play.seat)}>
                      {getPlayerLabel(play.seat)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Render dashed empty slots for players who haven't played yet in this trick */}
            {gameState.phase === 'PLAYING' &&
              pendingSeats.map((seat) => {
                const posClass = getCardPositionClass(seat);
                return (
                  <div key={`pending-${seat}`} className={`esports-card-slot dashed-pending ${posClass}`}>
                    <div className="slot-dashed-box">
                      <span>?</span>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
};

export default TableCards;
