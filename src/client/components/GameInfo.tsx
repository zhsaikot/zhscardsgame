import React from 'react';
import { useGameStore } from '../game/useGameStore';

const GameInfo: React.FC = () => {
  const { gameState, playerId } = useGameStore();

  if (!gameState) return null;

  const getPlayerName = (seat: number) => {
    const player = gameState.players.find(p => p.seat === seat);
    return player?.username || `Player ${seat}`;
  };

  const getSuitSymbol = (suit: string | null) => {
    switch (suit) {
      case 'spades': return '♠';
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      default: return '';
    }
  };

  return (
    <div className="game-info">
      <div className="info-section">
        <div className="round-info">
          <span className="label">Round</span>
          <span className="value">{gameState.roundNumber}</span>
        </div>
        <div className="trick-info">
          <span className="label">Trick</span>
          <span className="value">{gameState.completedTricks.length + 1}/8</span>
        </div>
      </div>

      <div className="score-section">
        <div className={`team-score team-a ${gameState.winningBidder && [1, 3].includes(gameState.winningBidder) ? 'bidder' : ''}`}>
          <span className="team-label">Team A (Seats 1, 3)</span>
          <span className="score-value">{gameState.teamPoints.A}</span>
          {gameState.gameScore && <span className="game-score">Total: {gameState.gameScore.teamA}</span>}
        </div>
        <div className={`team-score team-b ${gameState.winningBidder && [2, 4].includes(gameState.winningBidder) ? 'bidder' : ''}`}>
          <span className="team-label">Team B (Seats 2, 4)</span>
          <span className="score-value">{gameState.teamPoints.B}</span>
          {gameState.gameScore && <span className="game-score">Total: {gameState.gameScore.teamB}</span>}
        </div>
      </div>

      <div className="bid-section">
        {gameState.highestBid !== null && (
          <>
            <div className="current-bid">
              <span className="label">Current Bid</span>
              <span className="value">{gameState.highestBid}</span>
            </div>
            {gameState.winningBidder && (
              <div className="winning-bidder">
                <span className="label">Highest Bidder</span>
                <span className="value">{getPlayerName(gameState.winningBidder)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="trump-section">
        {gameState.trumpSuit && (
          <div className="trump-display">
            <span className="label">Trump</span>
            <span className={`suit-icon ${gameState.trumpSuit}`}>
              {getSuitSymbol(gameState.trumpSuit)} {gameState.trumpSuit}
            </span>
          </div>
        )}
      </div>

      <div className="dealer-section">
        {gameState.dealer && (
          <div className="dealer-indicator">
            <span className="label">Dealer</span>
            <span className="value">Player {gameState.dealer}</span>
          </div>
        )}
      </div>

      <div className="phase-indicator">
        <span className={`phase phase-${gameState.phase.toLowerCase()}`}>
          {gameState.phase.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
};

export default GameInfo;
