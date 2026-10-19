import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';
import { playBidSound } from '../utils/audio';

const BiddingPanel: React.FC = () => {
  const { gameState, playerId, placeBid, passBid } = useGameStore();

  if (!gameState || gameState.phase !== 'BIDDING') return null;

  const validBids = getValidBids(
    gameState.highestBid || null,
    gameState.settings || DEFAULT_GAME_RULES
  );
  const minValidBid = validBids.length > 0 ? validBids[0] : 16;

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];

  const handPoints = (currentPlayer?.hand || []).reduce(
    (acc, card) => acc + (card.pointValue || 0),
    0
  );

  const isMyTurn = currentPlayer?.seat === gameState.currentTurn;
  const currentBidder = gameState.players.find((p) => p.seat === gameState.currentTurn);
  const highestBidder = gameState.players.find((p) => p.seat === gameState.winningBidder);

  const handlePlaceBid = (bidVal: number) => {
    if (!isMyTurn) return;
    playBidSound();
    placeBid(bidVal);
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    passBid();
  };

  // Generate range 16 to 28
  const allBids = Array.from({ length: 13 }, (_, i) => 16 + i);

  return (
    <div className="classic-bidding-console animate-fade-in">
      {/* Top Banner: Turn Status & Info */}
      <div className={`bidding-status-bar ${isMyTurn ? 'my-turn' : 'waiting'}`}>
        <div className="status-left">
          {isMyTurn ? (
            <span className="turn-label active-glow">
              👉 YOUR TURN TO BID
            </span>
          ) : (
            <span className="turn-label">
              ⏳ {currentBidder?.username || `Seat ${gameState.currentTurn}`} is bidding...
            </span>
          )}
        </div>

        <div className="status-center">
          <span className="info-tag">
            Highest Bid: <strong>{gameState.highestBid ? `${gameState.highestBid} pts (${highestBidder?.username || `Seat ${gameState.winningBidder}`})` : 'None (Open 16)'}</strong>
          </span>
        </div>

        <div className="status-right">
          <span className="hand-pts-tag" title="Total points in your 4 cards">
            Your Cards: <strong>{handPoints} pts</strong>
          </span>
        </div>
      </div>

      {/* Buttons Row: Pass + Direct Bid Buttons */}
      <div className="bidding-buttons-row">
        {/* Pass Button */}
        <button
          type="button"
          className="btn-bid-pass"
          disabled={!isMyTurn}
          onClick={handlePass}
          title="Pass your bid this round"
        >
          PASS
        </button>

        {/* 16 to 28 Numbers */}
        <div className="bids-number-list">
          {allBids.map((b) => {
            const isValid = isMyTurn && validBids.includes(b);
            const isMin = b === minValidBid && isMyTurn;

            return (
              <button
                key={b}
                type="button"
                className={`btn-bid-num ${isValid ? 'is-valid' : 'is-disabled'} ${isMin ? 'is-min-suggested' : ''}`}
                disabled={!isValid}
                onClick={() => handlePlaceBid(b)}
                title={isValid ? `Bid ${b} points` : `Minimum bid is ${minValidBid}`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BiddingPanel;
