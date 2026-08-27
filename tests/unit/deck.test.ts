import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck, dealCards } from '@shared/utils/deck';
import { CARD_VALUES, CARD_POWER, TOTAL_CARDS } from '@shared/constants/cardValues';

describe('Deck Engine', () => {
  describe('createDeck', () => {
    it('should create exactly 32 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(TOTAL_CARDS);
    });

    it('should have unique card IDs', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(TOTAL_CARDS);
    });

    it('should have correct card values for J', () => {
      const deck = createDeck();
      const jacks = deck.filter(card => card.rank === 'J');
      expect(jacks).toHaveLength(4);
      jacks.forEach(jack => {
        expect(jack.pointValue).toBe(CARD_VALUES.J);
        expect(jack.power).toBe(CARD_POWER.J);
      });
    });

    it('should have correct card values for 9', () => {
      const deck = createDeck();
      const nines = deck.filter(card => card.rank === '9');
      expect(nines).toHaveLength(4);
      nines.forEach(nine => {
        expect(nine.pointValue).toBe(CARD_VALUES['9']);
        expect(nine.power).toBe(CARD_POWER['9']);
      });
    });

    it('should have all four suits', () => {
      const deck = createDeck();
      const suits = new Set(deck.map(card => card.suit));
      expect(suits.size).toBe(4);
      expect(suits.has('spades')).toBe(true);
      expect(suits.has('hearts')).toBe(true);
      expect(suits.has('diamonds')).toBe(true);
      expect(suits.has('clubs')).toBe(true);
    });

    it('should have 8 cards per suit', () => {
      const deck = createDeck();
      const spades = deck.filter(card => card.suit === 'spades');
      expect(spades).toHaveLength(8);
    });
  });

  describe('shuffleDeck', () => {
    it('should maintain deck size after shuffle', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(TOTAL_CARDS);
    });

    it('should preserve all cards after shuffle', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      const originalIds = new Set(deck.map(c => c.id));
      const shuffledIds = new Set(shuffled.map(c => c.id));
      
      expect(originalIds).toEqual(shuffledIds);
    });

    it('should produce different order (with high probability)', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      // Probability of same order is 1/32! which is essentially zero
      const isSameOrder = deck.every((card, i) => card.id === shuffled[i].id);
      expect(isSameOrder).toBe(false);
    });
  });

  describe('dealCards', () => {
    it('should deal correct number of cards to each player', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const { hands, remainingDeck } = dealCards(shuffled, 4, 4);

      expect(hands).toHaveLength(4);
      hands.forEach(hand => {
        expect(hand).toHaveLength(4);
      });
    });

    it('should leave correct number of cards in remaining deck', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const { remainingDeck } = dealCards(shuffled, 4, 4);

      // 32 - (4 * 4) = 16
      expect(remainingDeck).toHaveLength(16);
    });

    it('should deal all cards when dealing 8 to 4 players', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const { hands, remainingDeck } = dealCards(shuffled, 8, 4);

      hands.forEach(hand => {
        expect(hand).toHaveLength(8);
      });
      expect(remainingDeck).toHaveLength(0);
    });

    it('should not duplicate cards in hands', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const { hands } = dealCards(shuffled, 4, 4);

      const allCardIds = hands.flat().map(card => card.id);
      const uniqueIds = new Set(allCardIds);
      
      expect(uniqueIds.size).toBe(allCardIds.length);
    });
  });
});
