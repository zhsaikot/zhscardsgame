import type { Card, Suit } from '../types/index.js';

/**
 * Determines the winner of a trick based on cards played
 * Rules:
 * 1. Trump beats non-trump
 * 2. If no trump played, highest card of lead suit wins
 * 3. Cards from other suits (non-trump, non-lead) cannot win
 * 4. Within same relevant suit: J > 9 > A > 10 > K > Q > 8 > 7
 * 
 * @param plays - Array of plays with seat and card
 * @param leadSuit - The suit led in this trick
 * @param trumpSuit - The trump suit for this round
 * @returns The seat number (1-4) of the winning player
 */
export function determineTrickWinner(
  plays: { seat: number; card: Card }[],
  leadSuit: Suit | null,
  trumpSuit: Suit | null
): number {
  if (plays.length === 0) {
    throw new Error('Cannot determine winner with no plays');
  }

  // First play determines the leader and their seat
  const firstPlay = plays[0];

  // If only one play, that player wins (shouldn't happen in normal game)
  if (plays.length === 1) {
    return firstPlay.seat;
  }

  let winningSeat = firstPlay.seat;
  let winningCard = firstPlay.card;

  for (let i = 1; i < plays.length; i++) {
    const currentPlay = plays[i];
    const currentCard = currentPlay.card;

    if (isCardBetter(currentCard, winningCard, leadSuit, trumpSuit)) {
      winningCard = currentCard;
      winningSeat = currentPlay.seat;
    }
  }

  return winningSeat;
}

/**
 * Compares two cards to determine if the challenger beats the current winner
 */
function isCardBetter(
  challenger: Card,
  currentWinner: Card,
  leadSuit: Suit | null,
  trumpSuit: Suit | null
): boolean {
  // If no lead suit yet (first card), challenger can't beat it
  if (!leadSuit) {
    return false;
  }

  const challengerIsTrump = trumpSuit !== null && challenger.suit === trumpSuit;
  const winnerIsTrump = trumpSuit !== null && currentWinner.suit === trumpSuit;
  const challengerIsLead = challenger.suit === leadSuit;
  const winnerIsLead = currentWinner.suit === leadSuit;

  // Case 1: Challenger is trump, winner is not trump
  if (challengerIsTrump && !winnerIsTrump) {
    return true;
  }

  // Case 2: Winner is trump, challenger is not trump
  if (winnerIsTrump && !challengerIsTrump) {
    return false;
  }

  // Case 3: Both are trump - compare by power
  if (challengerIsTrump && winnerIsTrump) {
    return challenger.power > currentWinner.power;
  }

  // Case 4: Neither is trump
  // Challenger must follow lead suit to have a chance
  if (!challengerIsLead) {
    return false;
  }

  // If winner doesn't follow lead suit but challenger does, challenger wins
  if (!winnerIsLead) {
    return true;
  }

  // Both follow lead suit - compare by power
  return challenger.power > currentWinner.power;
}

/**
 * Calculates the total points in a trick
 * @param plays - Array of plays with cards
 * @returns Total point value of all cards in the trick
 */
export function calculateTrickPoints(plays: { card: Card }[]): number {
  return plays.reduce((total, play) => total + play.card.pointValue, 0);
}

/**
 * Gets legal cards a player can play based on game state
 * Rules:
 * - If no lead suit (player is leading), all cards are legal
 * - If player has cards matching lead suit, only those are legal
 * - If player has no cards matching lead suit, all cards are legal
 * 
 * @param hand - Player's current hand
 * @param leadSuit - Current lead suit (null if leading)
 * @returns Array of legal cards the player can play
 */
export function getLegalCards(hand: Card[], leadSuit: Suit | null): Card[] {
  // If no lead suit, player is leading - all cards are legal
  if (!leadSuit) {
    return [...hand];
  }

  // Find cards matching lead suit
  const matchingCards = hand.filter(card => card.suit === leadSuit);

  // If player has matching cards, only those are legal
  if (matchingCards.length > 0) {
    return matchingCards;
  }

  // Player has no matching cards - all cards are legal
  return [...hand];
}

/**
 * Validates if a card play is legal
 * @param card - The card being played
 * @param hand - Player's current hand
 * @param leadSuit - Current lead suit (null if leading)
 * @returns Object with isValid flag and reason if invalid
 */
export function validateCardPlay(
  card: Card,
  hand: Card[],
  leadSuit: Suit | null
): { isValid: boolean; reason?: string } {
  // Check if player owns the card
  const cardInHand = hand.find(c => c.id === card.id);
  if (!cardInHand) {
    return { isValid: false, reason: "You don't have that card" };
  }

  // If no lead suit, any card is valid (player is leading)
  if (!leadSuit) {
    return { isValid: true };
  }

  // Check if player has cards matching lead suit
  const matchingCards = hand.filter(c => c.suit === leadSuit);

  // If player has matching cards, they must play one
  if (matchingCards.length > 0 && card.suit !== leadSuit) {
    return { isValid: false, reason: 'You must follow the lead suit' };
  }

  return { isValid: true };
}
