import type { GameSettings } from '../types/index.js';
import { DEFAULT_GAME_RULES } from './gameRules.js';

/**
 * Validates if a bid is legal according to game rules
 * @param bid - The bid amount to validate
 * @param currentHighestBid - Current highest bid (null if no bids yet)
 * @param settings - Game settings with min/max bid values
 * @returns Object with isValid flag and reason if invalid
 */
export function validateBid(
  bid: number,
  currentHighestBid: number | null,
  settings: GameSettings = DEFAULT_GAME_RULES
): { isValid: boolean; reason?: string } {
  // Check minimum bid
  if (bid < settings.minBid) {
    return { 
      isValid: false, 
      reason: `Minimum bid is ${settings.minBid}` 
    };
  }

  // Check maximum bid
  if (bid > settings.maxBid) {
    return { 
      isValid: false, 
      reason: `Maximum bid is ${settings.maxBid}` 
    };
  }

  // Check if bid is higher than current highest bid
  if (currentHighestBid !== null && bid <= currentHighestBid) {
    return { 
      isValid: false, 
      reason: `Bid must be higher than current bid of ${currentHighestBid}` 
    };
  }

  return { isValid: true };
}

/**
 * Determines the next valid bid range for a player
 * @param currentHighestBid - Current highest bid
 * @param settings - Game settings
 * @returns Array of valid bid amounts
 */
export function getValidBids(
  currentHighestBid: number | null,
  settings: GameSettings = DEFAULT_GAME_RULES
): number[] {
  const minBid = currentHighestBid !== null 
    ? Math.max(settings.minBid, currentHighestBid + 1)
    : settings.minBid;

  const validBids: number[] = [];
  for (let i = minBid; i <= settings.maxBid; i++) {
    validBids.push(i);
  }

  return validBids;
}

/**
 * Determines if bidding phase is complete
 * Bidding ends when all players except one have passed
 * @param playerPassed - Map of seat numbers to pass status
 * @param activeBidderCount - Number of players still bidding
 * @returns True if bidding is complete
 */
export function isBiddingComplete(
  playerPassed: Map<number, boolean>,
  activeBidderCount: number
): boolean {
  // Bidding complete if only one active bidder remains
  return activeBidderCount === 1;
}

/**
 * Gets the winning bidder from the bids
 * @param bids - Array of all bids placed
 * @param playerPassed - Map of seat numbers to pass status
 * @returns Seat number of winning bidder or null
 */
export function getWinningBidder(
  bids: { seat: number; amount: number }[],
  playerPassed: Map<number, boolean>
): number | null {
  if (bids.length === 0) {
    return null;
  }

  // Find the highest bid
  const highestBid = Math.max(...bids.map(b => b.amount));
  const winningBid = bids.find(b => b.amount === highestBid);

  return winningBid ? winningBid.seat : null;
}
