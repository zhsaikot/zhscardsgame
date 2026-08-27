import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { createDeck, shuffleDeck, dealCards, getLegalCards, determineTrickWinner, calculateTrickPoints } from '../src/game/engine.js';
import { GAME_PHASES, GAME_RULES, SUITS, CARD_VALUES } from '../src/game/constants.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Game state storage
const games = new Map();

// Player storage
const players = new Map();

function createGame(gameId) {
  const game = {
    id: gameId,
    phase: GAME_PHASES.LOBBY,
    players: {},
    dealer: null,
    currentTurn: null,
    deck: [],
    trumpSuit: null,
    trumpRevealed: false,
    highestBid: null,
    winningBidder: null,
    targetBid: null,
    leadSuit: null,
    currentTrick: null,
    completedTricks: [],
    teamPoints: {
      A: 0,
      B: 0
    },
    gameScore: {
      A: 0,
      B: 0
    },
    roundNumber: 1,
    bids: {},
    passedPlayers: new Set()
  };
  
  games.set(gameId, game);
  return game;
}

function getGameStateForPlayer(game, playerId) {
  const player = game.players[playerId];
  if (!player) return null;
  
  // Only send private hand to the specific player
  const sanitizedPlayers = {};
  for (const [id, p] of Object.entries(game.players)) {
    sanitizedPlayers[id] = {
      id: p.id,
      username: p.username,
      seat: p.seat,
      team: p.team,
      connected: p.connected,
      ready: p.ready,
      hand: id === playerId ? p.hand : p.hand?.map(c => ({ id: c.id })) // Only card IDs for others
    };
  }
  
  return {
    gameId: game.id,
    phase: game.phase,
    players: sanitizedPlayers,
    dealer: game.dealer,
    currentTurn: game.currentTurn,
    trumpSuit: game.trumpSuit,
    trumpRevealed: game.trumpRevealed,
    highestBid: game.highestBid,
    winningBidder: game.winningBidder,
    targetBid: game.targetBid,
    leadSuit: game.leadSuit,
    currentTrick: game.currentTrick,
    completedTricks: game.completedTricks,
    teamPoints: game.teamPoints,
    gameScore: game.gameScore,
    roundNumber: game.roundNumber
  };
}

function getNextPlayer(seat, totalPlayers = 4) {
  return ((seat % totalPlayers) + 1).toString();
}

function checkAllPlayersReady(game) {
  const playerList = Object.values(game.players);
  return playerList.length === 4 && playerList.every(p => p.ready);
}

function startGame(game) {
  game.phase = GAME_PHASES.DEAL_INITIAL;
  
  // Create and shuffle deck
  game.deck = shuffleDeck(createDeck());
  
  // Deal initial 4 cards to each player
  const playerIds = Object.keys(game.players);
  const hands = {};
  
  let remainingDeck = [...game.deck];
  for (const playerId of playerIds) {
    const result = dealCards(remainingDeck, GAME_RULES.INITIAL_CARDS);
    hands[playerId] = result.dealt;
    remainingDeck = result.remaining;
  }
  
  // Assign hands
  for (const playerId of playerIds) {
    game.players[playerId].hand = hands[playerId];
  }
  
  game.deck = remainingDeck;
  
  // Set dealer randomly for first round
  const playerSeats = Object.keys(game.players);
  game.dealer = playerSeats[Math.floor(Math.random() * playerSeats.length)];
  
  // Start bidding - player after dealer starts
  game.currentTurn = getNextPlayer(parseInt(game.dealer));
  game.phase = GAME_PHASES.BIDDING;
  game.bids = {};
  game.passedPlayers = new Set();
  
  broadcastGameState(game);
}

function placeBid(game, playerId, bidAmount) {
  if (game.phase !== GAME_PHASES.BIDDING) {
    return { success: false, error: 'Game is not in bidding phase' };
  }
  
  if (game.currentTurn !== playerId) {
    return { success: false, error: 'Not your turn' };
  }
  
  if (game.passedPlayers.has(playerId)) {
    return { success: false, error: 'You have already passed' };
  }
  
  const minBid = Math.max(GAME_RULES.MIN_BID, (game.highestBid || GAME_RULES.MIN_BID - 1) + 1);
  
  if (bidAmount < minBid || bidAmount > GAME_RULES.MAX_BID) {
    return { success: false, error: `Bid must be between ${minBid} and ${GAME_RULES.MAX_BID}` };
  }
  
  game.bids[playerId] = bidAmount;
  game.highestBid = bidAmount;
  
  // Move to next player
  advanceBidding(game);
  
  return { success: true };
}

function passBid(game, playerId) {
  if (game.phase !== GAME_PHASES.BIDDING) {
    return { success: false, error: 'Game is not in bidding phase' };
  }
  
  if (game.currentTurn !== playerId) {
    return { success: false, error: 'Not your turn' };
  }
  
  game.passedPlayers.add(playerId);
  
  // Move to next player
  advanceBidding(game);
  
  return { success: true };
}

function advanceBidding(game) {
  const activePlayers = Object.keys(game.players).filter(id => !game.passedPlayers.has(id));
  
  if (activePlayers.length === 1) {
    // Only one bidder remains
    game.winningBidder = activePlayers[0];
    game.targetBid = game.bids[game.winningBidder];
    game.phase = GAME_PHASES.TRUMP_SELECTION;
    game.currentTurn = game.winningBidder;
  } else {
    // Continue bidding
    let nextPlayer = getNextPlayer(parseInt(game.currentTurn));
    
    // Skip passed players
    while (game.passedPlayers.has(nextPlayer) && nextPlayer !== game.currentTurn) {
      nextPlayer = getNextPlayer(parseInt(nextPlayer));
    }
    
    game.currentTurn = nextPlayer;
    
    // Check if all but one passed
    if (activePlayers.length === 1 && !game.passedPlayers.has(game.currentTurn)) {
      game.winningBidder = game.currentTurn;
      game.targetBid = game.bids[game.winningBidder] || GAME_RULES.MIN_BID;
      game.phase = GAME_PHASES.TRUMP_SELECTION;
    }
  }
  
  broadcastGameState(game);
}

function selectTrump(game, playerId, trumpSuit) {
  if (game.phase !== GAME_PHASES.TRUMP_SELECTION) {
    return { success: false, error: 'Waiting for trump selection' };
  }
  
  if (game.currentTurn !== playerId || game.winningBidder !== playerId) {
    return { success: false, error: 'Not your turn to select trump' };
  }
  
  if (!SUITS.includes(trumpSuit)) {
    return { success: false, error: 'Invalid trump suit' };
  }
  
  game.trumpSuit = trumpSuit;
  game.trumpRevealed = true;
  
  // Deal remaining cards
  const playerIds = Object.keys(game.players);
  const remainingDeck = [...game.deck];
  
  for (const playerId of playerIds) {
    const result = dealCards(remainingDeck, GAME_RULES.FINAL_HAND_SIZE - GAME_RULES.INITIAL_CARDS);
    game.players[playerId].hand = [...game.players[playerId].hand, ...result.dealt];
    remainingDeck = result.remaining;
  }
  
  game.deck = remainingDeck;
  
  // Start playing phase
  game.phase = GAME_PHASES.PLAYING;
  game.currentTrick = {
    plays: [],
    leader: getNextPlayer(parseInt(game.winningBidder))
  };
  game.currentTurn = game.currentTrick.leader;
  game.leadSuit = null;
  
  broadcastGameState(game);
  
  return { success: true };
}

function playCard(game, playerId, cardId) {
  if (game.phase !== GAME_PHASES.PLAYING) {
    return { success: false, error: 'Game is not in playing phase' };
  }
  
  if (game.currentTurn !== playerId) {
    return { success: false, error: 'Not your turn' };
  }
  
  const player = game.players[playerId];
  if (!player || !player.hand) {
    return { success: false, error: 'Player not found' };
  }
  
  const card = player.hand.find(c => c.id === cardId);
  if (!card) {
    return { success: false, error: 'Card not found in hand' };
  }
  
  // Check if card is legal
  const legalCards = getLegalCards(player.hand, game.leadSuit);
  if (!legalCards.includes(cardId)) {
    return { success: false, error: 'You must follow the lead suit' };
  }
  
  // Play the card
  player.hand = player.hand.filter(c => c.id !== cardId);
  game.currentTrick.plays.push({
    playerId,
    card,
    seat: player.seat
  });
  
  // Set lead suit if this is the first card
  if (!game.leadSuit) {
    game.leadSuit = card.suit;
  }
  
  // Check if trick is complete
  if (game.currentTrick.plays.length === 4) {
    completeTrick(game);
  } else {
    // Move to next player
    game.currentTurn = getNextPlayer(parseInt(game.currentTurn));
  }
  
  broadcastGameState(game);
  
  return { success: true };
}

function completeTrick(game) {
  const trick = game.currentTrick;
  const leadSuit = game.leadSuit;
  const trumpSuit = game.trumpSuit;
  
  // Determine winner
  const winningIndex = determineTrickWinner(
    trick.plays.map(p => p.card),
    leadSuit,
    trumpSuit
  );
  
  const winningPlay = trick.plays[winningIndex];
  const winningPlayer = winningPlay.playerId;
  const winningTeam = game.players[winningPlayer].team;
  
  // Calculate points
  const points = calculateTrickPoints(trick.plays.map(p => p.card));
  
  // Add to completed tricks
  game.completedTricks.push({
    plays: trick.plays,
    winner: winningPlayer,
    winningTeam,
    points,
    leadSuit,
    trumpSuit
  });
  
  // Update team points
  if (winningTeam === 'A') {
    game.teamPoints.A += points;
  } else {
    game.teamPoints.B += points;
  }
  
  // Check if it's the final trick
  if (game.completedTricks.length === GAME_RULES.TRICKS_PER_ROUND) {
    // Add final trick bonus
    game.teamPoints[winningTeam] += GAME_RULES.FINAL_TRICK_BONUS;
    
    completeRound(game);
    return;
  }
  
  // Start next trick - winner leads
  game.currentTrick = {
    plays: [],
    leader: winningPlayer
  };
  game.currentTurn = winningPlayer;
  game.leadSuit = null;
}

function completeRound(game) {
  game.phase = GAME_PHASES.ROUND_COMPLETE;
  game.currentTrick = null;
  
  // Determine contract result
  const bidderTeam = game.players[game.winningBidder].team;
  const bidderPoints = game.teamPoints[bidderTeam];
  const contractResult = bidderPoints >= game.targetBid ? 'SUCCESS' : 'FAILED';
  
  // Update game score based on contract result
  if (contractResult === 'SUCCESS') {
    game.gameScore[bidderTeam] += 1;
  } else {
    // Opposing team gets points
    const opposingTeam = bidderTeam === 'A' ? 'B' : 'A';
    game.gameScore[opposingTeam] += 1;
  }
  
  // Prepare round result
  game.roundResult = {
    teamAPoints: game.teamPoints.A,
    teamBPoints: game.teamPoints.B,
    winningBid: game.targetBid,
    winningBidder: game.winningBidder,
    contractResult,
    tricksWon: {
      A: game.completedTricks.filter(t => t.winningTeam === 'A').length,
      B: game.completedTricks.filter(t => t.winningTeam === 'B').length
    }
  };
  
  broadcastGameState(game);
}

function startNextRound(game) {
  // Rotate dealer
  const currentDealerSeat = parseInt(game.dealer);
  const nextDealerSeat = ((currentDealerSeat % 4) + 1);
  game.dealer = nextDealerSeat.toString();
  
  // Reset game state for new round
  game.phase = GAME_PHASES.LOBBY;
  game.trumpSuit = null;
  game.trumpRevealed = false;
  game.highestBid = null;
  game.winningBidder = null;
  game.targetBid = null;
  game.leadSuit = null;
  game.currentTrick = null;
  game.completedTricks = [];
  game.teamPoints = { A: 0, B: 0 };
  game.bids = {};
  game.passedPlayers = new Set();
  game.roundResult = null;
  game.roundNumber++;
  
  // Clear hands
  for (const player of Object.values(game.players)) {
    player.hand = [];
  }
  
  // Check if we should continue or end game
  const maxRounds = 4; // Configurable
  if (game.roundNumber > maxRounds) {
    game.phase = GAME_PHASES.GAME_COMPLETE;
    // Determine overall winner
    const winner = game.gameScore.A > game.gameScore.B ? 'A' : game.gameScore.B > game.gameScore.A ? 'B' : 'DRAW';
    game.winner = winner;
  }
  
  broadcastGameState(game);
}

function broadcastGameState(game) {
  for (const playerId of Object.keys(game.players)) {
    const state = getGameStateForPlayer(game, playerId);
    io.to(`game:${game.id}`).emit('game:state', state);
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinGame', ({ gameId, username }, callback) => {
    try {
      let game = games.get(gameId);
      if (!game) {
        game = createGame(gameId);
      }
      
      // Check if there's space
      if (Object.keys(game.players).length >= 4) {
        return callback({ success: false, error: 'Game is full' });
      }
      
      const playerId = socket.id;
      const seat = (Object.keys(game.players).length + 1).toString();
      const team = (parseInt(seat) % 2 === 1) ? 'A' : 'B';
      
      game.players[playerId] = {
        id: playerId,
        username,
        seat: parseInt(seat),
        team,
        connected: true,
        ready: false,
        hand: []
      };
      
      players.set(playerId, { gameId, username });
      
      socket.join(`game:${gameId}`);
      
      broadcastGameState(game);
      
      callback({ 
        success: true, 
        playerId, 
        gameId: game.id 
      });
      
      io.to(`game:${gameId}`).emit('player:joined', { playerId, username, seat, team });
    } catch (error) {
      console.error('Error joining game:', error);
      callback({ success: false, error: error.message });
    }
  });
  
  socket.on('setReady', ({ gameId, ready }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    const player = game.players[socket.id];
    if (!player) {
      return callback({ success: false, error: 'Player not in game' });
    }
    
    player.ready = ready;
    broadcastGameState(game);
    
    // Auto-start when all players are ready
    if (checkAllPlayersReady(game) && game.phase === GAME_PHASES.LOBBY) {
      startGame(game);
    }
    
    callback({ success: true });
  });
  
  socket.on('bid:placed', ({ gameId, bid }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    const result = placeBid(game, socket.id, bid);
    callback(result);
  });
  
  socket.on('bid:passed', ({ gameId }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    const result = passBid(game, socket.id);
    callback(result);
  });
  
  socket.on('trump:select', ({ gameId, trumpSuit }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    const result = selectTrump(game, socket.id, trumpSuit);
    callback(result);
  });
  
  socket.on('card:played', ({ gameId, cardId }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    const result = playCard(game, socket.id, cardId);
    callback(result);
  });
  
  socket.on('game:nextRound', ({ gameId }, callback) => {
    const game = games.get(gameId);
    if (!game) {
      return callback({ success: false, error: 'Game not found' });
    }
    
    startNextRound(game);
    callback({ success: true });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameId);
      if (game && game.players[socket.id]) {
        game.players[socket.id].connected = false;
        broadcastGameState(game);
        
        io.to(`game:${playerInfo.gameId}`).emit('player:left', { playerId: socket.id });
      }
      
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, httpServer, io };
