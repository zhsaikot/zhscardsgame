import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/useGameStore';
import PlayerHand, { SUIT_SYMBOLS } from '../components/PlayerHand';
import GameInfo from '../components/GameInfo';
import BiddingPanel from '../components/BiddingPanel';
import TrumpSelection from '../components/TrumpSelection';
import TableCards from '../components/TableCards';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { getBotAvatar, getSavedAvatar, saveAvatar } from '../utils/avatar';

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
  const [activeRightTab, setActiveRightTab] = useState<'history' | 'chat'>('history');

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // In-Game Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Dealer', text: 'Welcome to 29 ARENA! Match is live.', isSystem: true },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Sync game moves into chat / move log
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'BIDDING' && gameState.highestBid) {
      const bidder = gameState.players.find((p) => p.seat === gameState.winningBidder);
      const name = bidder?.username || `Seat ${gameState.winningBidder}`;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const logText = `${name} bid ${gameState.highestBid} points!`;
        if (last && last.text === logText) return prev;
        return [...prev, { id: String(Date.now()), sender: 'Bidding', text: logText, isSystem: true }];
      });
    }

    if (gameState.phase === 'PLAYING' && gameState.trumpRevealed && gameState.trumpSuit) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const logText = `Trump revealed: ${gameState.trumpSuit?.toUpperCase()}!`;
        if (last && last.text === logText) return prev;
        return [...prev, { id: String(Date.now()), sender: 'Trump', text: logText, isSystem: true }];
      });
    }
  }, [gameState?.phase, gameState?.highestBid, gameState?.trumpRevealed, gameState?.trumpSuit, gameState?.completedTricks?.length]);

  if (!gameState) {
    return (
      <div className="connection-screen">
        <div className="connection-logo">29 ARENA</div>
        <div className="loading-spinner" />
        <p className="loading-text">Connecting to arena...</p>
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

  // Render Pill-Shaped Player Pod matching reference image
  const renderPlayerPod = (seat: number, directionClass: string, label: string) => {
    const player = getPlayerAtSeat(seat);
    const isCurrentTurn = gameState.currentTurn === seat;
    const isDealer = gameState.dealer === seat;
    const isWinningBidder = gameState.winningBidder === seat;
    const isTrickWinner = trickCelebration?.winnerSeat === seat;
    const isTeamA = [1, 3].includes(seat);
    const isBot = player?.isBot || false;
    const isMe = seat === mySeat;

    const avatarSrc = isMe
      ? avatar || player?.avatar || getSavedAvatar()
      : player?.avatar || getBotAvatar(seat);

    const wonTricks = (gameState.completedTricks || []).filter((t) => t.winner === seat);
    const wonPoints = wonTricks.reduce((acc, t) => acc + (t.points || 0), 0);

    return (
      <div
        className={`esports-player-pill ${directionClass} ${
          isCurrentTurn ? 'is-turn-active' : ''
        } ${isTrickWinner ? 'is-trick-winner' : ''}`}
        key={seat}
      >
        <div
          className={`esports-avatar-wrap ${isMe ? 'is-me-clickable' : ''}`}
          onClick={() => isMe && setShowAvatarModal(true)}
          title={isMe ? 'Click to change avatar / ছবি পরিবর্তন করুন' : player?.username}
        >
          <img
            src={avatarSrc}
            alt={player?.username || `Seat ${seat}`}
            className="esports-avatar-img"
          />
          {isCurrentTurn && <span className="timer-chip">5s</span>}
        </div>

        <div className="esports-player-meta">
          <div className="player-name-row">
            <span className="player-name-text">
              {isMe ? `${player?.username || 'You'} (You)` : player?.username || label}
            </span>
            {isBot && <span className="bot-chip">BOT</span>}
          </div>
          <span className="player-elo-text">
            {isMe ? '3,290 ELO • ' : ''}Team {isTeamA ? 'A' : 'B'}
          </span>
        </div>

        {wonTricks.length > 0 && (
          <span className="won-tricks-badge" title={`${wonTricks.length} tricks won (${wonPoints} pts)`}>
            🏆 {wonTricks.length}
          </span>
        )}

        {isDealer && <span className="dealer-badge" title="Dealer">D</span>}
        {isWinningBidder && <span className="bidder-badge" title="Winning Bidder">👑</span>}
      </div>
    );
  };

  return (
    <div className="esports-viewport">
      {/* Top Header matching reference image */}
      <GameInfo
        onToggleRules={() => setShowRulesModal(true)}
        onToggleChat={() => setShowChatModal(true)}
        onToggleSettings={() => setShowSettingsModal(true)}
      />

      {/* Sub-header Meta Line */}
      <div className="esports-meta-bar">
        <div>
          <strong className="text-white">29 Championship Match</strong>
          <span className="meta-sep">•</span>
          <span>Round {gameState.roundNumber || 1} • Hand #582049509</span>
        </div>
        <div className="meta-server-pill">
          <span className="server-dot">●</span>
          <span>Server Live (24ms)</span>
        </div>
      </div>

      {/* Main 3-Column Arena Container */}
      <div className="esports-arena-grid">
        
        {/* Left Column: Your Stats & Contract Card */}
        <aside className="esports-left-stats-panel">
          {/* Your Stats Card */}
          <div className="stats-box-card">
            <div className="stats-header-title">Your Stats</div>
            <div className="stats-metric-rows">
              <div className="metric-row">
                <span className="metric-label">ELO</span>
                <span className="metric-val font-bold">3,290</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Win rate</span>
                <span className="metric-val">61%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Accuracy</span>
                <span className="metric-val">82%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Session</span>
                <span className="metric-val session-green">+12 ELO</span>
              </div>
              <div className="metric-row pt-1 border-t border-white/5">
                <span className="metric-label">Team A Score</span>
                <span className="metric-val team-a-val">{gameState.teamPoints?.A ?? 0} pts</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Team B Score</span>
                <span className="metric-val team-b-val">{gameState.teamPoints?.B ?? 0} pts</span>
              </div>
            </div>
          </div>

          {/* Next Rank Card */}
          <div className="stats-box-card">
            <div className="stats-header-title">Next Rank</div>
            <div className="rank-name-line">Master • 2,200 ELO</div>
            <div className="rank-progress-bar">
              <div className="rank-progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Current Contract Box */}
          <div className="stats-box-card">
            <div className="stats-header-title">Current Contract</div>
            <div className="contract-line">
              <span>Target Bid:</span>
              <strong className="contract-gold">{gameState.highestBid ? `${gameState.highestBid} pts` : 'In Bidding'}</strong>
            </div>
            <div className="contract-line">
              <span>Bidder:</span>
              <span>{gameState.winningBidder ? getPlayerAtSeat(gameState.winningBidder)?.username || `Seat ${gameState.winningBidder}` : 'Pending'}</span>
            </div>
            <div className="contract-line">
              <span>Trump:</span>
              <span className={gameState.trumpRevealed ? 'trump-open-text' : 'trump-secret-text'}>
                {gameState.trumpRevealed ? `${gameState.trumpSuit?.toUpperCase()} (Open)` : 'Secret (Hidden)'}
              </span>
            </div>
          </div>

          {/* Card Points Cheat Sheet */}
          <div className="stats-box-card cheat-sheet">
            <div className="stats-header-title">Card Points</div>
            <div className="cheat-grid-2x2">
              <span className="cheat-badge">J = 3 pts</span>
              <span className="cheat-badge">9 = 2 pts</span>
              <span className="cheat-badge">A = 1 pt</span>
              <span className="cheat-badge">10 = 1 pt</span>
            </div>
          </div>
        </aside>

        {/* Center Column: Matte Oval Stadium Felt Table + Action Console */}
        <main className="esports-center-arena">
          <div className="esports-oval-table">
            <div className="esports-inner-felt">
              {/* Table Watermark */}
              <div className="esports-watermark">29</div>

              {/* 4 Player Pods (matching reference image) */}
              {renderPlayerPod(northSeat, 'pos-north', 'Partner')}
              {renderPlayerPod(westSeat, 'pos-west', 'Opponent Left')}
              {renderPlayerPod(eastSeat, 'pos-east', 'Opponent Right')}
              {renderPlayerPod(southSeat, 'pos-south', 'You')}

              {/* Center Trick Stage */}
              <TableCards mySeat={mySeat} />
            </div>
          </div>

          {/* Bottom Console: Bidding Controls during Bidding / Hand during Playing */}
          <div className="esports-bottom-dock">
            {isBiddingPhase && (
              <BiddingPanel />
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

        {/* Right Column: History & Chat Tabs matching reference image */}
        <aside className="esports-right-history-panel">
          <div className="history-tab-headers">
            <button
              type="button"
              className={`history-tab-btn ${activeRightTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('history')}
            >
              History
            </button>
            <button
              type="button"
              className={`history-tab-btn ${activeRightTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('chat')}
            >
              Chat
            </button>
          </div>

          {activeRightTab === 'history' ? (
            <div className="history-trick-list">
              {(gameState.completedTricks || []).length === 0 ? (
                <div className="history-empty-text">No tricks played yet this round.</div>
              ) : (
                (gameState.completedTricks || []).map((trick, idx) => (
                  <div key={idx} className="esports-history-row">
                    <div className="history-cards-group">
                      {trick.plays.map((p, i) => (
                        <span key={i} className={`history-card-chip ${['hearts', 'diamonds'].includes(p.card.suit) ? 'red' : 'black'}`}>
                          {p.card.rank}{SUIT_SYMBOLS[p.card.suit]}
                        </span>
                      ))}
                    </div>
                    <span className="history-pts">+{trick.points} pts</span>
                    <span className="history-time">{trick.winner === mySeat ? 'You' : getPlayerAtSeat(trick.winner!)?.username || `Seat ${trick.winner}`}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
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
          )}

          <form onSubmit={handleSendChat} className="chat-input-bar">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message..."
              className="chat-field"
              maxLength={80}
            />
            <button type="submit" className="btn-chat-send" title="Send message">
              ➤
            </button>
          </form>
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
          <div className="modal-box-sleek" onClick={(e) => e.stopPropagation()}>
            <div className="side-card-header" style={{ marginBottom: '1rem' }}>
              <h2 className="modal-title-sleek gold-text">29 Game Rules & Points</h2>
              <button onClick={() => setShowRulesModal(false)} className="btn-close-modal">✕</button>
            </div>
            <div className="rules-scrollable">
              <p><strong>Goal:</strong> The bidder's team must score at least the target points bid.</p>
              <h4 style={{ color: '#ffd700', marginTop: '0.8rem' }}>Card Values:</h4>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', color: '#cbd5e1' }}>
                <li><strong>Jack (J):</strong> 3 Points each</li>
                <li><strong>Nine (9):</strong> 2 Points each</li>
                <li><strong>Ace (A):</strong> 1 Point each</li>
                <li><strong>Ten (10):</strong> 1 Point each</li>
                <li><strong>King, Queen, 8, 7:</strong> 0 Points</li>
              </ul>
              <p style={{ marginTop: '0.8rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                Last trick winner receives 1 bonus point (Total = 28 + 1 = 29 points).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-box-sleek" onClick={(e) => e.stopPropagation()}>
            <div className="side-card-header" style={{ marginBottom: '1rem' }}>
              <h2 className="modal-title-sleek gold-text">Game Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="btn-close-modal">✕</button>
            </div>
            <div className="settings-list-rows">
              <label className="settings-toggle-row">
                <span>Sound Effects (সাউন্ড)</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default GameTable;
