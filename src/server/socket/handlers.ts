import type { Server, Socket } from 'socket.io';
import { GameService } from '../services/GameService.js';
import type { GameEngine } from '../engine/GameEngine.js';
import { BotAI } from '../engine/BotAI.js';

/**
 * Triggers an AI bot turn if the current turn belongs to a bot
 */
function triggerBotTurn(io: Server, gameId: string, engine: GameEngine): void {
  const state = engine.getGameState();
  if (state.status !== 'playing') return;

  const currentTurnSeat = state.currentTurn;
  if (!currentTurnSeat) return;

  const currentTurnPlayer = state.players.find((p) => p.seat === currentTurnSeat);
  if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

  // Realistic human-like delay
  setTimeout(() => {
    const currentState = engine.getGameState();
    if (currentState.status !== 'playing' || currentState.currentTurn !== currentTurnSeat) return;

    if (currentState.phase === 'BIDDING') {
      const decision = BotAI.getBidDecision(currentState, currentTurnPlayer);
      if (decision.action === 'bid' && decision.amount) {
        engine.placeBid(currentTurnPlayer.id, decision.amount);
        const newState = engine.getGameState();
        io.to(gameId).emit('bid:placed', {
          playerId: currentTurnPlayer.id,
          amount: decision.amount,
          highestBid: newState.highestBid,
          winningBidder: newState.winningBidder,
          gameState: newState,
        });

        if (newState.phase === 'TRUMP_SELECTION') {
          io.to(gameId).emit('bid:completed', {
            winningBidder: newState.winningBidder,
            winningBid: newState.highestBid,
            gameState: newState,
          });
          io.to(gameId).emit('trump:selection', {
            playerId: newState.winningBidder,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        } else {
          io.to(gameId).emit('bid:turn', {
            currentTurn: newState.currentTurn,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        }
      } else {
        engine.passBid(currentTurnPlayer.id);
        const newState = engine.getGameState();
        io.to(gameId).emit('bid:passed', {
          playerId: currentTurnPlayer.id,
          gameState: newState,
        });

        if (newState.phase === 'TRUMP_SELECTION') {
          io.to(gameId).emit('bid:completed', {
            winningBidder: newState.winningBidder,
            winningBid: newState.highestBid,
            gameState: newState,
          });
          io.to(gameId).emit('trump:selection', {
            playerId: newState.winningBidder,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        } else {
          io.to(gameId).emit('bid:turn', {
            currentTurn: newState.currentTurn,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        }
      }
    } else if (currentState.phase === 'TRUMP_SELECTION') {
      const suit = BotAI.getTrumpDecision(currentTurnPlayer);
      engine.selectTrump(currentTurnPlayer.id, suit);
      const newState = engine.getGameState();

      io.to(gameId).emit('trump:selected', {
        playerId: currentTurnPlayer.id,
        suit,
        gameState: newState,
      });

      io.to(gameId).emit('turn:changed', {
        currentTurn: newState.currentTurn,
        leadSuit: newState.leadSuit,
        gameState: newState,
      });

      triggerBotTurn(io, gameId, engine);
    } else if (currentState.phase === 'PLAYING') {
      const card = BotAI.getCardToPlay(currentState, currentTurnPlayer);
      if (!card) return;

      const result = engine.playCard(currentTurnPlayer.id, card.id);
      if (!result.success) return;

      const newState = engine.getGameState();
      io.to(gameId).emit('card:played', {
        playerId: currentTurnPlayer.id,
        cardId: card.id,
        seat: currentTurnPlayer.seat,
        gameState: newState,
      });

      if (result.trickComplete) {
        io.to(gameId).emit('trick:completed', {
          winner: result.trickWinner,
          gameState: newState,
        });

        if (newState.phase === 'ROUND_COMPLETE') {
          io.to(gameId).emit('round:completed', {
            gameState: newState,
          });
        } else {
          io.to(gameId).emit('turn:changed', {
            currentTurn: newState.currentTurn,
            leadSuit: newState.leadSuit,
            gameState: newState,
          });
          setTimeout(() => triggerBotTurn(io, gameId, engine), 1000);
        }
      } else {
        io.to(gameId).emit('turn:changed', {
          currentTurn: newState.currentTurn,
          leadSuit: newState.leadSuit,
          gameState: newState,
        });
        triggerBotTurn(io, gameId, engine);
      }
    }
  }, 850);
}

/**
 * WebSocket event handlers for real-time game communication
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    /**
     * Start a Single Player / Solo game with 3 AI Bots
     */
    socket.on('game:startSolo', (data: { playerId: string; username: string }) => {
      const { playerId, username } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.createGame();
      const engine = gameService.getGame(gameId);

      if (!engine) {
        socket.emit('error', { message: 'Failed to create solo game' });
        return;
      }

      // Add human player to Seat 1
      engine.addPlayer(playerId, username, socket.id, false);
      engine.setReady(playerId, true);

      // Fill remaining seats (2, 3, 4) with AI Bots
      engine.fillWithBots();

      gameService.registerPlayer(playerId, gameId);
      socket.join(gameId);

      // Start game immediately
      const startResult = engine.startGame();
      if (startResult.success) {
        const state = engine.getGameState();
        socket.emit('player:joined', {
          playerId,
          username,
          seat: 1,
          gameId,
          gameState: engine.getGameState(playerId),
        });

        io.to(gameId).emit('game:started', { gameState: state });
        io.to(gameId).emit('cards:dealt', { gameState: state });
        io.to(gameId).emit('bid:turn', {
          currentTurn: state.currentTurn,
          gameState: state,
        });

        // Trigger bot turn if first turn belongs to a bot
        triggerBotTurn(io, gameId, engine);
      } else {
        socket.emit('error', { message: startResult.error || 'Failed to start solo game' });
      }
    });

    /**
     * Join a multiplayer game room
     */
    socket.on('game:join', (data: { gameId: string; playerId: string; username: string }) => {
      const { gameId, playerId, username } = data;
      const gameService = GameService.getInstance();
      const engine = gameService.getGame(gameId);

      if (!engine) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Add player to game
      const result = engine.addPlayer(playerId, username, socket.id, false);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Register player and join room
      gameService.registerPlayer(playerId, gameId);
      socket.join(gameId);

      // Notify all players
      io.to(gameId).emit('player:joined', {
        playerId,
        username,
        seat: result.seat,
        gameId,
        gameState: engine.getGameState(playerId),
      });

      // Auto ready for quick match
      engine.setReady(playerId, true);
      const state = engine.getGameState();
      if (state.players.length === 4 && state.players.every((p) => p.ready)) {
        const startResult = engine.startGame();
        if (startResult.success) {
          const newState = engine.getGameState();
          io.to(gameId).emit('game:started', { gameState: newState });
          io.to(gameId).emit('cards:dealt', { gameState: newState });
          io.to(gameId).emit('bid:turn', {
            currentTurn: newState.currentTurn,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        }
      }
    });

    /**
     * Leave a game
     */
    socket.on('game:leave', (data: { playerId: string }) => {
      const { playerId } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      engine.removePlayer(playerId);
      gameService.unregisterPlayer(playerId);
      socket.leave(gameId);

      io.to(gameId).emit('player:left', {
        playerId,
        gameState: engine.getGameState(),
      });
    });

    /**
     * Set player ready status
     */
    socket.on('player:ready', (data: { playerId: string; ready: boolean }) => {
      const { playerId, ready } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      engine.setReady(playerId, ready);

      const state = engine.getGameState();
      io.to(gameId).emit('player:ready', {
        playerId,
        ready,
        gameState: state,
      });

      if (state.players.length === 4 && state.players.every((p) => p.ready) && state.phase === 'WAITING_FOR_PLAYERS') {
        const startResult = engine.startGame();

        if (startResult.success) {
          const newState = engine.getGameState();
          io.to(gameId).emit('game:started', { gameState: newState });
          io.to(gameId).emit('cards:dealt', { gameState: newState });
          io.to(gameId).emit('bid:turn', {
            currentTurn: state.currentTurn,
            gameState: newState,
          });
          triggerBotTurn(io, gameId, engine);
        }
      }
    });

    /**
     * Place a bid
     */
    socket.on('bid:place', (data: { playerId: string; amount: number }) => {
      const { playerId, amount } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      const result = engine.placeBid(playerId, amount);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const state = engine.getGameState();
      io.to(gameId).emit('bid:placed', {
        playerId,
        amount,
        highestBid: state.highestBid,
        winningBidder: state.winningBidder,
        gameState: state,
      });

      if (state.phase === 'TRUMP_SELECTION') {
        io.to(gameId).emit('bid:completed', {
          winningBidder: state.winningBidder,
          winningBid: state.highestBid,
          gameState: state,
        });

        io.to(gameId).emit('trump:selection', {
          playerId: state.winningBidder,
          gameState: state,
        });
        triggerBotTurn(io, gameId, engine);
      } else {
        io.to(gameId).emit('bid:turn', {
          currentTurn: state.currentTurn,
          gameState: state,
        });
        triggerBotTurn(io, gameId, engine);
      }
    });

    /**
     * Pass on bidding
     */
    socket.on('bid:pass', (data: { playerId: string }) => {
      const { playerId } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      const result = engine.passBid(playerId);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const state = engine.getGameState();
      io.to(gameId).emit('bid:passed', {
        playerId,
        gameState: state,
      });

      if (state.phase === 'TRUMP_SELECTION') {
        io.to(gameId).emit('bid:completed', {
          winningBidder: state.winningBidder,
          winningBid: state.highestBid,
          gameState: state,
        });

        io.to(gameId).emit('trump:selection', {
          playerId: state.winningBidder,
          gameState: state,
        });
        triggerBotTurn(io, gameId, engine);
      } else {
        io.to(gameId).emit('bid:turn', {
          currentTurn: state.currentTurn,
          gameState: state,
        });
        triggerBotTurn(io, gameId, engine);
      }
    });

    /**
     * Select trump suit
     */
    socket.on('trump:select', (data: { playerId: string; suit: string }) => {
      const { playerId, suit } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      const result = engine.selectTrump(playerId, suit as 'spades' | 'hearts' | 'diamonds' | 'clubs');

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const state = engine.getGameState();
      io.to(gameId).emit('trump:selected', {
        playerId,
        suit,
        gameState: state,
      });

      if (state.trumpRevealed) {
        io.to(gameId).emit('trump:revealed', {
          suit,
          gameState: state,
        });
      }

      // Start playing phase
      io.to(gameId).emit('turn:changed', {
        currentTurn: state.currentTurn,
        leadSuit: state.leadSuit,
        gameState: state,
      });

      triggerBotTurn(io, gameId, engine);
    });

    /**
     * Play a card
     */
    socket.on('card:play', (data: { playerId: string; cardId: string }) => {
      const { playerId, cardId } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      const result = engine.playCard(playerId, cardId);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      const state = engine.getGameState();

      io.to(gameId).emit('card:played', {
        playerId,
        cardId,
        seat: state.players.find((p) => p.id === playerId)?.seat,
        gameState: state,
      });

      if (result.trickComplete) {
        io.to(gameId).emit('trick:completed', {
          winner: result.trickWinner,
          gameState: state,
        });

        if (state.phase === 'ROUND_COMPLETE') {
          io.to(gameId).emit('round:completed', {
            gameState: state,
          });
        } else {
          io.to(gameId).emit('turn:changed', {
            currentTurn: state.currentTurn,
            leadSuit: state.leadSuit,
            gameState: state,
          });
          setTimeout(() => triggerBotTurn(io, gameId, engine), 1000);
        }
      } else {
        io.to(gameId).emit('turn:changed', {
          currentTurn: state.currentTurn,
          leadSuit: state.leadSuit,
          gameState: state,
        });
        triggerBotTurn(io, gameId, engine);
      }
    });

    /**
     * Request current game state
     */
    socket.on('game:request', (data: { playerId: string; gameId: string }) => {
      const { playerId, gameId } = data;
      const gameService = GameService.getInstance();
      const engine = gameService.getGame(gameId);

      if (!engine) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const state = engine.getGameState(playerId);
      socket.emit('game:state', { gameState: state });
    });

    /**
     * Reconnect to a game
     */
    socket.on('game:reconnect', (data: { playerId: string; gameId: string }) => {
      const { playerId, gameId } = data;
      const gameService = GameService.getInstance();
      const engine = gameService.getGame(gameId);

      if (!engine) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const result = engine.reconnectPlayer(playerId, socket.id);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      gameService.registerPlayer(playerId, gameId);
      socket.join(gameId);

      const state = engine.getGameState(playerId);
      socket.emit('game:state', { gameState: state });
      socket.emit('player:reconnected', { playerId });
    });

    /**
     * Start next round
     */
    socket.on('game:nextRound', (data: { playerId: string }) => {
      const { playerId } = data;
      const gameService = GameService.getInstance();
      const gameId = gameService.getPlayerGame(playerId);

      if (!gameId) {
        socket.emit('error', { message: 'Not in a game' });
        return;
      }

      const engine = gameService.getGame(gameId);
      if (!engine) {
        return;
      }

      const result = engine.startNextRound();

      if (result.success) {
        const state = engine.getGameState();

        if (result.gameComplete) {
          io.to(gameId).emit('game:completed', {
            gameState: state,
          });
        } else {
          io.to(gameId).emit('game:started', {
            gameState: state,
          });

          io.to(gameId).emit('cards:dealt', {
            gameState: state,
          });

          io.to(gameId).emit('bid:turn', {
            currentTurn: state.currentTurn,
            gameState: state,
          });

          triggerBotTurn(io, gameId, engine);
        }
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      const gameService = GameService.getInstance();
      
      // Find player's game
      let playerId: string | null = null;
      let gameId: string | null = null;
      
      gameService.getAllGames().forEach(game => {
        const engine = gameService.getGame(game.gameId);
        if (engine) {
          const state = engine.getGameState();
          const player = state.players.find(p => p.socketId === socket.id);
          if (player) {
            playerId = player.id;
            gameId = game.gameId;
          }
        }
      });

      if (playerId && gameId) {
        const engine = gameService.getGame(gameId);
        if (engine) {
          engine.removePlayer(playerId);
          
          io.to(gameId).emit('player:disconnected', {
            playerId,
            gameState: engine.getGameState(),
          });
        }
      }
    });
  });
}
