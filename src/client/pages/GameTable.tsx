import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/useGameStore';
import PlayerHand, { SUIT_SYMBOLS } from '../components/PlayerHand';
import BiddingPanel from '../components/BiddingPanel';
import TrumpSelection from '../components/TrumpSelection';
import TableCards from '../components/TableCards';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { getBotAvatar, getSavedAvatar, saveAvatar } from '../utils/avatar';
import { setSoundMuted, playTrumpRevealSound } from '../utils/audio';

const GameTable: React.FC = () => {
  const { gameState, playerId, leaveGame, nextRound, trickCelebration, avatar, setAvatar } = useGameStore();

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync sound toggle with audio utility
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setSoundMuted(!nextState);
  };

  // Sound effect when trump is revealed
  useEffect(() => {
    if (gameState?.trumpRevealed && gameState?.trumpSuit) {
      playTrumpRevealSound();
    }
  }, [gameState?.trumpRevealed, gameState?.trumpSuit]);

  if (!gameState) {
    return (
      <div className="connection-screen">
        <div className="connection-logo">29 CARD GAME</div>
        <div className="loading-spinner" />
        <p className="loading-text">Connecting to table...</p>
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

  // Seat offsets relative to current player:
  // South = You, West = Left opponent, North = Partner, East = Right opponent
  const getSeatForDirection = (offset: number) => {
    return ((mySeat - 1 + offset) % 4) + 1;
  };

  const northSeat = getSeatForDirection(2); // Partner
  const westSeat = getSeatForDirection(1);  // Opponent Left
  const eastSeat = getSeatForDirection(3);  // Opponent Right
  const southSeat = mySeat;                 // Local Player (You)

  const getPlayerAtSeat = (seat: number) => {
    return gameState.players.find((p) => p.seat === seat);
  };

  const isBiddingPhase = gameState.phase === 'BIDDING';
  const isPlayingPhase = gameState.phase === 'PLAYING';
  const isTrumpSelectionPhase = gameState.phase === 'TRUMP_SELECTION';
  const isMyTrumpSelection = isTrumpSelectionPhase && gameState.winningBidder === mySeat;

  const highestBidderPlayer = gameState.players.find(
    (p) => p.seat === gameState.winningBidder
  );

  // Helper to render circular golden-framed player seat
  const renderPlayerSeat = (seat: number, positionClass: string, roleTitle: string) => {
    const player = getPlayerAtSeat(seat);
    const isTurn = gameState.currentTurn === seat;
    const isDealer = gameState.dealer === seat;
    const isWinnerBidder = gameState.winningBidder === seat;
    const isTrickWinner = trickCelebration?.winnerSeat === seat;
    const isTeamA = [1, 3].includes(seat);
    const isBot = player?.isBot || false;
    const isMe = seat === mySeat;

    const avatarSrc = isMe
      ? avatar || player?.avatar || getSavedAvatar()
      : player?.avatar || getBotAvatar(seat);

    const wonTricks = (gameState.completedTricks || []).filter((t) => t.winner === seat);
    const cardCount = player?.hand?.length ?? (isPlayingPhase ? 8 - (gameState.completedTricks?.length || 0) : 4);

    return (
      <div
        key={seat}
        className={`classic-player-seat ${positionClass} ${isTurn ? 'is-turn-active' : ''} ${
          isTrickWinner ? 'is-trick-winner' : ''
        }`}
      >
        {/* Circular Avatar Ring */}
        <div
          className={`avatar-circle-frame ${isMe ? 'is-clickable-avatar' : ''}`}
          onClick={() => isMe && setShowAvatarModal(true)}
          title={isMe ? 'Click to change avatar' : player?.username || roleTitle}
        >
          <img src={avatarSrc} alt={player?.username || roleTitle} className="avatar-img" />
          {isTurn && <div className="turn-pulse-ring" />}
          {isDealer && <span className="dealer-badge" title="Dealer">D</span>}
          {isWinnerBidder && <span className="bidder-crown-badge" title="Winning Bidder">👑</span>}
        </div>

        {/* Player Info Plaque */}
        <div className="player-info-card">
          <div className="player-name-line">
            <span className="player-name">
              {isMe ? `${player?.username || 'You'} (You)` : player?.username || roleTitle}
            </span>
            {isBot && <span className="bot-tag">BOT</span>}
          </div>
          <div className="player-meta-line">
            <span className={`team-tag ${isTeamA ? 'team-a' : 'team-b'}`}>
              Team {isTeamA ? 'A' : 'B'}
            </span>
            <span className="cards-count-badge" title="Cards in hand">
              🂠 {cardCount}
            </span>
            {wonTricks.length > 0 && (
              <span className="tricks-won-badge" title="Tricks won this round">
                🏆 {wonTricks.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="classic-game-viewport">
      {/* Top Navigation Bar */}
      <header className="classic-top-bar">
        <div className="bar-brand">
          <span className="brand-suits">♠ ♥</span>
          <span className="brand-title">29 CARD GAME</span>
          <span className="brand-suits">♦ ♣</span>
          <span className="round-badge">Round {gameState.roundNumber || 1}</span>
        </div>

        <div className="bar-actions">
          <button
            type="button"
            className="bar-btn"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
          </button>
          <button
            type="button"
            className="bar-btn"
            onClick={() => setShowRulesModal(true)}
            title="Card Game Rules & Points"
          >
            📜 Rules
          </button>
          <button
            type="button"
            className="bar-btn btn-leave"
            onClick={() => {
              if (window.confirm('Are you sure you want to leave the table?')) {
                leaveGame();
              }
            }}
            title="Return to Lobby"
          >
            🚪 Leave Table
          </button>
        </div>
      </header>

      {/* Main Playing Arena: Royal Emerald Green Felt Table with Midnight Navy Rim */}
      <main className="classic-arena-container">
        <div className="classic-felt-table">
          <div className="table-navy-rim">
            <div className="table-emerald-felt">
              {/* Table Center Watermark */}
              <div className="table-watermark">29</div>

              {/* Top-Left: Dedicated Trump Plaque */}
              <div className="table-trump-box">
                <div className="plaque-header">TRUMP SUIT</div>
                <div className="plaque-body">
                  {!gameState.trumpSuit ? (
                    <span className="trump-pending-text">In Bidding...</span>
                  ) : !gameState.trumpRevealed ? (
                    <div className="trump-secret-card" title="Trump is hidden until revealed">
                      <span className="secret-lock">🔒</span>
                      <span className="secret-label">SECRET</span>
                    </div>
                  ) : (
                    <div className={`trump-revealed-card suit-${gameState.trumpSuit}`}>
                      <span className="revealed-icon">{SUIT_SYMBOLS[gameState.trumpSuit]}</span>
                      <span className="revealed-name">{gameState.trumpSuit.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top-Right: Dedicated Scoreboard Plaque */}
              <div className="table-scoreboard-box">
                <div className="plaque-header">MATCH SCOREBOARD</div>
                <div className="scoreboard-content">
                  <div className="score-row team-a">
                    <span className="score-team-name">Team A (You &amp; N):</span>
                    <strong className="score-points">{gameState.teamPoints?.A ?? 0} pts</strong>
                    <span className="score-match-won">({gameState.gameScore?.teamA ?? 0} wins)</span>
                  </div>
                  <div className="score-row team-b">
                    <span className="score-team-name">Team B (W &amp; E):</span>
                    <strong className="score-points">{gameState.teamPoints?.B ?? 0} pts</strong>
                    <span className="score-match-won">({gameState.gameScore?.teamB ?? 0} wins)</span>
                  </div>
                  <div className="contract-status-line">
                    <span className="contract-label">Contract:</span>
                    <span className="contract-value">
                      {gameState.highestBid
                        ? `${gameState.highestBid} pts (${highestBidderPlayer?.username || `Seat ${gameState.winningBidder}`})`
                        : 'Bidding'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Player Seats */}
              {renderPlayerSeat(northSeat, 'seat-north', 'Partner')}
              {renderPlayerSeat(westSeat, 'seat-west', 'Opponent Left')}
              {renderPlayerSeat(eastSeat, 'seat-east', 'Opponent Right')}
              {renderPlayerSeat(southSeat, 'seat-south', 'You')}

              {/* Center Trick Cards */}
              <TableCards mySeat={mySeat} />
            </div>
          </div>
        </div>

        {/* Bottom Console: Bidding Bar (during bidding) + Trump Selection (during trump selection) + Hand Cards */}
        <section className="classic-bottom-console">
          {isBiddingPhase && <BiddingPanel />}
          {isTrumpSelectionPhase && <TrumpSelection />}

          {currentPlayer && (
            <PlayerHand
              hand={currentPlayer.hand || []}
              isCurrentTurn={isPlayingPhase && gameState.currentTurn === mySeat}
              leadSuit={gameState.leadSuit}
            />
          )}
        </section>
      </main>

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <AvatarPickerModal
          currentAvatar={avatar || currentPlayer?.avatar || getSavedAvatar()}
          onClose={() => setShowAvatarModal(false)}
          onSelect={(newAvatar: string) => {
            setAvatar(newAvatar);
            saveAvatar(newAvatar);
            setShowAvatarModal(false);
          }}
        />
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal classic-rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title gold-text">29 Card Game Rules</h2>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowRulesModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body rules-text-content">
              <h3>Card Points Hierarchy</h3>
              <div className="rules-cards-grid">
                <div className="rules-card-badge"><strong>Jack (J)</strong>: 3 pts</div>
                <div className="rules-card-badge"><strong>Nine (9)</strong>: 2 pts</div>
                <div className="rules-card-badge"><strong>Ace (A)</strong>: 1 pt</div>
                <div className="rules-card-badge"><strong>Ten (10)</strong>: 1 pt</div>
                <div className="rules-card-badge muted">K, Q, 8, 7: 0 pts</div>
              </div>
              <p>Total Card Points in deck = <strong>28 pts</strong>. Winning the final 8th trick awards <strong>+1 bonus pt</strong> = <strong>29 total</strong>!</p>

              <h3>Bidding &amp; Teams</h3>
              <p>Partners sit opposite each other (Team A: South &amp; North, Team B: West &amp; East). Players bid from <strong>16 to 28</strong>. The highest bidder chooses the secret trump suit and must reach their bid to score.</p>

              <h3>Trick Play</h3>
              <p>Players must follow the lead suit if they have a card of that suit. If you have no card of the lead suit, you can play trump or discard any other suit.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-gold-action"
                onClick={() => setShowRulesModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameTable;
