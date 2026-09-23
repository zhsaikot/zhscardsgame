import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/server/engine/GameEngine.js';

describe('GameEngine Solo & Card Flow', () => {
  it('should initialize solo game with 3 bots and deal 4 initial cards to each player', () => {
    const engine = new GameEngine('game_test_1');
    engine.addPlayer('player_1', 'Champion', 'socket_1', false);
    engine.setReady('player_1', true);
    engine.fillWithBots();

    const startRes = engine.startGame();
    expect(startRes.success).toBe(true);

    const state = engine.getGameState();
    expect(state.players).toHaveLength(4);
    expect(state.phase).toBe('BIDDING');

    // All players should have 4 cards initially
    state.players.forEach((p) => {
      expect(p.hand).toBeDefined();
      expect(p.hand.length).toBe(4);
    });

    const humanPlayer = state.players.find((p) => p.id === 'player_1');
    expect(humanPlayer).toBeDefined();
    expect(humanPlayer!.hand.length).toBe(4);
    expect(humanPlayer!.isBot).toBeFalsy();

    // Bots should be marked as bots
    const bots = state.players.filter((p) => p.isBot);
    expect(bots.length).toBe(3);
  });

  it('should deal 4 more cards (total 8) after trump is selected', () => {
    const engine = new GameEngine('game_test_2');
    engine.addPlayer('player_1', 'Champion', 'socket_1', false);
    engine.setReady('player_1', true);
    engine.fillWithBots();
    engine.startGame();

    // Force highest bid and trump selection
    const stateBefore = engine.getGameState();
    const bidderSeat = stateBefore.currentTurn || 1;
    const bidder = stateBefore.players.find((p) => p.seat === bidderSeat)!;

    engine.placeBid(bidder.id, 16);
    // Other players pass in turn order until bidding is complete
    let safetyCounter = 0;
    while (engine.getGameState().phase === 'BIDDING' && safetyCounter < 10) {
      safetyCounter++;
      const currentSeat = engine.getGameState().currentTurn!;
      const currentP = engine.getGameState().players.find((p) => p.seat === currentSeat)!;
      engine.passBid(currentP.id);
    }

    const biddingState = engine.getGameState();
    expect(biddingState.phase).toBe('TRUMP_SELECTION');
    expect(biddingState.winningBidder).toBe(bidderSeat);

    // Select trump
    const trumpRes = engine.selectTrump(bidder.id, 'hearts');
    expect(trumpRes.success).toBe(true);

    const playState = engine.getGameState();
    expect(playState.phase).toBe('PLAYING');
    expect(playState.trumpSuit).toBe('hearts');

    // All players must now have 8 cards
    playState.players.forEach((p) => {
      expect(p.hand.length).toBe(8);
    });
  });

  it('should capture completedTrick with 4 plays and update lastCompletedTrick', () => {
    const engine = new GameEngine('game_test_3');
    engine.addPlayer('player_1', 'Champion', 'socket_1', false);
    engine.setReady('player_1', true);
    engine.fillWithBots();
    engine.startGame();

    // Fast-forward bidding
    const bidderSeat = engine.getGameState().currentTurn || 1;
    const bidder = engine.getGameState().players.find((p) => p.seat === bidderSeat)!;
    engine.placeBid(bidder.id, 16);

    let safety = 0;
    while (engine.getGameState().phase === 'BIDDING' && safety < 10) {
      safety++;
      const curSeat = engine.getGameState().currentTurn!;
      const curPlayer = engine.getGameState().players.find((p) => p.seat === curSeat)!;
      engine.passBid(curPlayer.id);
    }

    engine.selectTrump(bidder.id, 'hearts');
    expect(engine.getGameState().phase).toBe('PLAYING');

    // Play 4 cards in turn order to complete 1 trick
    let trickResult: any;
    for (let i = 0; i < 4; i++) {
      const state = engine.getGameState();
      const currentSeat = state.currentTurn!;
      const player = state.players.find((p) => p.seat === currentSeat)!;
      const legalCards = engine.getLegalCardsForPlayer(player.id);
      expect(legalCards.length).toBeGreaterThan(0);

      const res = engine.playCard(player.id, legalCards[0].id);
      expect(res.success).toBe(true);
      if (i === 3) {
        trickResult = res;
      }
    }

    expect(trickResult.trickComplete).toBe(true);
    expect(trickResult.completedTrick).toBeDefined();
    expect(trickResult.completedTrick.plays).toHaveLength(4);
    expect(trickResult.trickWinner).toBeGreaterThanOrEqual(1);
    expect(trickResult.trickWinner).toBeLessThanOrEqual(4);

    const postTrickState = engine.getGameState();
    expect(postTrickState.lastCompletedTrick).toBeDefined();
    expect(postTrickState.lastCompletedTrick!.plays).toHaveLength(4);
    expect(postTrickState.completedTricks).toHaveLength(1);
  });
});
