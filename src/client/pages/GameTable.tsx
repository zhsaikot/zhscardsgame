import React from 'react';
import { useGameStore } from '../game/useGameStore';
import PlayerHand from '../components/PlayerHand';
import GameInfo from '../components/GameInfo';
import BiddingPanel from '../components/BiddingPanel';
import TrumpSelection from '../components/TrumpSelection';
import TableCards from '../components/TableCards';

const GameTable: React.FC = () => {
  const { gameState, playerId, leaveGame } = useGameStore();

  if (!gameState) {
    return (
      <div className="game-table loading">
        <p>Loading game...</p>
        <button onClick={leaveGame} className="btn btn-secondary">
          Leave Game
        </button>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const playerSeat = currentPlayer?.seat;

  return (
    <div className="game-table">
      <GameInfo />

      <div className="table-area">
        {/* Opponent at top (seat opposite to player) */}
        <div className="opponent-hand">
          <div className="player-info">
            <span>Opponent</span>
          </div>
          <div className="cards-back">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card-back" />
            ))}
          </div>
        </div>

        {/* Center table area */}
        <div className="center-table">
          <TableCards />
          
          {gameState.phase === 'BIDDING' && playerSeat === gameState.currentTurn && (
            <BiddingPanel />
          )}

          {gameState.phase === 'TRUMP_SELECTION' && 
           playerSeat === gameState.winningBidder && (
            <TrumpSelection />
          )}

          <div className="turn-indicator">
            {gameState.phase === 'PLAYING' && (
              <span>
                {gameState.currentTurn === playerSeat 
                  ? "Your Turn!" 
                  : `Player ${gameState.currentTurn}'s turn`}
              </span>
            )}
            {gameState.phase === 'BIDDING' && (
              <span>
                {gameState.currentTurn === playerSeat
                  ? "Your bid"
                  : `Player ${gameState.currentTurn} bidding`}
              </span>
            )}
          </div>
        </div>

        {/* Player's hand at bottom */}
        <div className="player-hand-container">
          {currentPlayer && (
            <PlayerHand 
              hand={currentPlayer.hand} 
              isCurrentTurn={gameState.currentTurn === playerSeat}
              leadSuit={gameState.leadSuit}
            />
          )}
        </div>
      </div>

      <button onClick={leaveGame} className="btn btn-leave">
        Leave Game
      </button>
    </div>
  );
};

export default GameTable;
