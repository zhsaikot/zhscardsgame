import type { GameSettings } from '../types/index.js';

/**
 * Default game rules configuration
 * Configurable to support regional variations of 29
 */
export const DEFAULT_GAME_RULES: GameSettings = {
  /**
   * Minimum bid allowed (default: 16)
   */
  minBid: 16,

  /**
   * Maximum bid allowed (default: 28)
   */
  maxBid: 28,

  /**
   * Whether trump suit is hidden until revealed by game rules
   */
  hiddenTrump: false,

  /**
   * Bonus points for winning the final trick (default: 1)
   */
  finalTrickBonus: 1,

  /**
   * Direction of dealer rotation
   */
  dealerRotation: 'clockwise',

  /**
   * Scoring mode variant
   */
  scoringMode: 'classic',

  /**
   * Score needed to win the game (0 means play fixed number of rounds)
   */
  winningScore: 0,
};

/**
 * Player count constants
 */
export const PLAYER_COUNT = 4;

/**
 * Initial cards dealt before bidding
 */
export const INITIAL_CARDS = 4;

/**
 * Final hand size after complete deal
 */
export const FINAL_HAND_SIZE = 8;

/**
 * Team seat assignments
 * Team A: Seats 1 and 3
 * Team B: Seats 2 and 4
 */
export const TEAM_ASSIGNMENTS = {
  1: 'A' as const,
  2: 'B' as const,
  3: 'A' as const,
  4: 'B' as const,
};

/**
 * Gets the team for a given seat number
 */
export function getTeamForSeat(seat: number): 'A' | 'B' {
  return TEAM_ASSIGNMENTS[seat as keyof typeof TEAM_ASSIGNMENTS];
}

/**
 * Gets the partner seat for a given seat number
 */
export function getPartnerSeat(seat: number): number {
  if (seat === 1) return 3;
  if (seat === 3) return 1;
  if (seat === 2) return 4;
  if (seat === 4) return 2;
  throw new Error(`Invalid seat number: ${seat}`);
}

/**
 * Gets the next seat in clockwise order
 */
export function getNextSeat(seat: number): number {
  return ((seat % 4) + 1);
}

/**
 * Gets the previous seat in counter-clockwise order
 */
export function getPreviousSeat(seat: number): number {
  return seat === 1 ? 4 : seat - 1;
}
