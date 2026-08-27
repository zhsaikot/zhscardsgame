import { CARD_VALUES, CARD_POWER } from './cardValues.js';
import type { Card, Rank, Suit } from '../types/index.js';
import crypto from 'crypto';

/**
 * Creates a standard 32-card deck for the 29 game
 * Cards: J, 9, A, 10, K, Q, 8, 7 in each suit
 */
export function createDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
  
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const id = `${rank}${suit.charAt(0).toUpperCase()}`;
      deck.push({
        id,
        rank,
        suit,
        pointValue: CARD_VALUES[rank],
        power: CARD_POWER[rank],
      });
    }
  }

  return deck;
}

/**
 * Shuffles a deck using Fisher-Yates algorithm with secure randomness
 * @param deck - The deck to shuffle
 * @returns A new shuffled deck
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate secure random number
    const randomBytes = crypto.randomBytes(4);
    const j = randomBytes.readUInt32LE(0) % (i + 1);
    
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Deals cards from the deck to players
 * @param deck - The deck to deal from
 * @param numCards - Number of cards to deal to each player
 * @param numPlayers - Number of players (default 4)
 * @returns Array of hands and remaining deck
 */
export function dealCards(
  deck: Card[],
  numCards: number,
  numPlayers: number = 4
): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  const remainingDeck = [...deck];

  for (let i = 0; i < numCards; i++) {
    for (let player = 0; player < numPlayers; player++) {
      if (remainingDeck.length > 0) {
        hands[player].push(remainingDeck.shift()!);
      }
    }
  }

  return { hands, remainingDeck };
}

/**
 * Gets all cards of a specific suit from a hand
 */
export function getCardsBySuit(hand: Card[], suit: Suit): Card[] {
  return hand.filter(card => card.suit === suit);
}

/**
 * Checks if a hand contains any card of a specific suit
 */
export function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some(card => card.suit === suit);
}

/**
 * Sorts cards by power (descending)
 */
export function sortCardsByPower(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.power - a.power);
}

/**
 * Sorts cards by suit and then by power
 */
export function sortHand(hand: Card[]): Card[] {
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
  
  return [...hand].sort((a, b) => {
    const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return b.power - a.power;
  });
}
