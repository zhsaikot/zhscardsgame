import { describe, it, expect } from 'vitest';
import { DEMO_AVATARS, getBotAvatar } from '../../src/shared/utils/avatar.js';
import { GameEngine } from '../../src/server/engine/GameEngine.js';

describe('Avatar Utilities & Integration', () => {
  it('should have 6 curated demo avatars with valid SVG data URIs', () => {
    expect(DEMO_AVATARS).toHaveLength(6);
    DEMO_AVATARS.forEach((avatar) => {
      expect(avatar.id).toBeDefined();
      expect(avatar.name).toBeDefined();
      expect(avatar.svgDataUri).toMatch(/^data:image\/svg\+xml/);
    });
  });

  it('should return distinct bot avatars based on seat numbers', () => {
    const botSeat2 = getBotAvatar(2);
    const botSeat3 = getBotAvatar(3);
    const botSeat4 = getBotAvatar(4);

    expect(botSeat2).toBeDefined();
    expect(botSeat3).toBeDefined();
    expect(botSeat4).toBeDefined();
    expect(botSeat2).not.toEqual(botSeat3);
    expect(botSeat3).not.toEqual(botSeat4);
  });

  it('should assign custom avatar to human player in GameEngine', () => {
    const engine = new GameEngine('test_game_avatar');
    const customAvatar = 'data:image/jpeg;base64,/9j/customBase64Sample';
    const result = engine.addPlayer('p1', 'Royale', undefined, false, customAvatar);

    expect(result.success).toBe(true);
    const player = engine.getGameState().players.find((p) => p.id === 'p1');
    expect(player?.avatar).toBe(customAvatar);
  });

  it('should assign bot avatars when fillWithBots is called', () => {
    const engine = new GameEngine('test_game_bots');
    engine.addPlayer('p1', 'Host', undefined, false);
    engine.fillWithBots();

    const state = engine.getGameState();
    expect(state.players).toHaveLength(4);

    const bot2 = state.players.find((p) => p.seat === 2);
    const bot3 = state.players.find((p) => p.seat === 3);
    const bot4 = state.players.find((p) => p.seat === 4);

    expect(bot2?.avatar).toBe(getBotAvatar(2));
    expect(bot3?.avatar).toBe(getBotAvatar(3));
    expect(bot4?.avatar).toBe(getBotAvatar(4));
  });
});

