import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Card from '../components/Card.jsx';
import { SUIT_SYMBOLS, GAME_PHASES, GAME_RULES, SUITS } from '../game/constants.js';
import { createDeck, shuffleDeck, getLegalCards, determineTrickWinner, calculateTrickPoints } from '../game/engine.js';
import '../styles/main.css';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : window.location.origin;

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedTrump, setSelectedTrump] = useState(null);
  const [showTrumpModal, setShowTrumpModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [username, setUsername] = useState('');
  const [inLobby, setInLobby] = useState(true);
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
    });

    newSocket.on('game:state', (state) => {
      console.log('Game state received:', state);
      setGameState(state);
      
      if (state.phase === GAME_PHASES.TRUMP_SELECTION && state.currentTurn === playerId) {
        setShowTrumpModal(true);
      }
      
      if (state.phase === GAME_PHASES.ROUND_COMPLETE) {
        setResultData(state.roundResult);
        setShowResultModal(true);
      }
    });

    newSocket.on('error', (err) => {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('player:joined', (data) => {
      console.log('Player joined:', data);
    });

    return () => {
      newSocket.close();
    };
  }, [playerId]);

  const joinGame = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    socket.emit('joinGame', { 
      gameId: gameId || 'default', 
      username 
    }, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        setInLobby(false);
        setGameId(response.gameId);
      } else {
        setError(response.error);
      }
    });
  };

  const placeBid = (amount) => {
    socket.emit('bid:placed', { gameId, bid: amount }, (response) => {
      if (!response.success) {
        setError(response.error);
      }
    });
  };

  const passBid = () => {
    socket.emit('bid:passed', { gameId }, (response) => {
      if (!response.success) {
        setError(response.error);
      }
    });
  };

  const selectTrump = (suit) => {
    socket.emit('trump:select', { gameId, trumpSuit: suit }, (response) => {
      if (response.success) {
        setShowTrumpModal(false);
        setSelectedTrump(null);
      } else {
        setError(response.error);
      }
    });
  };

  const playCard = (card) => {
    if (!gameState || gameState.phase !== GAME_PHASES.PLAYING) return;
    if (gameState.currentTurn !== playerId) return;
    
    socket.emit('card:played', { gameId, cardId: card.id }, (response) => {
      if (!response.success) {
        setError(response.error);
        setSelectedCard(null);
      } else {
        setSelectedCard(null);
      }
    });
  };

  const getLegalCardsForPlayer = () => {
    if (!gameState || !gameState.players[playerId]) return [];
    
    const hand = gameState.players[playerId].hand || [];
    const leadSuit = gameState.leadSuit;
    
    return getLegalCards(hand, leadSuit);
  };

  const isMyTurn = () => {
    return gameState && gameState.currentTurn === playerId;
  };

  const renderLobby = () => (
    <div className="lobby-container">
      <h1 className="lobby-title">29</h1>
      <div className="lobby-card">
        <input
          type="text"
          className="lobby-input"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && joinGame()}
        />
        <input
          type="text"
          className="lobby-input"
          placeholder="Game ID (optional)"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />
        {error && <p style={{ color: '#e94560', marginBottom: '16px' }}>{error}</p>}
        <button className="btn btn-primary" onClick={joinGame} style={{ width: '100%' }}>
          Join Game
        </button>
        {gameState && gameState.players && (
          <div className="seats-grid" style={{ marginTop: '24px' }}>
            {Object.values(gameState.players).map((player) => (
              <div key={player.id} className={`seat ${player.username ? 'occupied' : 'empty'}`}>
                <div className="seat-number">Seat {player.seat}</div>
                <div className="seat-player">{player.username || 'Empty'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBiddingControls = () => {
    if (!gameState || gameState.phase !== GAME_PHASES.BIDDING) return null;
    if (!isMyTurn()) return <p style={{ textAlign: 'center', opacity: 0.7 }}>Waiting for other players...</p>;

    const currentBid = gameState.highestBid || GAME_RULES.MIN_BID - 1;
    const validBids = [];
    
    for (let i = Math.max(currentBid + 1, GAME_RULES.MIN_BID); i <= GAME_RULES.MAX_BID; i++) {
      validBids.push(i);
    }

    return (
      <div className="bidding-controls">
        {validBids.map((bid) => (
          <button
            key={bid}
            className="bid-button"
            onClick={() => placeBid(bid)}
          >
            {bid}
          </button>
        ))}
        <button
          className="bid-button pass-button"
          onClick={passBid}
        >
          PASS
        </button>
      </div>
    );
  };

  const renderTrumpModal = () => {
    if (!showTrumpModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowTrumpModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">Select Trump Suit</h2>
          <div className="trump-selector">
            {SUITS.map((suit) => (
              <div
                key={suit}
                className={`trump-option ${selectedTrump === suit ? 'selected' : ''}`}
                onClick={() => setSelectedTrump(suit)}
              >
                <div className="trump-symbol" style={{ color: suit === 'hearts' || suit === 'diamonds' ? '#e63946' : '#1a1a2e' }}>
                  {SUIT_SYMBOLS[suit]}
                </div>
                <div className="trump-name">{suit}</div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            onClick={() => selectedTrump && selectTrump(selectedTrump)}
            disabled={!selectedTrump}
          >
            Confirm Trump
          </button>
        </div>
      </div>
    );
  };

  const renderResultModal = () => {
    if (!showResultModal || !resultData) return null;

    return (
      <div className="modal-overlay">
        <div className="modal result-screen">
          <h2 className="result-title">Round Complete!</h2>
          <div className="result-stats">
            <div className="result-stat">
              <div className="result-stat-value">{resultData.teamAPoints || 0}</div>
              <div className="result-stat-label">Team A Points</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-value">{resultData.teamBPoints || 0}</div>
              <div className="result-stat-label">Team B Points</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-value">{resultData.winningBid || '-'}</div>
              <div className="result-stat-label">Winning Bid</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-value">{resultData.contractResult || '-'}</div>
              <div className="result-stat-label">Contract</div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowResultModal(false);
              socket.emit('game:nextRound', { gameId });
            }}
          >
            Next Round
          </button>
        </div>
      </div>
    );
  };

  const renderGameTable = () => {
    if (!gameState) return null;

    const myHand = gameState.players[playerId]?.hand || [];
    const legalCardIds = getLegalCardsForPlayer();
    const trickPlays = gameState.currentTrick?.plays || [];

    return (
      <div className="container" style={{ paddingTop: '20px' }}>
        {/* Info Panel */}
        <div className="info-panel">
          <div className="info-row">
            <span className="info-label">Round</span>
            <span className="info-value">{gameState.roundNumber || 1}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phase</span>
            <span className="info-value">{gameState.phase}</span>
          </div>
          {gameState.trumpSuit && (
            <div className="info-row">
              <span className="info-label">Trump</span>
              <span className="info-value" style={{ color: gameState.trumpSuit === 'hearts' || gameState.trumpSuit === 'diamonds' ? '#e63946' : '#fff' }}>
                {SUIT_SYMBOLS[gameState.trumpSuit]} {gameState.trumpSuit}
              </span>
            </div>
          )}
          {gameState.highestBid && (
            <div className="info-row">
              <span className="info-label">Current Bid</span>
              <span className="info-value">{gameState.highestBid}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Trick</span>
            <span className="info-value">{(gameState.completedTricks?.length || 0) + 1} / {GAME_RULES.TRICKS_PER_ROUND}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className={`status-badge ${isMyTurn() ? 'status-your-turn' : 'status-playing'}`}>
              {isMyTurn() ? 'Your Turn' : 'Waiting'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            background: 'rgba(233, 69, 96, 0.2)', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Game Table */}
        <div className="game-table">
          {/* Top Player (Opponent) */}
          <div className="player-position player-top">
            <div className="player-avatar">P2</div>
            <div className="player-name">Opponent</div>
          </div>

          {/* Left Player (Teammate) */}
          <div className="player-position player-left">
            <div className="player-avatar">P3</div>
            <div className="player-name">Partner</div>
          </div>

          {/* Right Player (Opponent) */}
          <div className="player-position player-right">
            <div className="player-avatar">P4</div>
            <div className="player-name">Opponent</div>
          </div>

          {/* Trick Area */}
          <div className="trick-area">
            {trickPlays.map((play, index) => {
              const positions = [
                { top: '-60px', left: '0' },
                { top: '0', right: '-60px' },
                { bottom: '-60px', left: '0' },
                { top: '0', left: '-60px' }
              ];
              const pos = positions[index % 4];
              
              return (
                <div
                  key={play.card.id + index}
                  className="trick-card"
                  style={pos}
                >
                  <Card card={play.card} small />
                </div>
              );
            })}
          </div>

          {/* Bottom Player (You) */}
          <div className="player-position player-bottom">
            <div className="player-avatar" style={{ background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)' }}>You</div>
            <div className="player-name">{gameState.players[playerId]?.username || 'Player 1'}</div>
          </div>
        </div>

        {/* Bidding Controls */}
        <div style={{ marginTop: '20px' }}>
          {renderBiddingControls()}
        </div>

        {/* Your Hand */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Your Hand</h3>
          <div className="hand">
            {myHand.map((card) => {
              const isLegal = legalCardIds.includes(card.id);
              const isSelected = selectedCard?.id === card.id;
              
              return (
                <Card
                  key={card.id}
                  card={card}
                  selected={isSelected}
                  disabled={!isLegal || !isMyTurn()}
                  onClick={playCard}
                />
              );
            })}
          </div>
          {!isMyTurn() && gameState.phase === GAME_PHASES.PLAYING && (
            <p style={{ textAlign: 'center', marginTop: '16px', opacity: 0.7 }}>
              Waiting for other players...
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {inLobby ? renderLobby() : renderGameTable()}
      {renderTrumpModal()}
      {renderResultModal()}
    </>
  );
}

export default App;
