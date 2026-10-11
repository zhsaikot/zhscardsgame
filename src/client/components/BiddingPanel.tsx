import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

const ALL_BID_NUMBERS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];

const BiddingPanel: React.FC = () => {
  const { gameState, playerId, placeBid, passBid } = useGameStore();

  if (!gameState || gameState.phase !== 'BIDDING') return null;

  const validBids = getValidBids(gameState.highestBid, gameState.settings || DEFAULT_GAME_RULES);
  const minValidBid = validBids.length > 0 ? validBids[0] : 29;

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];

  const handPoints = (currentPlayer?.hand || []).reduce(
    (acc, card) => acc + (card.pointValue || 0),
    0
  );

  const highestBidderPlayer = gameState.players.find(
    (p) => p.seat === gameState.winningBidder
  );

  return (
    <div className="bidding-panel-card">
      {/* Header with Title and Current Bid Stats */}
      <div className="bidding-card-header">
        <div className="bidding-header-left">
          <h3 className="bidding-title-text">Bidding / বিডিং</h3>
          <span className="bidding-sub-text">
            {gameState.highestBid
              ? `Highest: ${gameState.highestBid} by ${
                  highestBidderPlayer?.username || `Seat ${gameState.winningBidder}`
                }`
              : 'Opening Bid (Min 16)'}
          </span>
        </div>

        <div className="bidding-hand-chip" title="Your first 4 cards point sum">
          <span className="hand-chip-lbl">Hand:</span>
          <span className="hand-chip-val">{handPoints} pts</span>
        </div>
      </div>

      {/* 4x3 Grid of Bid Numbers (16 through 28) */}
      <div className="bidding-grid-container">
        {ALL_BID_NUMBERS.map((bid) => {
          const isValid = validBids.includes(bid);
          const isHighest = gameState.highestBid === bid;

          return (
            <button
              key={bid}
              type="button"
              className={`bid-number-btn ${isValid ? 'is-valid' : 'is-disabled'} ${
                isHighest ? 'is-current-highest' : ''
              }`}
              disabled={!isValid}
              onClick={() => isValid && placeBid(bid)}
              title={
                isValid
                  ? `Bid ${bid} points`
                  : bid <= (gameState.highestBid || 15)
                  ? `Must be higher than ${gameState.highestBid || 15}`
                  : `Bid ${bid}`
              }
            >
              {bid}
            </button>
          );
        })}
      </div>

      {/* Bottom Action Row: PASS and DOUBLE */}
      <div className="bidding-bottom-actions">
        <button
          type="button"
          className="btn-bid-pass-action"
          onClick={() => passBid()}
          title="Pass this round / পাস করুন"
        >
          <span className="action-main">PASS</span>
          <span className="action-sub">পাস</span>
        </button>

        <button
          type="button"
          className="btn-bid-double-action"
          onClick={() => {
            // If valid, bid next step or highest + 1
            if (validBids.length > 0) {
              placeBid(validBids[0]);
            }
          }}
          disabled={validBids.length === 0}
          title={`Place minimum valid bid (${minValidBid})`}
        >
          <span className="action-main">BID {minValidBid <= 28 ? minValidBid : 'MAX'}</span>
          <span className="action-sub">বিড করুন</span>
        </button>
      </div>
    </div>
  );
};

export default BiddingPanel;
