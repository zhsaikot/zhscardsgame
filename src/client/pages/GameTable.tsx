import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/useGameStore';
import PlayerHand from '../components/PlayerHand';
import GameInfo from '../components/GameInfo';
import BiddingPanel from '../components/BiddingPanel';
import TrumpSelection from '../components/TrumpSelection';
import TableCards from '../components/TableCards';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { getBotAvatar, getSavedAvatar, saveAvatar } from '../utils/avatar';

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

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSystem?: boolean;
}

const GameTable: React.FC = () => {
  const { gameState, playerId, leaveGame, nextRound, trickCelebration, avatar, setAvatar } = useGameStore();

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPassLow, setAutoPassLow] = useState(false);

  // In-Game Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Dealer', text: 'Welcome to Royal 29 Card Room! Enjoy the game.', isSystem: true },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Track game actions in chat log
  useEffect(() => {
    if (!gameState) return;

    if (gameState.phase === 'BIDDING' && gameState.highestBid) {
      const bidder = gameState.players.find((p) => p.seat === gameState.winningBidder);
      const log = `${bidder?.username || 'Player'} placed highest bid: ${gameState.highestBid}`;
      setMessages((prev) => {
        if (prev[prev.length - 1]?.text === log) return prev;
        return [...prev, { id: String(Date.now()), sender: 'Table', text: log, isSystem: true }];
      });
    }

    if (gameState.phase === 'PLAYING' && gameState.trumpRevealed && gameState.trumpSuit) {
      const log = `Trump revealed: ${gameState.trumpSuit.toUpperCase()}!`;
      setMessages((prev) => {
        if (prev[prev.length - 1]?.text === log) return prev;
        return [...prev, { id: String(Date.now()), sender: 'Table', text: log, isSystem: true }];
      });
    }
  }, [gameState?.phase, gameState?.highestBid, gameState?.trumpRevealed, gameState?.trumpSuit]);

  if (!gameState) {
    return (
      <div className="connection-screen">
        <div className="connection-logo">২৯</div>
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

  // Seat offsets relative to current player:
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

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: currentPlayer?.username || 'You',
      text: chatInput.trim(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  const isMyTurn = gameState.currentTurn === mySeat;
  const isBiddingPhase = gameState.phase === 'BIDDING';
  const isMyBiddingTurn = isBiddingPhase && isMyTurn;

  const renderPlayerPod = (seat: number, directionClass: string, label: string) => {
    const player = getPlayerAtSeat(seat);
    const isCurrentTurn = gameState.currentTurn === seat;
    const isDealer = gameState.dealer === seat;
    const isWinningBidder = gameState.winningBidder === seat;
    const isTrickWinner = trickCelebration && trickCelebration.winnerSeat === seat;
    const isTeamA = [1, 3].includes(seat);
    const cardCount = player?.hand?.length ?? (isBiddingPhase ? 4 : 8);
    const isBot = player?.isBot || false;
    const isMe = seat === mySeat;

    const avatarSrc = isMe
      ? avatar || player?.avatar || getSavedAvatar()
      : player?.avatar || (isBot ? getBotAvatar(seat) : getBotAvatar(seat));

    return (
      <div
        className={`stadium-player-pod ${directionClass} ${
          isCurrentTurn ? 'is-turn-active' : ''
        } ${isTrickWinner ? 'is-trick-winner' : ''}`}
        key={seat}
      >
        {/* Active Turn Floating Pill */}
        {isCurrentTurn && (
          <div className="active-turn-pill animate-bounce-subtle">
            <span className="turn-pulse-dot" />
            <span>{isMe ? 'তোমার চাল' : `${player?.username || label} এর চাল`}</span>
          </div>
        )}

        {/* Circular Avatar Ring with Gold Rim */}
        <div
          className={`stadium-avatar-ring ${isMe ? 'is-me-clickable' : ''}`}
          onClick={() => isMe && setShowAvatarModal(true)}
          title={isMe ? 'Click to change avatar / ছবি পরিবর্তন করুন' : player?.username}
        >
          {isDealer && <div className="seat-badge dealer-badge" title="Dealer">D</div>}
          {isWinningBidder && <div className="seat-badge bidder-badge" title="Winning Bidder">👑</div>}
          {isTrickWinner && <div className="seat-badge winner-sparkle" title="Won Trick">★</div>}

          <div className="stadium-avatar-inner">
            <img
              src={avatarSrc}
              alt={player?.username || `Seat ${seat}`}
              className="stadium-avatar-img"
            />
          </div>

          {isMe && <span className="avatar-edit-badge" title="Edit avatar">📷</span>}
        </div>

        {/* Player Meta Box */}
        <div className="stadium-player-meta">
          <div className="player-name-chip">
            <span className="player-alias-text">
              {isMe ? `${player?.username || 'You'} (You)` : player?.username || label}
            </span>
            {isBot && <span className="bot-chip">BOT</span>}
          </div>

          <div className="player-team-pill">
            {isTeamA ? <LionMiniCrest /> : <GriffinMiniCrest />}
            <span style={{ color: isTeamA ? '#6ee7b7' : '#fca5a5', fontWeight: 600 }}>
              Team {isTeamA ? 'A' : 'B'}
            </span>
          </div>

          {!isMe && (
            <div className="player-hand-backs" title={`${cardCount} cards remaining`}>
              {Array.from({ length: Math.min(cardCount, 8) }).map((_, i) => (
                <div key={i} className="mini-card-back-chip" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="stadium-viewport">
      {/* Top Stadium Curved Notch Header */}
      <GameInfo
        onToggleRules={() => setShowRulesModal(true)}
        onToggleChat={() => setShowChatModal(true)}
        onToggleSettings={() => setShowSettingsModal(true)}
      />

      {/* Main 3-Column Layout Container */}
      <div className="stadium-three-columns">
        {/* Left Column: Desktop Scoreboard Panel */}
        <aside className="desktop-scoreboard-card">
          <div className="side-card-header">
            <h3 className="side-title gold-text">২৯ - 29 Match</h3>
            <span className="side-sub-badge">Round {gameState.roundNumber || 1}</span>
          </div>

          <div className="scoreboard-teams-table">
            <div className="score-row team-a-row">
              <div className="team-meta">
                <LionMiniCrest />
                <span className="team-name">Team A (1 &amp; 3)</span>
              </div>
              <div className="team-scores">
                <span className="current-pts">{gameState.teamPoints?.A ?? 0} pts</span>
                <span className="total-match-pts">Won: {gameState.gameScore?.teamA ?? 0}</span>
              </div>
            </div>

            <div className="score-row team-b-row">
              <div className="team-meta">
                <GriffinMiniCrest />
                <span className="team-name">Team B (2 &amp; 4)</span>
              </div>
              <div className="team-scores">
                <span className="current-pts">{gameState.teamPoints?.B ?? 0} pts</span>
                <span className="total-match-pts">Won: {gameState.gameScore?.teamB ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="scoreboard-contract-box">
            <div className="contract-header">CURRENT CONTRACT</div>
            <div className="contract-info-line">
              <span>Target Bid:</span>
              <strong className="gold-text">
                {gameState.highestBid ? `${gameState.highestBid} pts` : 'In Bidding'}
              </strong>
            </div>
            <div className="contract-info-line">
              <span>Winning Bidder:</span>
              <span>
                {gameState.winningBidder
                  ? getPlayerAtSeat(gameState.winningBidder)?.username || `Seat ${gameState.winningBidder}`
                  : 'Pending'}
              </span>
            </div>
            <div className="contract-info-line">
              <span>Trump Status:</span>
              <span className={gameState.trumpRevealed ? 'gold-text' : 'muted-text'}>
                {gameState.trumpRevealed
                  ? `${gameState.trumpSuit?.toUpperCase() || ''} (Revealed)`
                  : 'Secret (Hidden)'}
              </span>
            </div>
          </div>

          {/* Quick Rules Points Cheat Sheet */}
          <div className="points-cheat-sheet">
            <div className="cheat-title">Card Points</div>
            <div className="cheat-grid">
              <span className="cheat-item">J: 3pts</span>
              <span className="cheat-item">9: 2pts</span>
              <span className="cheat-item">A: 1pt</span>
              <span className="cheat-item">10: 1pt</span>
            </div>
          </div>
        </aside>

        {/* Center Column: The Stadium Rounded Felt Arena */}
        <main className="stadium-center-column">
          <div className="felt-stadium-rim">
            <div className="felt-stadium-inner">
              {/* Stadium Felt Watermark */}
              <div className="felt-center-watermark">২৯</div>

              {/* 4 Player Pods */}
              {renderPlayerPod(northSeat, 'pos-north', 'Partner')}
              {renderPlayerPod(westSeat, 'pos-west', 'Opponent Left')}
              {renderPlayerPod(eastSeat, 'pos-east', 'Opponent Right')}
              {renderPlayerPod(southSeat, 'pos-south', 'You')}

              {/* Center Trick Stage */}
              <TableCards mySeat={mySeat} />
            </div>
          </div>

          {/* Bottom Curved Fan-Out Hand Cards */}
          <div className="stadium-hand-dock">
            {/* On mobile or during player bidding turn, float BiddingPanel */}
            {isMyBiddingTurn && (
              <div className="mobile-bidding-floating-dock">
                <BiddingPanel />
              </div>
            )}

            {currentPlayer && (
              <PlayerHand
                hand={currentPlayer.hand || []}
                isCurrentTurn={gameState.phase === 'PLAYING' && isMyTurn}
                leadSuit={gameState.leadSuit}
              />
            )}
          </div>
        </main>

        {/* Right Column: Desktop Bidding Panel / Live Log & Chat */}
        <aside className="desktop-side-card desktop-right-panel">
          {/* If Bidding is active and user is on desktop, show BiddingPanel on top */}
          {isBiddingPhase && (
            <div className="desktop-bidding-wrapper">
              <BiddingPanel />
            </div>
          )}

          {/* Live Game Log & Table Chat */}
          <div className="game-chat-card">
            <div className="side-card-header">
              <h3 className="side-title gold-text">Table Chat &amp; Log</h3>
              <span className="live-indicator">● LIVE</span>
            </div>

            <div className="chat-messages-container">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble ${m.isSystem ? 'system-msg' : ''} ${
                    m.sender === currentPlayer?.username ? 'my-msg' : ''
                  }`}
                >
                  <span className="chat-sender">{m.sender}:</span>
                  <span className="chat-text">{m.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="chat-input-bar">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message / বার্তা লিখুন..."
                className="chat-field"
                maxLength={80}
              />
              <button type="submit" className="btn-chat-send" title="Send message">
                ➤
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Trump Selection Modal */}
      {gameState.phase === 'TRUMP_SELECTION' && gameState.winningBidder === mySeat && (
        <div className="modal-overlay">
          <TrumpSelection />
        </div>
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
              Start Next Round (পরবর্তী রাউন্ড)
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div
            className="modal-box-sleek"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <h2 className="modal-title-sleek gold-text">২৯ Game Rules &amp; Points</h2>
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div
            className="modal-box-sleek"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h2 className="modal-title-sleek gold-text">Settings / সেটিংস</h2>
            <div className="settings-list-rows" style={{ margin: '1.2rem 0' }}>
              <div className="settings-toggle-row">
                <span>Sound Effects (শব্দ)</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
              </div>
              <div className="settings-toggle-row">
                <span>Auto-Pass Low Hands</span>
                <input
                  type="checkbox"
                  checked={autoPassLow}
                  onChange={(e) => setAutoPassLow(e.target.checked)}
                />
              </div>
            </div>
            <button
              className="btn-join-gold"
              onClick={() => setShowSettingsModal(false)}
              style={{ width: '100%', padding: '0.8rem' }}
            >
              Save &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Chat Modal */}
      {showChatModal && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div
            className="modal-box-sleek"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', maxHeight: '80vh' }}
          >
            <h2 className="modal-title-sleek gold-text">Game Chat &amp; Log</h2>
            <div className="chat-messages-container" style={{ maxHeight: '260px' }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble ${m.isSystem ? 'system-msg' : ''} ${
                    m.sender === currentPlayer?.username ? 'my-msg' : ''
                  }`}
                >
                  <span className="chat-sender">{m.sender}:</span>
                  <span className="chat-text">{m.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} className="chat-input-bar">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="chat-field"
                maxLength={80}
              />
              <button type="submit" className="btn-chat-send">
                ➤
              </button>
            </form>
            <button
              className="btn-modal-cancel"
              onClick={() => setShowChatModal(false)}
              style={{ width: '100%', marginTop: '0.8rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <AvatarPickerModal
          currentAvatar={avatar || getSavedAvatar()}
          onSelect={(newAv) => {
            saveAvatar(newAv);
            setAvatar(newAv);
          }}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
};

export default GameTable;
