import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState, Player, Card, Suit, Trick } from '@shared/types';

export interface TrickCelebration {
  winnerSeat: number;
  playerName: string;
  points: number;
  trick: Trick | null;
}

interface GameStore {
  // State
  socket: Socket | null;
  connected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  username: string | null;
  gameId: string | null;
  selectedCard: Card | null;
  error: string | null;
  trickCelebration: TrickCelebration | null;
  
  // Actions
  connect: (url?: string) => void;
  disconnect: () => void;
  createGame: (username: string) => Promise<string>;
  startSoloGame: (username: string) => Promise<string>;
  joinGame: (gameId: string, username: string) => Promise<void>;
  leaveGame: () => void;
  setReady: (ready: boolean) => void;
  placeBid: (amount: number) => void;
  passBid: () => void;
  selectTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
  nextRound: () => void;
  requestGameState: () => void;
  setSelectedCard: (card: Card | null) => void;
  clearError: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  gameState: null,
  playerId: null,
  username: null,
  gameId: null,
  selectedCard: null,
  error: null,
  trickCelebration: null,

  connect: (url?: string) => {
    const defaultUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:4000'
      : `${window.location.protocol}//${window.location.hostname}:4000`;
    const targetUrl = url || defaultUrl;

    const socket = io(targetUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      set({ connected: true, error: null });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      set({ connected: false });
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data);
      set({ error: data.message });
    });

    const syncState = (incomingState: GameState, extraUpdates: Record<string, any> = {}) => {
      if (!incomingState) return;
      const { playerId, gameState: existingState } = get();

      if (playerId && existingState?.players && incomingState.players) {
        const existingPlayer = existingState.players.find((p) => p.id === playerId);
        const incomingPlayer = incomingState.players.find((p) => p.id === playerId);

        // If incoming state lacks hand but existing state has hand, preserve it
        if (incomingPlayer && existingPlayer?.hand?.length && (!incomingPlayer.hand || incomingPlayer.hand.length === 0)) {
          incomingPlayer.hand = existingPlayer.hand;
        }
      }

      set({ gameState: incomingState, ...extraUpdates });
    };

    socket.on('game:state', (data: { gameState: GameState }) => {
      console.log('Received game state:', data.gameState);
      syncState(data.gameState);
    });

    socket.on('player:joined', (data: { playerId: string; username: string; seat: number; gameState: GameState }) => {
      console.log('Player joined:', data);
      syncState(data.gameState);
    });

    socket.on('player:left', (data: { playerId: string; gameState: GameState }) => {
      console.log('Player left:', data);
      syncState(data.gameState);
    });

    socket.on('player:disconnected', (data: { playerId: string; gameState: GameState }) => {
      console.log('Player disconnected:', data);
      syncState(data.gameState);
    });

    socket.on('player:reconnected', (data: { playerId: string }) => {
      console.log('Player reconnected:', data);
    });

    socket.on('game:started', (data: { gameState: GameState }) => {
      console.log('Game started:', data);
      syncState(data.gameState, { error: null });
    });

    socket.on('cards:dealt', (data: { gameState: GameState }) => {
      console.log('Cards dealt:', data);
      syncState(data.gameState);
    });

    socket.on('bid:turn', (data: { currentTurn: number; gameState: GameState }) => {
      console.log('Bid turn:', data);
      syncState(data.gameState);
    });

    socket.on('bid:placed', (data: { playerId: string; amount: number; highestBid: number; winningBidder: number; gameState: GameState }) => {
      console.log('Bid placed:', data);
      syncState(data.gameState);
    });

    socket.on('bid:passed', (data: { playerId: string; gameState: GameState }) => {
      console.log('Bid passed:', data);
      syncState(data.gameState);
    });

    socket.on('bid:completed', (data: { winningBidder: number; winningBid: number; gameState: GameState }) => {
      console.log('Bidding completed:', data);
      syncState(data.gameState);
    });

    socket.on('trump:selection', (data: { playerId: number; gameState: GameState }) => {
      console.log('Trump selection:', data);
      syncState(data.gameState);
    });

    socket.on('trump:selected', (data: { playerId: string; suit: Suit; gameState: GameState }) => {
      console.log('Trump selected:', data);
      syncState(data.gameState);
    });

    socket.on('trump:revealed', (data: { suit: Suit; gameState: GameState }) => {
      console.log('Trump revealed:', data);
      syncState(data.gameState);
    });

    socket.on('turn:changed', (data: { currentTurn: number; leadSuit: Suit | null; gameState: GameState }) => {
      console.log('Turn changed:', data);
      syncState(data.gameState, { selectedCard: null });
    });

    socket.on('card:played', (data: { playerId: string; cardId: string; seat: number; gameState: GameState }) => {
      console.log('Card played:', data);
      syncState(data.gameState, { selectedCard: null });
    });

    socket.on('trick:completed', (data: { winner: number; completedTrick?: any; gameState: GameState }) => {
      console.log('Trick completed:', data);
      const winnerPlayer = data.gameState?.players?.find((p) => p.seat === data.winner);
      const playerName = winnerPlayer?.username || `Seat ${data.winner}`;
      const trickObj = data.completedTrick || data.gameState?.lastCompletedTrick || null;
      const points = trickObj?.points ?? 0;

      set({
        trickCelebration: {
          winnerSeat: data.winner,
          playerName,
          points,
          trick: trickObj,
        },
      });

      setTimeout(() => {
        set({ trickCelebration: null });
      }, 1800);

      syncState(data.gameState);
    });

    socket.on('round:completed', (data: { gameState: GameState }) => {
      console.log('Round completed:', data);
      syncState(data.gameState);
    });

    socket.on('game:completed', (data: { gameState: GameState }) => {
      console.log('Game completed:', data);
      syncState(data.gameState);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false, gameState: null, playerId: null, gameId: null });
    }
  },

  createGame: async (username: string): Promise<string> => {
    const { socket } = get();
    
    if (!socket) {
      throw new Error('Not connected to server');
    }

    const playerId = `player_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      socket.emit('game:join', { 
        gameId: `game_${Date.now()}`, 
        playerId, 
        username 
      });
      
      // Store player info
      set({ playerId, username });
      
      // Listen for response
      socket.once('player:joined', (data: { gameId?: string }) => {
        if (data.gameId) {
          set({ gameId: data.gameId });
          resolve(data.gameId);
        }
      });
      
      socket.once('error', (err: { message: string }) => {
        reject(new Error(err.message));
      });
      
      // Set timeout
      setTimeout(() => reject(new Error('Timeout creating game')), 5000);
    });
  },

  startSoloGame: async (username: string): Promise<string> => {
    const { socket } = get();

    if (!socket) {
      throw new Error('Not connected to server');
    }

    const playerId = `player_${Date.now()}`;

    return new Promise((resolve, reject) => {
      socket.emit('game:startSolo', {
        playerId,
        username,
      });

      set({ playerId, username });

      socket.once('player:joined', (data: { gameId?: string }) => {
        if (data.gameId) {
          set({ gameId: data.gameId });
          resolve(data.gameId);
        }
      });

      socket.once('error', (err: { message: string }) => {
        reject(new Error(err.message));
      });

      setTimeout(() => reject(new Error('Timeout starting solo game')), 5000);
    });
  },

  joinGame: async (gameId: string, username: string): Promise<void> => {
    const { socket } = get();
    
    if (!socket) {
      throw new Error('Not connected to server');
    }

    const playerId = `player_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      socket.emit('game:join', { gameId, playerId, username });
      
      set({ playerId, username, gameId });
      
      socket.once('player:joined', () => {
        resolve();
      });
      
      socket.once('error', (err: { message: string }) => {
        reject(new Error(err.message));
      });
      
      setTimeout(() => reject(new Error('Timeout joining game')), 5000);
    });
  },

  leaveGame: () => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('game:leave', { playerId });
      set({ gameId: null, gameState: null });
    }
  },

  setReady: (ready: boolean) => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('player:ready', { playerId, ready });
    }
  },

  placeBid: (amount: number) => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('bid:place', { playerId, amount });
    }
  },

  passBid: () => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('bid:pass', { playerId });
    }
  },

  selectTrump: (suit: Suit) => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('trump:select', { playerId, suit });
    }
  },

  playCard: (cardId: string) => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('card:play', { playerId, cardId });
    }
  },

  nextRound: () => {
    const { socket, playerId } = get();
    
    if (socket && playerId) {
      socket.emit('game:nextRound', { playerId });
    }
  },

  requestGameState: () => {
    const { socket, playerId, gameId } = get();
    
    if (socket && playerId && gameId) {
      socket.emit('game:request', { playerId, gameId });
    }
  },

  setSelectedCard: (card: Card | null) => {
    set({ selectedCard: card });
  },

  clearError: () => {
    set({ error: null });
  },
}));
