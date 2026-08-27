import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState, Player, Card, Suit } from '@shared/types';

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
  
  // Actions
  connect: (url?: string) => void;
  disconnect: () => void;
  createGame: (username: string) => Promise<string>;
  joinGame: (gameId: string, username: string) => Promise<void>;
  leaveGame: () => void;
  setReady: (ready: boolean) => void;
  placeBid: (amount: number) => void;
  passBid: () => void;
  selectTrump: (suit: Suit) => void;
  playCard: (cardId: string) => void;
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

  connect: (url = 'http://localhost:4000') => {
    const socket = io(url, {
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

    socket.on('game:state', (data: { gameState: GameState }) => {
      console.log('Received game state:', data.gameState);
      set({ gameState: data.gameState });
    });

    socket.on('player:joined', (data: { playerId: string; username: string; seat: number; gameState: GameState }) => {
      console.log('Player joined:', data);
      set({ gameState: data.gameState });
    });

    socket.on('player:left', (data: { playerId: string; gameState: GameState }) => {
      console.log('Player left:', data);
      set({ gameState: data.gameState });
    });

    socket.on('player:disconnected', (data: { playerId: string; gameState: GameState }) => {
      console.log('Player disconnected:', data);
      set({ gameState: data.gameState });
    });

    socket.on('player:reconnected', (data: { playerId: string }) => {
      console.log('Player reconnected:', data);
    });

    socket.on('game:started', (data: { gameState: GameState }) => {
      console.log('Game started:', data);
      set({ gameState: data.gameState, error: null });
    });

    socket.on('cards:dealt', (data: { gameState: GameState }) => {
      console.log('Cards dealt:', data);
      set({ gameState: data.gameState });
    });

    socket.on('bid:turn', (data: { currentTurn: number; gameState: GameState }) => {
      console.log('Bid turn:', data);
      set({ gameState: data.gameState });
    });

    socket.on('bid:placed', (data: { playerId: string; amount: number; highestBid: number; winningBidder: number; gameState: GameState }) => {
      console.log('Bid placed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('bid:passed', (data: { playerId: string; gameState: GameState }) => {
      console.log('Bid passed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('bid:completed', (data: { winningBidder: number; winningBid: number; gameState: GameState }) => {
      console.log('Bidding completed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('trump:selection', (data: { playerId: number; gameState: GameState }) => {
      console.log('Trump selection:', data);
      set({ gameState: data.gameState });
    });

    socket.on('trump:selected', (data: { playerId: string; suit: Suit; gameState: GameState }) => {
      console.log('Trump selected:', data);
      set({ gameState: data.gameState });
    });

    socket.on('trump:revealed', (data: { suit: Suit; gameState: GameState }) => {
      console.log('Trump revealed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('turn:changed', (data: { currentTurn: number; leadSuit: Suit | null; gameState: GameState }) => {
      console.log('Turn changed:', data);
      set({ gameState: data.gameState, selectedCard: null });
    });

    socket.on('card:played', (data: { playerId: string; cardId: string; seat: number; gameState: GameState }) => {
      console.log('Card played:', data);
      set({ gameState: data.gameState, selectedCard: null });
    });

    socket.on('trick:completed', (data: { winner: number; gameState: GameState }) => {
      console.log('Trick completed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('round:completed', (data: { gameState: GameState }) => {
      console.log('Round completed:', data);
      set({ gameState: data.gameState });
    });

    socket.on('game:completed', (data: { gameState: GameState }) => {
      console.log('Game completed:', data);
      set({ gameState: data.gameState });
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
