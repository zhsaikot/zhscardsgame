import type { Server, Socket } from 'socket.io';
import { GameService } from '../services/GameService.js';

/**
 * WebSocket event handlers for real-time game communication
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    /**
     * Join a game room
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
      const result = engine.addPlayer(playerId, username, socket.id);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Register player and join room
      gameService.registerPlayer(playerId, gameId);
      socket.join(gameId);

      // Notify all players
      const state = engine.getGameState();
      io.to(gameId).emit('player:joined', {
        playerId,
        username,
        seat: result.seat,
        gameState: engine.getGameState(playerId),
      });
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

      // Auto-start if all players are ready and game hasn't started
      if (state.players.every(p => p.ready) && state.phase === 'WAITING_FOR_PLAYERS') {
        const startResult = engine.startGame();
        
        if (startResult.success) {
          const newState = engine.getGameState();
          io.to(gameId).emit('game:started', {
            gameState: newState,
          });
          
          // Send initial deal event
          io.to(gameId).emit('cards:dealt', {
            gameState: newState,
          });
          
          // Start bidding
          io.to(gameId).emit('bid:turn', {
            currentTurn: state.currentTurn,
            gameState: newState,
          });
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

      // Check if bidding is complete
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
      } else {
        io.to(gameId).emit('bid:turn', {
          currentTurn: state.currentTurn,
          gameState: state,
        });
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
      } else {
        io.to(gameId).emit('bid:turn', {
          currentTurn: state.currentTurn,
          gameState: state,
        });
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
        seat: state.players.find(p => p.id === playerId)?.seat,
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
        }
      } else {
        io.to(gameId).emit('turn:changed', {
          currentTurn: state.currentTurn,
          leadSuit: state.leadSuit,
          gameState: state,
        });
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

  console.log('WebSocket handlers registered');
}
