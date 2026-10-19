import React, { useEffect } from 'react';
import { useGameStore } from '../game/useGameStore';
import type { Card, Suit } from '@shared/types';
import { SUIT_SYMBOLS } from './PlayerHand';
import { playCardSound, playTrickWinSound } from '../utils/audio';

interface TableCardsProps {
  mySeat?: number;
}

const TableCards: React.FC<TableCardsProps> = ({ mySeat = 1 }) => {
  const { gameState, trickCelebration } = useGameStore();

  if (!gameState) return null;

  const currentTrick = gameState.currentTrick;
  const isCelebrating = !!trickCelebration;
  const isFlying = trickCelebration?.phase === 'flying';

  // Keep plays visible during 1.5s celebration pause!
  const plays = (isCelebrating && trickCelebration.trick?.plays?.length)
    ? trickCelebration.trick.plays
    : (currentTrick?.plays || []);

  const points = isCelebrating
    ? (trickCelebration.points ?? 0)
    : (currentTrick?.points ?? 0);

  const trickNum = Math.min((gameState.completedTricks?.length || 0) + 1, 8);

  // Play sound on celebration trigger
  useEffect(() => {
    if (isCelebrating && trickCelebration.phase === 'announcing') {
      playTrickWinSound();
    }
  }, [isCelebrating, trickCelebration?.winnerSeat]);

  // Player label helper
  const getPlayerLabel = (seat?: number) => {
    if (!seat) return '';
    const player = gameState.players.find((p) => p.seat === seat);
    if (seat === mySeat) return 'You';
    return player?.username || `Seat ${seat}`;
  };

  // Cardinal direction relative to South (You)
  const getCardPositionClass = (seat: number) => {
    const diff = (seat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'card-pos-south'; // Bottom (You)
      case 1: return 'card-pos-west';  // Left
      case 2: return 'card-pos-north'; // Top (Partner)
      case 3: return 'card-pos-east';  // Right
      default: return 'card-pos-south';
    }
  };

  const getWinnerFlightClass = (winnerSeat?: number) => {
    if (!winnerSeat) return 'fly-to-south';
    const diff = (winnerSeat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return 'fly-to-south';
      case 1: return 'fly-to-west';
      case 2: return 'fly-to-north';
      case 3: return 'fly-to-east';
      default: return 'fly-to-south';
    }
  };

  const flightClass = isFlying ? getWinnerFlightClass(trickCelebration?.winnerSeat) : '';

  const formatCardPoints = (pts: number) => {
    if (pts > 0) return `+${pts}`;
    return '0';
  };

  return (
    <div className="classic-trick-stage">
      {/* Center Trick Banner / Status Pill */}
      <div className="trick-center-header">
        {isCelebrating ? (
          <div className="trick-winner-pill animate-pop-in">
            <span className="winner-crown">👑</span>
            <span className="winner-text">
              <strong>{trickCelebration.playerName}</strong> won trick! (+{trickCelebration.points} pts)
            </span>
          </div>
        ) : (
          <div className="trick-counter-chip">
            <span>Trick {trickNum} of 8</span>
            {points > 0 && <span className="trick-pool-pts">• {points} pts</span>}
          </div>
        )}
      </div>

      {/* 4 Cards Diamond Stage */}
      <div className={`trick-diamond-felt ${flightClass}`}>
        {plays.length === 0 ? (
          <div className="empty-felt-placeholder">
            <div className="slot-outline top" />
            <div className="slot-outline left" />
            <div className="slot-outline right" />
            <div className="slot-outline bottom" />
            <span className="lead-prompt-text">
              {gameState.phase === 'PLAYING' ? 'Lead Card' : 'Waiting...'}
            </span>
          </div>
        ) : (
          plays.map((play: { card: Card; seat: number }, index: number) => {
            const isWinnerCard = isCelebrating && trickCelebration.winnerSeat === play.seat;
            const suit = play.card.suit as Suit;
            const isRed = suit === 'hearts' || suit === 'diamonds';
            const isTrump = gameState.trumpSuit && suit === gameState.trumpSuit;
            const posClass = getCardPositionClass(play.seat);

            return (
              <div
                key={`${play.card.id}-${index}`}
                className={`table-card-item ${posClass} ${isWinnerCard ? 'is-winner-card' : ''} ${
                  isRed ? 'red-suit' : 'black-suit'
                } animate-card-snap`}
              >
                {/* Winner Halo */}
                {isWinnerCard && (
                  <div className="winner-card-badge">
                    <span>WINNER</span>
                  </div>
                )}

                {/* Classic Playing Card Surface */}
                <div className={`classic-card-face ${isWinnerCard ? 'winner-glow' : ''}`}>
                  {/* Top-Left Rank & Suit */}
                  <div className="card-corner top-left">
                    <span className="rank-text">{play.card.rank}</span>
                    <span className="suit-icon">{SUIT_SYMBOLS[suit]}</span>
                  </div>

                  {/* Large Center Symbol */}
                  <div className="card-center">
                    <span className="center-suit-symbol">{SUIT_SYMBOLS[suit]}</span>
                  </div>

                  {/* Bottom-Right Rank & Suit */}
                  <div className="card-corner bottom-right">
                    <span className="rank-text">{play.card.rank}</span>
                    <span className="suit-icon">{SUIT_SYMBOLS[suit]}</span>
                  </div>
                </div>

                {/* Card Meta & Seat Name */}
                <div className="card-seat-meta">
                  <span className="player-seat-label">
                    {getPlayerLabel(play.seat)}
                  </span>
                  {play.card.pointValue > 0 && (
                    <span className="card-points-badge">
                      {formatCardPoints(play.card.pointValue)}
                    </span>
                  )}
                  {isTrump && gameState.trumpRevealed && (
                    <span className="trump-badge-small">TRUMP</span>
                  )}
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
