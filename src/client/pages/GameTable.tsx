import React, { useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import PlayerHand from '../components/PlayerHand';
import GameInfo from '../components/GameInfo';
import BiddingPanel from '../components/BiddingPanel';
import TrumpSelection from '../components/TrumpSelection';
import TableCards from '../components/TableCards';

// SVG Crests for In-Game
const LionMiniCrest = () => (
  <svg width="14" height="16" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L2 4.5V13C2 19.5 6.3 25.5 12 27C17.7 25.5 22 19.5 22 13V4.5L12 1Z" fill="#0c2e24" stroke="#34d399" strokeWidth="1.5" />
    <path d="M12 7L13.5 10H16L14 12L15 15L12 13.5L9 15L10 12L8 10H10.5L12 7Z" fill="#6ee7b7" />
  </svg>
);

const GriffinMiniCrest = () => (
  <svg width="14" height="16" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L2 4.5V13C2 19.5 6.3 25.5 12 27C17.7 25.5 22 19.5 22 13V4.5L12 1Z" fill="#29121a" stroke="#f87171" strokeWidth="1.5" />
    <path d="M12 8L15 11L13 13L16 16L12 14L8 16L11 13L9 11L12 8Z" fill="#fca5a5" />
  </svg>
);

const GameTable: React.FC = () => {
  const { gameState, playerId, leaveGame, nextRound } = useGameStore();
  const [showRulesModal, setShowRulesModal] = useState(false);

  if (!gameState) {
    return (
      <div className="connection-screen">
        <div className="connection-logo">29</div>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--gold-light)' }}>Loading table...</p>
        <button onClick={leaveGame} className="btn-join-gold" style={{ marginTop: '1rem' }}>
          Return to Lobby
        </button>
      </div>
    );
  }

  const currentPlayer =
    gameState.players.find((p) => p.id === playerId) ||
    gameState.players.find((p) => !p.isBot) ||
    gameState.players[0];
  const mySeat = currentPlayer?.seat || 1;

  // Compute 4 seats relative to current player:
  // South = You, West = Left opponent, North = Partner, East = Right opponent
  const getSeatForDirection = (offset: number) => {
    return ((mySeat - 1 + offset) % 4) + 1;
  };

  const northSeat = getSeatForDirection(2); // Partner
  const westSeat = getSeatForDirection(1);  // Opponent Left
  const eastSeat = getSeatForDirection(3);  // Opponent Right
  const southSeat = mySeat;                 // Local Player

  const getPlayerAtSeat = (seat: number) => {
    return gameState.players.find((p) => p.seat === seat);
  };

  const renderPlayerPod = (seat: number, directionClass: string, label: string) => {
    const player = getPlayerAtSeat(seat);
    const isCurrentTurn = gameState.currentTurn === seat;
    const isDealer = gameState.dealer === seat;
    const isWinningBidder = gameState.winningBidder === seat;
    const isTeamA = [1, 3].includes(seat);
    const cardCount = player?.hand?.length ?? 8;
    const isBot = player?.isBot || false;

    return (
      <div
        className={`player-pod ${directionClass} ${isCurrentTurn ? 'active-turn' : ''}`}
        key={seat}
      >
        <div className="player-avatar-ring">
          {isDealer && <div className="dealer-chip" title="Dealer">D</div>}
          {isWinningBidder && <div className="bidder-crown" title="Winning Bidder">👑</div>}
          <div className="player-avatar-inner">
            {player?.username ? player.username.substring(0, 2).toUpperCase() : `P${seat}`}
          </div>
        </div>

        <div className="player-meta-box">
          <div className="player-name-row">
            <span className="player-name-text">
              {seat === mySeat ? 'You' : player?.username || `Seat ${seat}`}
            </span>
            {isBot && <span className="bot-tag">BOT</span>}
          </div>

          <div className="player-team-row">
            {isTeamA ? <LionMiniCrest /> : <GriffinMiniCrest />}
            <span className="player-team-label" style={{ color: isTeamA ? '#6ee7b7' : '#fca5a5' }}>
              {label} ({isTeamA ? 'Team A' : 'Team B'})
            </span>
          </div>

          {seat !== mySeat && (
            <div className="player-cards-count" title={`${cardCount} cards remaining`}>
              {Array.from({ length: Math.min(cardCount, 8) }).map((_, i) => (
                <div key={i} className="mini-card-back" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getStatusText = () => {
    if (gameState.phase === 'BIDDING') {
      return gameState.currentTurn === mySeat
        ? 'Your turn to place a bid!'
        : `${getPlayerAtSeat(gameState.currentTurn || 1)?.username || `Seat ${gameState.currentTurn}`} is placing bid...`;
    }
    if (gameState.phase === 'TRUMP_SELECTION') {
      return gameState.winningBidder === mySeat
        ? 'You won the bid! Choose the Trump Suit.'
        : `${getPlayerAtSeat(gameState.winningBidder || 1)?.username || `Seat ${gameState.winningBidder}`} is selecting Trump...`;
    }
    if (gameState.phase === 'PLAYING') {
      return gameState.currentTurn === mySeat
        ? 'Your turn! Select a card to play.'
        : `${getPlayerAtSeat(gameState.currentTurn || 1)?.username || `Seat ${gameState.currentTurn}`} is playing card...`;
    }
    if (gameState.phase === 'ROUND_COMPLETE') {
      return 'Round Complete!';
    }
    return gameState.phase.replace(/_/g, ' ');
  };

  const isMyTurn = gameState.currentTurn === mySeat;

  return (
    <div className="game-table-modern">
      {/* Top HUD */}
      <GameInfo onToggleRules={() => setShowRulesModal(true)} />

      {/* Main Felt Stadium Arena */}
      <div className="felt-arena-container">
        <div className="felt-table-modern">
          <div className="felt-table-inner-glow" />
          <div className="felt-watermark">29</div>

          {/* North Pod (Partner) */}
          {renderPlayerPod(northSeat, 'pod-north', 'Partner')}

          {/* West Pod (Opponent) */}
          {renderPlayerPod(westSeat, 'pod-west', 'Opponent')}

          {/* East Pod (Opponent) */}
          {renderPlayerPod(eastSeat, 'pod-east', 'Opponent')}

          {/* South Pod (You) */}
          {renderPlayerPod(southSeat, 'pod-south', 'You')}

          {/* Center Trick Plays */}
          <TableCards mySeat={mySeat} />

          {/* Center Status Floating Pill */}
          <div className={`table-status-pill ${isMyTurn ? 'your-turn' : ''}`}>
            {getStatusText()}
          </div>
        </div>

        {/* Bidding Controls Modal/Dock */}
        {gameState.phase === 'BIDDING' && isMyTurn && <BiddingPanel />}

        {/* Trump Selection Modal */}
        {gameState.phase === 'TRUMP_SELECTION' && gameState.winningBidder === mySeat && (
          <TrumpSelection />
        )}

        {/* Round Complete Modal */}
        {gameState.phase === 'ROUND_COMPLETE' && (
          <div className="modal-overlay">
            <div className="modal-box-sleek result-screen">
              <h2 className="modal-title-sleek gold-text">Round Complete!</h2>
              <p className="modal-subtitle-sleek">
                {gameState.contractResult === 'success'
                  ? '🎉 The contract was successfully fulfilled!'
                  : '⚠️ The contract was not fulfilled.'}
              </p>

              <div
                className={`result-contract-badge ${
                  gameState.contractResult === 'success' ? 'success' : 'failure'
                }`}
              >
                Contract: {gameState.contractResult?.toUpperCase() || 'EVALUATED'}
              </div>

              <div className="result-stats">
                <div className="result-stat-box team-a-box">
                  <div className="result-stat-val" style={{ color: 'var(--team-a-color)' }}>
                    {gameState.teamPoints?.A ?? 0}
                  </div>
                  <div className="result-stat-lbl">Team A Points</div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Total Match: {gameState.gameScore?.teamA ?? 0}
                  </span>
                </div>

                <div className="result-stat-box team-b-box">
                  <div className="result-stat-val" style={{ color: 'var(--team-b-color)' }}>
                    {gameState.teamPoints?.B ?? 0}
                  </div>
                  <div className="result-stat-lbl">Team B Points</div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Total Match: {gameState.gameScore?.teamB ?? 0}
                  </span>
                </div>
              </div>

              <button
                className="btn-emerald-sleek"
                onClick={() => nextRound()}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
              >
                Start Next Round
              </button>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRulesModal && (
          <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
            <div className="modal-box-sleek" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <h2 className="modal-title-sleek gold-text">29 Game Rules &amp; Points</h2>
              <div className="rules-grid" style={{ width: '100%', margin: '1rem 0' }}>
                <div className="rule-chip">
                  <div className="rule-chip-val">3 pts</div>
                  <div className="rule-chip-label">Jacks (J)</div>
                </div>
                <div className="rule-chip">
                  <div className="rule-chip-val">2 pts</div>
                  <div className="rule-chip-label">Nines (9)</div>
                </div>
                <div className="rule-chip">
                  <div className="rule-chip-val">1 pt</div>
                  <div className="rule-chip-label">Aces (A)</div>
                </div>
                <div className="rule-chip">
                  <div className="rule-chip-val">1 pt</div>
                  <div className="rule-chip-label">Tens (10)</div>
                </div>
                <div className="rule-chip">
                  <div className="rule-chip-val">0 pts</div>
                  <div className="rule-chip-label">K, Q, 8, 7</div>
                </div>
                <div className="rule-chip">
                  <div className="rule-chip-val">+1 pt</div>
                  <div className="rule-chip-label">Last Trick</div>
                </div>
              </div>
              <ul className="rules-list" style={{ marginBottom: '1.5rem' }}>
                <li>Power ranking: J &gt; 9 &gt; A &gt; 10 &gt; K &gt; Q &gt; 8 &gt; 7</li>
                <li>Teams: Seats 1 &amp; 3 (Team A) vs Seats 2 &amp; 4 (Team B)</li>
                <li>Highest bidder chooses the secret Trump suit</li>
                <li>Players must follow the lead suit if they hold any cards of that suit</li>
              </ul>
              <button
                className="btn-join-gold"
                onClick={() => setShowRulesModal(false)}
                style={{ width: '100%', padding: '0.8rem' }}
              >
                Close Guide
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Player Hand Area */}
      <div className="player-hand-container">
        {currentPlayer && (
          <PlayerHand
            hand={currentPlayer.hand || []}
            isCurrentTurn={gameState.phase === 'PLAYING' && isMyTurn}
            leadSuit={gameState.leadSuit}
          />
        )}
      </div>
    </div>
  );
};

export default GameTable;
