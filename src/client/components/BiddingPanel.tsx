import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

const BiddingPanel: React.FC = () => {
  const { gameState, placeBid, passBid } = useGameStore();

  if (!gameState || gameState.highestBid === undefined) return null;

  const validBids = getValidBids(gameState.highestBid, gameState.settings || DEFAULT_GAME_RULES);

  // Show limited bid options for better UX
  const displayBids = validBids.slice(0, 6); // Show first 6 valid bids

  return (
    <div className="bidding-panel">
      <h3>Your Bid</h3>
      <p className="current-highest">
        Current highest: {gameState.highestBid || 'None'}
      </p>
      
      <div className="bid-buttons">
        {displayBids.map((bid) => (
          <button
            key={bid}
            className="btn btn-bid"
            onClick={() => placeBid(bid)}
          >
            {bid}
          </button>
        ))}
        
        {validBids.length > 6 && (
          <span className="more-bids">+{validBids.length - 6} more</span>
        )}
      </div>

      <button
        className="btn btn-pass"
        onClick={() => passBid()}
      >
        PASS
      </button>

      <div className="bid-info">
        <p>Min bid: {gameState.settings?.minBid || 16}</p>
        <p>Max bid: {gameState.settings?.maxBid || 28}</p>
      </div>
    </div>
  );
};

export default BiddingPanel;
