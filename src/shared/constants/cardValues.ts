import type { Rank } from '../types/index.js';

/**
 * Point values for each card rank in the 29 game
 * J = 3, 9 = 2, A = 1, 10 = 1, K/Q/8/7 = 0
 */
export const CARD_VALUES: Record<Rank, number> = {
  J: 3,
  '9': 2,
  A: 1,
  '10': 1,
  K: 0,
  Q: 0,
  '8': 0,
  '7': 0,
};

/**
 * Power values for card ranking in trick comparison
 * J > 9 > A > 10 > K > Q > 8 > 7
 */
export const CARD_POWER: Record<Rank, number> = {
  J: 8,
  '9': 7,
  A: 6,
  '10': 5,
  K: 4,
  Q: 3,
  '8': 2,
  '7': 1,
};

/**
 * Total points in a round (28 from cards + 1 final trick bonus)
 */
export const TOTAL_POINTS = 29;

/**
 * Number of tricks per round
 */
export const TRICKS_PER_ROUND = 8;

/**
 * Cards per suit
 */
export const CARDS_PER_SUIT = 8;

/**
 * Total cards in deck
 */
export const TOTAL_CARDS = 32;
