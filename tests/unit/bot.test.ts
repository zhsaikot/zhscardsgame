import { describe, it, expect } from 'vitest';
import { BotAI } from '../../src/server/engine/BotAI';
import { createDeck } from '../../src/shared/utils/deck';
import { DEFAULT_GAME_RULES } from '../../src/shared/constants/gameRules';
import type { Player, GameState, Card } from '../../src/shared/types';

describe('BotAI', () => {
  const deck = createDeck();

  const createMockPlayer = (seat: number, hand: Card[]): Player => ({
    id: `bot_${seat}`,
    username: `Bot ${seat}`,
    seat,
    team: [1, 3].includes(seat) ? 'A' : 'B',
    connected: true,
    ready: true,
    hand,
    isBot: true,
  });

  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    gameId: 'game_test',
    status: 'playing',
    phase: 'BIDDING',
    players: [],
    dealer: 4,
    currentTurn: 1,
    deck: [],
    trumpSuit: null,
    trumpRevealed: false,
    highestBid: null,
    winningBidder: null,
    targetBid: null,
    leadSuit: null,
    currentTrick: null,
    completedTricks: [],
    teamPoints: { A: 0, B: 0 },
    gameScore: { teamA: 0, teamB: 0, roundsPlayed: 0 },
    roundNumber: 1,
    settings: DEFAULT_GAME_RULES,
    ...overrides,
  });

  describe('getBidDecision', () => {
    it('should bid minimum 16 when holding high point cards and no current bid', () => {
      // Jack of Spades (3 pts), 9 of Hearts (2 pts) = 5 pts
      const hand = [
        deck.find(c => c.id === 'JS')!,
        deck.find(c => c.id === '9H')!,
        deck.find(c => c.id === '7D')!,
        deck.find(c => c.id === '8C')!,
      ];
      const bot = createMockPlayer(1, hand);
      const state = createMockGameState({ highestBid: null });

      const decision = BotAI.getBidDecision(state, bot);
      expect(decision.action).toBe('bid');
      expect(decision.amount).toBe(16);
    });

    it('should pass when holding only low power cards with no points', () => {
      const hand = [
        deck.find(c => c.id === '7S')!,
        deck.find(c => c.id === '8H')!,
        deck.find(c => c.id === 'KD')!,
        deck.find(c => c.id === 'QC')!,
      ];
      const bot = createMockPlayer(2, hand);
      const state = createMockGameState({ highestBid: null });

      const decision = BotAI.getBidDecision(state, bot);
      expect(decision.action).toBe('pass');
    });

    it('should pass when highest bid exceeds bot willingness', () => {
      // 5 points in hand -> willing to bid up to 17
      const hand = [
        deck.find(c => c.id === 'JS')!,
        deck.find(c => c.id === '9H')!,
        deck.find(c => c.id === '7D')!,
        deck.find(c => c.id === '8C')!,
      ];
      const bot = createMockPlayer(1, hand);
      const state = createMockGameState({ highestBid: 18 });

      const decision = BotAI.getBidDecision(state, bot);
      expect(decision.action).toBe('pass');
    });
  });

  describe('getTrumpDecision', () => {
    it('should choose the suit with the most cards in hand', () => {
      const hand = [
        deck.find(c => c.id === 'JS')!,
        deck.find(c => c.id === '9S')!,
        deck.find(c => c.id === 'AS')!,
        deck.find(c => c.id === '7H')!,
      ];
      const bot = createMockPlayer(1, hand);
      const trump = BotAI.getTrumpDecision(bot);
      expect(trump).toBe('spades');
    });
  });

  describe('getCardToPlay', () => {
    it('should return a legal card following the lead suit', () => {
      const hand = [
        deck.find(c => c.id === 'JS')!,
        deck.find(c => c.id === '9H')!,
        deck.find(c => c.id === '7D')!,
        deck.find(c => c.id === '8C')!,
      ];
      const bot = createMockPlayer(2, hand);
      const state = createMockGameState({
        phase: 'PLAYING',
        leadSuit: 'hearts',
        trumpSuit: 'spades',
        currentTrick: {
          leader: 1,
          leadSuit: 'hearts',
          plays: [{ playerId: 'p1', seat: 1, card: deck.find(c => c.id === '7H')! }],
          winner: 1,
          points: 0,
        },
      });

      const card = BotAI.getCardToPlay(state, bot);
      expect(card.suit).toBe('hearts');
      expect(card.id).toBe('9H');
    });
  });
});

