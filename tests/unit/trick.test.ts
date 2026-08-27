import { describe, it, expect } from 'vitest';
import { determineTrickWinner, calculateTrickPoints, getLegalCards, validateCardPlay } from '@shared/utils/trick';
import { createDeck } from '@shared/utils/deck';

describe('Trick Engine', () => {
  const deck = createDeck();

  describe('determineTrickWinner', () => {
    it('should return the only player when one card played', () => {
      const plays = [
        { seat: 1, card: deck.find(c => c.id === 'JS')! }
      ];
      
      const winner = determineTrickWinner(plays, 'spades', null);
      expect(winner).toBe(1);
    });

    it('should award trick to highest lead suit card when no trump', () => {
      const hearts = deck.filter(c => c.suit === 'hearts');
      const plays = [
        { seat: 1, card: hearts[2] }, // Lower power
        { seat: 2, card: hearts[0] }, // J of hearts - highest
        { seat: 3, card: hearts[4] },
        { seat: 4, card: hearts[6] },
      ];
      
      const winner = determineTrickWinner(plays, 'hearts', null);
      expect(winner).toBe(2);
    });

    it('should award trick to trump card over higher lead suit', () => {
      const hearts = deck.filter(c => c.suit === 'hearts');
      const spades = deck.filter(c => c.suit === 'spades');
      
      const plays = [
        { seat: 1, card: hearts[0] }, // J of hearts (highest heart)
        { seat: 2, card: hearts[1] },
        { seat: 3, card: spades[7] }, // 7 of spades (lowest spade)
        { seat: 4, card: hearts[2] },
      ];
      
      // Trump is spades, so even lowest spade wins
      const winner = determineTrickWinner(plays, 'hearts', 'spades');
      expect(winner).toBe(3);
    });

    it('should award trick to highest trump when multiple trumps played', () => {
      const spades = deck.filter(c => c.suit === 'spades');
      
      const plays = [
        { seat: 1, card: spades[7] }, // 7S - lowest
        { seat: 2, card: spades[0] }, // JS - highest
        { seat: 3, card: spades[5] }, // QS
        { seat: 4, card: spades[2] }, // AS
      ];
      
      const winner = determineTrickWinner(plays, 'spades', 'spades');
      expect(winner).toBe(2);
    });

    it('should not allow off-suit non-trump to win', () => {
      const hearts = deck.filter(c => c.suit === 'hearts');
      const diamonds = deck.filter(c => c.suit === 'diamonds');
      
      const plays = [
        { seat: 1, card: hearts[3] }, // 10H
        { seat: 2, card: hearts[5] }, // QH
        { seat: 3, card: diamonds[0] }, // JD - off suit
        { seat: 4, card: hearts[6] }, // 8H
      ];
      
      // QH should win (highest heart, trump is clubs)
      const winner = determineTrickWinner(plays, 'hearts', 'clubs');
      expect(winner).toBe(2);
    });
  });

  describe('calculateTrickPoints', () => {
    it('should sum point values of all cards', () => {
      const j = deck.find(c => c.id === 'JH')!;
      const nine = deck.find(c => c.id === '9H')!;
      const ace = deck.find(c => c.id === 'AH')!;
      const seven = deck.find(c => c.id === '7H')!;
      
      const plays = [
        { card: j },
        { card: nine },
        { card: ace },
        { card: seven }
      ];
      
      const points = calculateTrickPoints(plays);
      // J=3, 9=2, A=1, 7=0 = 6
      expect(points).toBe(6);
    });

    it('should return 0 for all zero-point cards', () => {
      const k = deck.find(c => c.id === 'KH')!;
      const q = deck.find(c => c.id === 'QH')!;
      const eight = deck.find(c => c.id === '8H')!;
      const seven = deck.find(c => c.id === '7H')!;
      
      const plays = [
        { card: k },
        { card: q },
        { card: eight },
        { card: seven }
      ];
      
      const points = calculateTrickPoints(plays);
      expect(points).toBe(0);
    });
  });

  describe('getLegalCards', () => {
    it('should return all cards when no lead suit', () => {
      const hand = deck.slice(0, 8);
      const legal = getLegalCards(hand, null);
      
      expect(legal).toHaveLength(8);
      expect(legal.map(c => c.id)).toEqual(hand.map(c => c.id));
    });

    it('should return only matching suit cards when player has lead suit', () => {
      const spades = deck.filter(c => c.suit === 'spades').slice(0, 3);
      const hearts = deck.filter(c => c.suit === 'hearts').slice(0, 2);
      const hand = [...spades, ...hearts];
      
      const legal = getLegalCards(hand, 'spades');
      
      expect(legal).toHaveLength(3);
      legal.forEach(card => {
        expect(card.suit).toBe('spades');
      });
    });

    it('should return all cards when player void in lead suit', () => {
      const spades = deck.filter(c => c.suit === 'spades').slice(0, 3);
      const hearts = deck.filter(c => c.suit === 'hearts').slice(0, 2);
      const hand = [...spades, ...hearts];
      
      const legal = getLegalCards(hand, 'diamonds');
      
      // Player has no diamonds, can play anything
      expect(legal).toHaveLength(5);
    });
  });

  describe('validateCardPlay', () => {
    it('should reject card not in hand', () => {
      const hand = deck.slice(0, 8);
      const fakeCard = { id: 'FAKE', rank: 'J' as const, suit: 'spades' as const, pointValue: 3, power: 8 };
      
      const result = validateCardPlay(fakeCard, hand, null);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("You don't have that card");
    });

    it('should accept any card when leading', () => {
      const hand = deck.slice(0, 8);
      const card = hand[0];
      
      const result = validateCardPlay(card, hand, null);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject off-suit when player has lead suit', () => {
      const spades = deck.filter(c => c.suit === 'spades').slice(0, 3);
      const hearts = deck.filter(c => c.suit === 'hearts').slice(0, 2);
      const hand = [...spades, ...hearts];
      const offSuitCard = hearts[0];
      
      const result = validateCardPlay(offSuitCard, hand, 'spades');
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('You must follow the lead suit');
    });

    it('should accept off-suit when player void in lead suit', () => {
      const spades = deck.filter(c => c.suit === 'spades').slice(0, 3);
      const hearts = deck.filter(c => c.suit === 'hearts').slice(0, 2);
      const hand = [...spades, ...hearts];
      const heartCard = hearts[0];
      
      const result = validateCardPlay(heartCard, hand, 'diamonds');
      
      expect(result.isValid).toBe(true);
    });
  });
});
