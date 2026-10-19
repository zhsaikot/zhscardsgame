import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

const PRESET_BIDS = [16, 17, 20, 24, 28];

interface BiddingPanelProps {
  onPlaySelectedCard?: () => void;
  canPlaySelectedCard?: boolean;
}

const BiddingPanel: React.FC<BiddingPanelProps> = ({
  onPlaySelectedCard,
  canPlaySelectedCard = false,
}) => {
  const { gameState, playerId, placeBid, passBid, leaveGame } = useGameStore();

  const validBids = getValidBids(
    gameState?.highestBid || null,
    gameState?.settings || DEFAULT_GAME_RULES
  );
  const minValidBid = validBids.length > 0 ? validBids[0] : 16;

  const [selectedBid, setSelectedBid] = useState<number>(minValidBid);

  // Sync selected bid if minValidBid increases beyond it
  React.useEffect(() => {
    if (selectedBid < minValidBid && minValidBid <= 28) {
      setSelectedBid(minValidBid);
    }
  }, [minValidBid, selectedBid]);

  if (!gameState) return null;

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

  const isMyBiddingTurn = currentPlayer?.seat === gameState.currentTurn;
  const currentBidderPlayer = gameState.players.find(
    (p) => p.seat === gameState.currentTurn
  );

  const isBiddingPhase = gameState.phase === 'BIDDING';
  const isPlayingPhase = gameState.phase === 'PLAYING';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSelectedBid(val);
  };

  const handlePresetClick = (bid: number) => {
    if (bid >= minValidBid) {
      setSelectedBid(bid);
    }
  };

  const isSelectedBidValid = isMyBiddingTurn && validBids.includes(selectedBid);

  return (
    <div className="esports-bidding-dock">
      {/* Top Slider & Presets (only during Bidding Phase) */}
      {isBiddingPhase && (
        <div className="esports-slider-section">
          {/* Active Turn Announcement Pill */}
          <div className={`esports-bid-turn-pill ${isMyBiddingTurn ? 'my-turn' : 'waiting-turn'}`}>
            {isMyBiddingTurn ? (
              <span className="turn-glow-text">👉 আপনার বিডের পালা / YOUR TURN TO BID</span>
            ) : (
              <span className="turn-waiting-text">
                ⏳ {currentBidderPlayer?.username || `Seat ${gameState.currentTurn}`} বিড করছেন...
              </span>
            )}
            <span className="hand-points-chip" title="Your 4 cards point sum">
              হাতে: {handPoints} pts
            </span>
          </div>

          {/* Slider Range Bar */}
          <div className="esports-slider-row">
            <span className="slider-range-val">16</span>
            <input
              type="range"
              min="16"
              max="28"
              value={selectedBid}
              disabled={!isMyBiddingTurn}
              onChange={handleSliderChange}
              className="esports-bid-slider"
            />
            <span className="slider-range-val">28</span>
          </div>

          {/* Preset Pills matching reference: Min, 17, 20, 24, All In */}
          <div className="esports-presets-row">
            <button
              type="button"
              className={`preset-pill ${selectedBid === minValidBid ? 'active' : ''}`}
              disabled={!isMyBiddingTurn}
              onClick={() => handlePresetClick(minValidBid)}
            >
              Min ({minValidBid})
            </button>
            {PRESET_BIDS.filter((b) => b > minValidBid).map((b) => (
              <button
                key={b}
                type="button"
                className={`preset-pill ${selectedBid === b ? 'active' : ''}`}
                disabled={!isMyBiddingTurn || b < minValidBid}
                onClick={() => handlePresetClick(b)}
              >
                {b === 28 ? 'All In (28)' : b === 20 ? '20 (Pot)' : b}
              </button>
            ))}
            <div className="preset-selected-display">
              Target: <strong>{selectedBid}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main 3 Action Buttons matching reference image (Fold / Bid / Play Card) */}
      <div className="esports-actions-grid">
        {/* 1. Red Action Button: FOLD / PASS */}
        <button
          type="button"
          className="btn-esports-red"
          disabled={!isBiddingPhase || !isMyBiddingTurn}
          onClick={() => passBid()}
          title="Fold / Pass this round (পাস)"
        >
          <span className="btn-main-label">Fold (পাস)</span>
          <span className="btn-sub-label">Pass</span>
        </button>

        {/* 2. Crisp White Action Button: BID */}
        <button
          type="button"
          className="btn-esports-white"
          disabled={!isBiddingPhase || !isMyBiddingTurn || !isSelectedBidValid}
          onClick={() => isSelectedBidValid && placeBid(selectedBid)}
          title={`Bid ${selectedBid} points`}
        >
          <span className="btn-main-label">
            {isBiddingPhase ? `Bid ${selectedBid} (বিড)` : 'Check'}
          </span>
          <span className="btn-sub-label">
            {gameState.highestBid ? `Highest: ${gameState.highestBid}` : 'Open 16'}
          </span>
        </button>

        {/* 3. Blue Glowing Action Button: RAISE / PLAY CARD */}
        <button
          type="button"
          className="btn-esports-blue"
          disabled={
            isBiddingPhase
              ? !isMyBiddingTurn || validBids.length === 0
              : !canPlaySelectedCard
          }
          onClick={() => {
            if (isBiddingPhase) {
              if (validBids.length > 0) placeBid(validBids[0]);
            } else if (onPlaySelectedCard) {
              onPlaySelectedCard();
            }
          }}
          title={isBiddingPhase ? 'Place Minimum Bid' : 'Play Selected Card (চাল দিন)'}
        >
          <span className="btn-main-label">
            {isBiddingPhase ? `Bid Min (${minValidBid})` : 'Play Card (চালুন)'}
          </span>
          <span className="btn-sub-label">
            {isBiddingPhase ? 'Quick Bid' : 'তোমার চাল'}
          </span>
        </button>
      </div>

      {/* Leave table link on right */}
      <div className="esports-leave-row">
        <button
          type="button"
          className="btn-leave-table-link"
          onClick={() => {
            if (window.confirm('Are you sure you want to leave the table? / আপনি কি খেলা ত্যাগ করতে চান?')) {
              leaveGame();
            }
          }}
        >
          <span>🚪</span>
          <span>Leave table</span>
        </button>
      </div>
    </div>
  );
};

export default BiddingPanel;
