import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

const BiddingPanel: React.FC = () => {
  const { gameState, placeBid, passBid } = useGameStore();

  if (!gameState || gameState.highestBid === undefined) return null;

  const validBids = getValidBids(gameState.highestBid, gameState.settings || DEFAULT_GAME_RULES);

  return (
    <div className="bidding-panel">
      <h3 className="gold-text">Place Your Bid</h3>
      <p className="current-highest">
        Current Highest:{' '}
        <strong style={{ color: 'var(--gold-light)' }}>
          {gameState.highestBid ? `${gameState.highestBid} pts` : 'No bids yet (Min 16)'}
        </strong>
      </p>

      <div className="bid-buttons">
        {validBids.map((bid) => (
          <button
            key={bid}
            className="btn-chip"
            onClick={() => placeBid(bid)}
            title={`Bid ${bid} points`}
          >
            {bid}
          </button>
        ))}
      </div>

      <button
        className="btn btn-pass"
        onClick={() => passBid()}
        style={{ width: '100%', marginTop: '0.4rem', padding: '0.75rem' }}
      >
        PASS BID
      </button>
    </div>
  );
};

export default BiddingPanel;
