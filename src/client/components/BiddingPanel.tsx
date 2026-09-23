import React from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

const BiddingPanel: React.FC = () => {
  const { gameState, playerId, placeBid, passBid } = useGameStore();

  if (!gameState || gameState.highestBid === undefined) return null;

  const validBids = getValidBids(gameState.highestBid, gameState.settings || DEFAULT_GAME_RULES);

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];

  // Calculate current player's initial hand points
  const handPoints = (currentPlayer?.hand || []).reduce(
    (acc, card) => acc + (card.pointValue || 0),
    0
  );

  return (
    <div className="bidding-dock-modern">
      <div className="bidding-dock-header">
        <div className="bidding-status-info">
          <span className="bidding-title">YOUR TURN TO BID</span>
          <span className="bidding-highest-text">
            Highest:{' '}
            <strong className="gold-text">
              {gameState.highestBid ? `${gameState.highestBid} pts` : 'None (Min 16)'}
            </strong>
          </span>
        </div>

        <div className="bidding-hand-power" title="Total point value of your 4 cards">
          <span className="hand-power-label">Your Hand:</span>
          <span className="hand-power-val">{handPoints} pts</span>
        </div>
      </div>

      <div className="bidding-controls-row">
        <div className="bid-chips-scroller">
          {validBids.map((bid) => (
            <button
              key={bid}
              className="btn-bid-chip"
              onClick={() => placeBid(bid)}
              title={`Bid ${bid} points`}
            >
              {bid}
            </button>
          ))}
        </div>

        <button
          className="btn-bid-pass"
          onClick={() => passBid()}
          title="Pass this bidding round"
        >
          PASS
        </button>
      </div>
    </div>
  );
};

export default BiddingPanel;
