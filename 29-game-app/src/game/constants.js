// Card values for 29 game
export const CARD_VALUES = {
  J: 3,
  9: 2,
  A: 1,
  10: 1,
  K: 0,
  Q: 0,
  8: 0,
  7: 0
};

// Card power for comparison (higher wins)
export const CARD_POWER = {
  J: 8,
  9: 7,
  A: 6,
  10: 5,
  K: 4,
  Q: 3,
  8: 2,
  7: 1
};

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];

export const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

export const SUIT_COLORS = {
  spades: '#1a1a2e',
  hearts: '#e63946',
  diamonds: '#e63946',
  clubs: '#1a1a2e'
};

export const GAME_RULES = {
  PLAYER_COUNT: 4,
  CARDS_IN_DECK: 32,
  INITIAL_CARDS: 4,
  FINAL_HAND_SIZE: 8,
  TRICKS_PER_ROUND: 8,
  MIN_BID: 16,
  MAX_BID: 28,
  TOTAL_POINTS: 29,
  FINAL_TRICK_BONUS: 1
};

export const GAME_PHASES = {
  LOBBY: 'LOBBY',
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  DEAL_INITIAL: 'DEAL_INITIAL',
  BIDDING: 'BIDDING',
  TRUMP_SELECTION: 'TRUMP_SELECTION',
  DEAL_REMAINING: 'DEAL_REMAINING',
  PLAYING: 'PLAYING',
  TRICK_COMPLETE: 'TRICK_COMPLETE',
  ROUND_COMPLETE: 'ROUND_COMPLETE',
  SCORE_UPDATE: 'SCORE_UPDATE',
  NEXT_ROUND: 'NEXT_ROUND',
  GAME_COMPLETE: 'GAME_COMPLETE'
};
