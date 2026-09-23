import { determineTrickWinner, getLegalCards } from '../../shared/utils/trick.js';
import type { Player, Card, Suit, GameState } from '../../shared/types/index.js';

export class BotAI {
  /**
   * Decide whether the bot should bid or pass
   */
  static getBidDecision(gameState: GameState, bot: Player): { action: 'bid' | 'pass'; amount?: number } {
    const minBid = gameState.settings?.minBid || 16;
    const maxBid = gameState.settings?.maxBid || 28;
    const currentHighest = gameState.highestBid;
    const targetBid = currentHighest ? currentHighest + 1 : minBid;

    if (targetBid > maxBid) {
      return { action: 'pass' };
    }

    // Evaluate point cards in bot's initial 4 cards
    const hand = bot.hand || [];
    let powerPoints = 0;
    for (const card of hand) {
      if (card.rank === 'J') powerPoints += 3;
      else if (card.rank === '9') powerPoints += 2;
      else if (card.rank === 'A') powerPoints += 1;
      else if (card.rank === '10') powerPoints += 1;
    }

    // Aggressiveness threshold
    // If bot has >= 4 card points, willing to bid up to 17
    // If bot has >= 6 card points, willing to bid up to 18
    let maxBotWillingToBid = 0;
    if (powerPoints >= 6) {
      maxBotWillingToBid = 18;
    } else if (powerPoints >= 4) {
      maxBotWillingToBid = 17;
    } else if (powerPoints >= 3 && !currentHighest) {
      maxBotWillingToBid = 16;
    }

    if (targetBid <= maxBotWillingToBid) {
      return { action: 'bid', amount: targetBid };
    }

    return { action: 'pass' };
  }

  /**
   * Select trump suit for bot
   */
  static getTrumpDecision(bot: Player): Suit {
    const hand = bot.hand || [];
    const suitCounts: Record<Suit, { count: number; points: number }> = {
      spades: { count: 0, points: 0 },
      hearts: { count: 0, points: 0 },
      diamonds: { count: 0, points: 0 },
      clubs: { count: 0, points: 0 },
    };

    for (const card of hand) {
      suitCounts[card.suit].count += 1;
      suitCounts[card.suit].points += card.power;
    }

    let bestSuit: Suit = 'spades';
    let bestScore = -1;

    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]) {
      const score = suitCounts[suit].count * 10 + suitCounts[suit].points;
      if (score > bestScore) {
        bestScore = score;
        bestSuit = suit;
      }
    }

    return bestSuit;
  }

  /**
   * Select card to play for bot
   */
  static getCardToPlay(gameState: GameState, bot: Player): Card {
    const hand = bot.hand || [];
    const legalCards = getLegalCards(hand, gameState.leadSuit);

    if (legalCards.length === 0) {
      return hand[0];
    }

    if (legalCards.length === 1) {
      return legalCards[0];
    }

    const currentTrick = gameState.currentTrick;
    const plays = currentTrick?.plays || [];

    // Partner seat: 1 & 3 are Team A, 2 & 4 are Team B
    const partnerSeat = bot.seat === 1 ? 3 : bot.seat === 2 ? 4 : bot.seat === 3 ? 1 : 2;

    // If bot is leading the trick (first card)
    if (plays.length === 0) {
      // Prefer leading with a high card (J or 9 or A) or a low card if no high
      const highCard = legalCards.find(c => c.rank === 'A' || c.rank === '9' || c.rank === 'J');
      if (highCard) return highCard;
      // Otherwise play lowest card
      return [...legalCards].sort((a, b) => a.power - b.power)[0];
    }

    // If following in a trick
    try {
      const winningSeat = determineTrickWinner(plays, gameState.leadSuit, gameState.trumpSuit);
      const isPartnerWinning = winningSeat === partnerSeat;

      if (isPartnerWinning) {
        // Partner is currently winning!
        // Throw valuable point card to boost team score (10, A, or 9)
        const pointCard = legalCards.find(c => c.pointValue > 0);
        if (pointCard) return pointCard;
        // Otherwise throw lowest card
        return [...legalCards].sort((a, b) => a.power - b.power)[0];
      } else {
        // Opponent is winning. Try to win with lowest winning card!
        const winningCards: Card[] = [];
        for (const candidate of legalCards) {
          const simulatedPlays = [...plays, { seat: bot.seat, card: candidate, playerId: bot.id }];
          const simulatedWinner = determineTrickWinner(
            simulatedPlays,
            gameState.leadSuit,
            gameState.trumpSuit
          );
          if (simulatedWinner === bot.seat) {
            winningCards.push(candidate);
          }
        }

        if (winningCards.length > 0) {
          // Play the lowest power card that still wins
          winningCards.sort((a, b) => a.power - b.power);
          return winningCards[0];
        }

        // Cannot win trick, discard lowest point/power card
        return [...legalCards].sort((a, b) => a.power - b.power)[0];
      }
    } catch {
      // Fallback
      return legalCards[0];
    }
  }
}

