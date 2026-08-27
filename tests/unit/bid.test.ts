import { describe, it, expect } from 'vitest';
import { validateBid, getValidBids } from '@shared/utils/bid';
import { DEFAULT_GAME_RULES } from '@shared/constants/gameRules';

describe('Bid Engine', () => {
  describe('validateBid', () => {
    it('should accept valid bid when no current bid', () => {
      const result = validateBid(16, null);
      expect(result.isValid).toBe(true);
    });

    it('should reject bid below minimum', () => {
      const result = validateBid(15, null);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Minimum bid');
    });

    it('should reject bid above maximum', () => {
      const result = validateBid(29, null);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Maximum bid');
    });

    it('should reject bid not higher than current', () => {
      const result = validateBid(18, 18);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('higher');
    });

    it('should accept bid higher than current', () => {
      const result = validateBid(19, 18);
      expect(result.isValid).toBe(true);
    });

    it('should use custom min/max from settings', () => {
      const customSettings = {
        ...DEFAULT_GAME_RULES,
        minBid: 20,
        maxBid: 25,
      };
      
      const lowResult = validateBid(18, null, customSettings);
      expect(lowResult.isValid).toBe(false);
      
      const highResult = validateBid(26, null, customSettings);
      expect(highResult.isValid).toBe(false);
      
      const validResult = validateBid(22, null, customSettings);
      expect(validResult.isValid).toBe(true);
    });
  });

  describe('getValidBids', () => {
    it('should return all bids from min to max when no current bid', () => {
      const bids = getValidBids(null);
      expect(bids).toHaveLength(13); // 16 to 28 inclusive
      expect(bids[0]).toBe(16);
      expect(bids[bids.length - 1]).toBe(28);
    });

    it('should return only bids higher than current', () => {
      const bids = getValidBids(20);
      expect(bids[0]).toBe(21);
      expect(bids[bids.length - 1]).toBe(28);
    });

    it('should return empty array when current is max', () => {
      const bids = getValidBids(28);
      expect(bids).toHaveLength(0);
    });

    it('should respect custom settings', () => {
      const customSettings = {
        ...DEFAULT_GAME_RULES,
        minBid: 18,
        maxBid: 24,
      };
      
      const bids = getValidBids(null, customSettings);
      expect(bids[0]).toBe(18);
      expect(bids[bids.length - 1]).toBe(24);
    });
  });
});
