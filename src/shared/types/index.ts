export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  pointValue: number;
  power: number;
}

export type Team = 'A' | 'B';

export interface Player {
  id: string;
  username: string;
  avatar?: string;
  seat: number; // 1-4
  team: Team;
  connected: boolean;
  ready: boolean;
  hand: Card[];
  socketId?: string;
}

export interface Bid {
  playerId: string;
  amount: number;
  passed: boolean;
}

export interface Trick {
  leader: number; // seat number 1-4
  leadSuit: Suit | null;
  plays: { playerId: string; seat: number; card: Card }[];
  winner: number | null; // seat number
  points: number;
}

export interface Round {
  roundNumber: number;
  dealer: number; // seat number
  players: Player[];
  initialHands: Record<string, Card[]>;
  bids: Bid[];
  winningBidder: number | null; // seat number
  winningBid: number | null;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  tricks: Trick[];
  teamPoints: { A: number; B: number };
  winningTeam: Team | null;
  contractResult: 'success' | 'failure' | null;
}

export type GamePhase =
  | 'LOBBY'
  | 'WAITING_FOR_PLAYERS'
  | 'DEAL_INITIAL'
  | 'BIDDING'
  | 'TRUMP_SELECTION'
  | 'DEAL_REMAINING'
  | 'PLAYING'
  | 'TRICK_COMPLETE'
  | 'ROUND_COMPLETE'
  | 'SCORE_UPDATE'
  | 'NEXT_ROUND'
  | 'GAME_COMPLETE';

export interface GameScore {
  teamA: number;
  teamB: number;
  roundsPlayed: number;
}

export interface GameState {
  gameId: string;
  status: 'waiting' | 'playing' | 'completed';
  phase: GamePhase;
  players: Player[];
  dealer: number | null; // seat number
  currentTurn: number | null; // seat number
  deck: Card[];
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  highestBid: number | null;
  winningBidder: number | null; // seat number
  targetBid: number | null;
  leadSuit: Suit | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  teamPoints: { A: number; B: number };
  gameScore: GameScore;
  roundNumber: number;
  settings: GameSettings;
}

export interface GameSettings {
  minBid: number;
  maxBid: number;
  hiddenTrump: boolean;
  finalTrickBonus: number;
  dealerRotation: 'clockwise' | 'counter-clockwise';
  scoringMode: 'classic' | 'alternative';
  winningScore: number;
}

export interface Move {
  id: string;
  gameId: string;
  roundId: number;
  playerId: string;
  action: string;
  cardId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
