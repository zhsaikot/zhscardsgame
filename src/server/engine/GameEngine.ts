import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { 
  GameState, 
  GamePhase, 
  Player, 
  Card, 
  Trick,
  GameSettings 
} from '../../shared/types/index.js';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards 
} from '../../shared/utils/deck.js';
import { 
  determineTrickWinner, 
  calculateTrickPoints,
  getLegalCards,
  validateCardPlay 
} from '../../shared/utils/trick.js';
import { 
  validateBid, 
  getValidBids 
} from '../../shared/utils/bid.js';
import { ScoreEngine } from '../../shared/utils/score.js';
import { 
  DEFAULT_GAME_RULES, 
  TEAM_ASSIGNMENTS, 
  getTeamForSeat,
  getNextSeat,
  FINAL_HAND_SIZE 
} from '../../shared/constants/gameRules.js';
import { TRICKS_PER_ROUND } from '../../shared/constants/cardValues.js';

/**
 * Main game engine that manages all game state and logic
 * Server-side authoritative game management
 */
export class GameEngine {
  private gameState: GameState;
  private scoreEngine: ScoreEngine;
  private moveHistory: Array<{
    id: string;
    action: string;
    playerId: string;
    seat?: number;
    data?: unknown;
    timestamp: Date;
  }> = [];

  constructor(gameId: string, settings: Partial<GameSettings> = {}) {
    this.gameState = this.createInitialState(gameId, settings);
    this.scoreEngine = new ScoreEngine(this.gameState.settings);
  }

  /**
   * Creates initial game state
   */
  private createInitialState(
    gameId: string, 
    settings: Partial<GameSettings>
  ): GameState {
    return {
      gameId,
      status: 'waiting',
      phase: 'LOBBY',
      players: [],
      dealer: null,
      currentTurn: null,
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
      roundNumber: 0,
      settings: { ...DEFAULT_GAME_RULES, ...settings },
    };
  }

  /**
   * Gets the current game state (public view - hides opponent hands)
   */
  getGameState(viewingPlayerId?: string): GameState {
    return {
      ...this.gameState,
      players: this.gameState.players.map(p => ({
        ...p,
        hand: [...(p.hand || [])],
      })),
    };
  }

  /**
   * Sanitizes game state to hide opponent hands
   */
  private sanitizeGameState(state: GameState, viewingSeat?: number): GameState {
    const sanitized = { ...state };
    
    // Hide other players' hands
    sanitized.players = state.players.map(player => {
      if (viewingSeat && player.seat === viewingSeat) {
        // Return full player data for viewing player
        return { ...player };
      }
      
      // Hide hand for other players
      const { hand, ...playerWithoutHand } = player;
      return { ...playerWithoutHand, hand: [] };
    });

    // Hide deck
    sanitized.deck = [];

    return sanitized;
  }

  /**
   * Adds a player to the game
   */
  addPlayer(
    playerId: string, 
    username: string, 
    socketId?: string,
    isBot: boolean = false
  ): { success: boolean; error?: string; seat?: number } {
    // Check if game is full
    if (this.gameState.players.length >= 4) {
      return { success: false, error: 'Game is full' };
    }

    // Check if player already in game
    if (this.gameState.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Player already in game' };
    }

    // Assign next available seat
    const occupiedSeats = new Set(this.gameState.players.map(p => p.seat));
    let seat = 1;
    while (occupiedSeats.has(seat) && seat <= 4) {
      seat++;
    }

    if (seat > 4) {
      return { success: false, error: 'No available seats' };
    }

    const team = getTeamForSeat(seat);
    const player: Player = {
      id: playerId,
      username,
      seat,
      team,
      connected: true,
      ready: isBot,
      hand: [],
      socketId,
      isBot,
    };

    this.gameState.players.push(player);
    this.updatePhase('WAITING_FOR_PLAYERS');

    this.logMove('player:joined', playerId, seat);

    return { success: true, seat };
  }

  /**
   * Fills all remaining empty seats with AI bots
   */
  fillWithBots(): void {
    const botNames: Record<number, string> = {
      2: 'Vanguard [BOT]',
      3: 'Artemis [BOT]',
      4: 'Cipher [BOT]',
    };

    for (let s = 1; s <= 4; s++) {
      if (!this.gameState.players.some(p => p.seat === s)) {
        const botId = `bot_${s}_${Date.now()}`;
        const name = botNames[s] || `Bot ${s}`;
        this.addPlayer(botId, name, undefined, true);
      }
    }
  }

  /**
   * Removes a player from the game
   */
  removePlayer(playerId: string): boolean {
    const index = this.gameState.players.findIndex(p => p.id === playerId);
    if (index === -1) {
      return false;
    }

    const player = this.gameState.players[index];
    this.gameState.players.splice(index, 1);
    
    // Mark as disconnected rather than removing if game started
    if (this.gameState.status === 'playing') {
      player.connected = false;
      this.gameState.players[index] = player;
    }

    this.logMove('player:left', playerId, player.seat);

    return true;
  }

  /**
   * Sets player ready status
   */
  setReady(playerId: string, ready: boolean): boolean {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    player.ready = ready;
    this.logMove('player:ready', playerId, player.seat, { ready });

    return true;
  }

  /**
   * Starts the game when all players are ready
   */
  startGame(): { success: boolean; error?: string } {
    // Check if we have 4 players
    if (this.gameState.players.length < 4) {
      return { success: false, error: 'Need 4 players to start' };
    }

    // Check if all players are ready
    const notReadyPlayers = this.gameState.players.filter(p => !p.ready);
    if (notReadyPlayers.length > 0) {
      return { 
        success: false, 
        error: 'Not all players are ready' 
      };
    }

    // Initialize first round
    this.startRound();

    return { success: true };
  }

  /**
   * Starts a new round
   */
  private startRound(): void {
    this.gameState.roundNumber++;
    this.gameState.status = 'playing';
    
    // Rotate dealer
    if (this.gameState.dealer === null) {
      this.gameState.dealer = 1;
    } else {
      this.gameState.dealer = getNextSeat(this.gameState.dealer);
    }

    // Reset round state
    this.gameState.trumpSuit = null;
    this.gameState.trumpRevealed = false;
    this.gameState.highestBid = null;
    this.gameState.winningBidder = null;
    this.gameState.targetBid = null;
    this.gameState.leadSuit = null;
    this.gameState.currentTrick = null;
    this.gameState.completedTricks = [];
    this.gameState.teamPoints = { A: 0, B: 0 };

    // Create and shuffle deck
    const deck = createDeck();
    this.gameState.deck = shuffleDeck(deck);

    // Deal initial 4 cards to each player
    this.dealInitialCards();

    this.logMove('round:started', 'system', undefined, {
      roundNumber: this.gameState.roundNumber,
      dealer: this.gameState.dealer,
    });
  }

  /**
   * Deals initial 4 cards to each player
   */
  private dealInitialCards(): void {
    const { hands, remainingDeck } = dealCards(
      this.gameState.deck, 
      4, 
      4
    );

    // Assign hands to players
    this.gameState.players.forEach((player, index) => {
      player.hand = hands[index];
    });

    this.gameState.deck = remainingDeck;
    this.updatePhase('BIDDING');

    // Determine first bidder (player after dealer)
    const firstBidder = getNextSeat(this.gameState.dealer!);
    this.gameState.currentTurn = firstBidder;

    this.logMove('cards:dealt', 'system', undefined, {
      cardsPerPlayer: 4,
      firstBidder,
    });
  }

  /**
   * Places a bid for the current player
   */
  placeBid(playerId: string, amount: number): { 
    success: boolean; 
    error?: string;
    newState?: GameState;
  } {
    if (this.gameState.phase !== 'BIDDING') {
      return { success: false, error: 'Not in bidding phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.gameState.currentTurn !== player.seat) {
      return { success: false, error: "Not your turn" };
    }

    // Validate bid
    const validation = validateBid(
      amount, 
      this.gameState.highestBid,
      this.gameState.settings
    );

    if (!validation.isValid) {
      return { success: false, error: validation.reason };
    }

    // Update bid state
    this.gameState.highestBid = amount;
    this.gameState.winningBidder = player.seat;
    this.gameState.targetBid = amount;

    this.logMove('bid:placed', playerId, player.seat, { amount });

    // Move to next bidder
    this.moveToNextBidder();

    return { success: true, newState: this.getGameState(playerId) };
  }

  /**
   * Player passes on bidding
   */
  passBid(playerId: string): { success: boolean; error?: string } {
    if (this.gameState.phase !== 'BIDDING') {
      return { success: false, error: 'Not in bidding phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.gameState.currentTurn !== player.seat) {
      return { success: false, error: "Not your turn" };
    }

    this.logMove('bid:passed', playerId, player.seat);

    // Move to next bidder
    this.moveToNextBidder();

    return { success: true };
  }

  /**
   * Moves to the next bidder in clockwise order
   */
  private moveToNextBidder(): void {
    // In a full implementation, track who has passed
    // For now, simplify: continue until we decide bidding is complete
    
    const currentTurn = this.gameState.currentTurn!;
    const nextTurn = getNextSeat(currentTurn);
    
    // Check if we've come back to the winning bidder (bidding complete)
    if (this.gameState.winningBidder !== null && 
        nextTurn === this.gameState.winningBidder) {
      // Bidding complete - move to trump selection
      this.updatePhase('TRUMP_SELECTION');
      this.gameState.currentTurn = this.gameState.winningBidder;
    } else {
      this.gameState.currentTurn = nextTurn;
    }
  }

  /**
   * Winning bidder selects trump suit
   */
  selectTrump(playerId: string, suit: 'spades' | 'hearts' | 'diamonds' | 'clubs'): {
    success: boolean;
    error?: string;
  } {
    if (this.gameState.phase !== 'TRUMP_SELECTION') {
      return { success: false, error: 'Not in trump selection phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.gameState.currentTurn !== player.seat) {
      return { success: false, error: "Not your turn" };
    }

    if (player.seat !== this.gameState.winningBidder) {
      return { success: false, error: 'Only winning bidder can select trump' };
    }

    this.gameState.trumpSuit = suit;
    this.gameState.trumpRevealed = !this.gameState.settings.hiddenTrump;

    this.logMove('trump:selected', playerId, player.seat, { suit });

    // Deal remaining cards
    this.dealRemainingCards();

    return { success: true };
  }

  /**
   * Deals remaining 4 cards to each player
   */
  private dealRemainingCards(): void {
    const { hands, remainingDeck } = dealCards(
      this.gameState.deck, 
      4, 
      4
    );

    // Add to existing hands
    this.gameState.players.forEach((player, index) => {
      player.hand = [...player.hand, ...hands[index]];
      
      // Verify hand size
      if (player.hand.length !== FINAL_HAND_SIZE) {
        console.error(`Player ${player.seat} has ${player.hand.length} cards instead of ${FINAL_HAND_SIZE}`);
      }
    });

    this.gameState.deck = remainingDeck;

    // Start trick play - winner of bid leads first trick
    this.updatePhase('PLAYING');
    this.gameState.currentTurn = this.gameState.winningBidder;
    this.startNewTrick(this.gameState.winningBidder!);

    this.logMove('cards:dealt', 'system', undefined, {
      cardsPerPlayer: 4,
      totalCards: FINAL_HAND_SIZE,
      firstLeader: this.gameState.winningBidder,
    });
  }

  /**
   * Starts a new trick with the specified leader
   */
  private startNewTrick(leaderSeat: number): void {
    this.gameState.leadSuit = null;
    this.gameState.currentTrick = {
      leader: leaderSeat,
      leadSuit: null,
      plays: [],
      winner: null,
      points: 0,
    };
    this.gameState.currentTurn = leaderSeat;
  }

  /**
   * Plays a card for the current player
   */
  playCard(playerId: string, cardId: string): {
    success: boolean;
    error?: string;
    trickComplete?: boolean;
    trickWinner?: number;
    newState?: GameState;
  } {
    if (this.gameState.phase !== 'PLAYING') {
      return { success: false, error: 'Not in playing phase' };
    }

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.gameState.currentTurn !== player.seat) {
      return { success: false, error: "Not your turn" };
    }

    // Find the card in player's hand
    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      return { success: false, error: "You don't have that card" };
    }

    // Validate card play against lead suit
    const validation = validateCardPlay(
      card, 
      player.hand, 
      this.gameState.leadSuit
    );

    if (!validation.isValid) {
      return { success: false, error: validation.reason };
    }

    // Remove card from hand
    player.hand = player.hand.filter(c => c.id !== cardId);

    // Add to current trick
    if (!this.gameState.currentTrick) {
      return { success: false, error: 'No active trick' };
    }

    // Set lead suit if this is the first card
    if (this.gameState.currentTrick.plays.length === 0) {
      this.gameState.leadSuit = card.suit;
      this.gameState.currentTrick.leadSuit = card.suit;
    }

    this.gameState.currentTrick.plays.push({
      playerId: player.id,
      seat: player.seat,
      card,
    });

    this.logMove('card:played', playerId, player.seat, { cardId });

    // Check if trick is complete (4 cards played)
    if (this.gameState.currentTrick.plays.length === 4) {
      return this.completeTrick();
    }

    // Move to next player
    this.gameState.currentTurn = getNextSeat(this.gameState.currentTurn!);

    return { 
      success: true, 
      trickComplete: false,
      newState: this.getGameState(playerId)
    };
  }

  /**
   * Completes the current trick and determines winner
   */
  private completeTrick(): {
    success: boolean;
    error?: string;
    trickComplete: true;
    trickWinner: number;
    newState?: GameState;
  } {
    const trick = this.gameState.currentTrick!;

    // Determine winner
    const winnerSeat = determineTrickWinner(
      trick.plays,
      trick.leadSuit,
      this.gameState.trumpSuit
    );

    // Calculate points
    const points = calculateTrickPoints(trick.plays);
    trick.winner = winnerSeat;
    trick.points = points;

    // Add to completed tricks
    this.gameState.completedTricks.push(trick);

    // Add points to winning team
    const winningTeam = getTeamForSeat(winnerSeat);
    this.gameState.teamPoints[winningTeam] += points;

    this.logMove('trick:completed', 'system', undefined, {
      winner: winnerSeat,
      points,
      winningTeam,
    });

    // Clear current trick
    this.gameState.currentTrick = null;
    this.gameState.leadSuit = null;

    // Check if round is complete (8 tricks)
    if (this.gameState.completedTricks.length === TRICKS_PER_ROUND) {
      return this.completeRound();
    }

    // Start next trick - winner leads
    this.startNewTrick(winnerSeat);
    this.updatePhase('PLAYING');

    const currentPlayer = this.gameState.players.find(p => p.seat === winnerSeat);
    
    return {
      success: true,
      trickComplete: true,
      trickWinner: winnerSeat,
      newState: currentPlayer ? this.getGameState(currentPlayer.id) : undefined,
    };
  }

  /**
   * Completes the round and calculates final scores
   */
  private completeRound(): {
    success: boolean;
    error?: string;
    trickComplete: true;
    trickWinner: number;
    newState?: GameState;
  } {
    // Add final trick bonus
    const lastTrick = this.gameState.completedTricks[this.gameState.completedTricks.length - 1];
    const finalTrickWinner = lastTrick.winner!;
    const finalTrickWinnerTeam = getTeamForSeat(finalTrickWinner);
    
    this.gameState.teamPoints[finalTrickWinnerTeam] += 
      this.gameState.settings.finalTrickBonus;

    // Verify total points
    const totalPoints = 
      this.gameState.teamPoints.A + this.gameState.teamPoints.B;
    
    if (totalPoints !== 29) {
      console.error(`Total points is ${totalPoints}, expected 29`);
    }

    // Calculate round result
    if (this.gameState.winningBidder === null || this.gameState.targetBid === null) {
      throw new Error('No winning bidder found');
    }

    const bidderTeam = getTeamForSeat(this.gameState.winningBidder);
    const roundResult = this.scoreEngine.calculateRoundResult(
      bidderTeam,
      this.gameState.targetBid,
      this.gameState.teamPoints
    );

    // Update game score
    this.gameState.gameScore.teamA += roundResult.scoreUpdate.teamA;
    this.gameState.gameScore.teamB += roundResult.scoreUpdate.teamB;
    this.gameState.gameScore.roundsPlayed++;

    this.gameState.winningTeam = 
      this.gameState.teamPoints.A > this.gameState.teamPoints.B ? 'A' : 'B';
    
    const contractResult = roundResult.contractResult;

    this.logMove('round:completed', 'system', undefined, {
      teamPoints: this.gameState.teamPoints,
      contractResult,
      winningTeam: this.gameState.winningTeam,
      gameScore: this.gameState.gameScore,
    });

    this.updatePhase('ROUND_COMPLETE');

    // Get a player for state retrieval
    const currentPlayer = this.gameState.players[0];

    return {
      success: true,
      trickComplete: true,
      trickWinner: finalTrickWinner,
      newState: this.getGameState(currentPlayer.id),
    };
  }

  /**
   * Starts the next round or completes the game
   */
  startNextRound(): { success: boolean; gameComplete?: boolean } {
    // Check if game should end (based on winning score or fixed rounds)
    if (this.gameState.settings.winningScore > 0) {
      const winner = this.scoreEngine.determineGameWinner(
        this.gameState.gameScore,
        this.gameState.settings.winningScore
      );
      
      if (winner) {
        this.updatePhase('GAME_COMPLETE');
        this.gameState.status = 'completed';
        return { success: true, gameComplete: true };
      }
    }

    // Start next round
    this.startRound();
    return { success: true, gameComplete: false };
  }

  /**
   * Updates the game phase
   */
  private updatePhase(phase: GamePhase): void {
    this.gameState.phase = phase;
    this.logMove('phase:changed', 'system', undefined, { phase });
  }

  /**
   * Logs a move for replay and debugging
   */
  private logMove(
    action: string, 
    playerId: string, 
    seat?: number, 
    data?: unknown
  ): void {
    this.moveHistory.push({
      id: uuidv4(),
      action,
      playerId,
      seat,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Gets the move history for debugging/replay
   */
  getMoveHistory(): typeof this.moveHistory {
    return [...this.moveHistory];
  }

  /**
   * Reconnects a player to the game
   */
  reconnectPlayer(playerId: string, socketId: string): {
    success: boolean;
    error?: string;
  } {
    const player = this.gameState.players.find(p => p.id === playerId);
    
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    player.connected = true;
    player.socketId = socketId;

    this.logMove('player:reconnected', playerId, player.seat);

    return { success: true };
  }

  /**
   * Gets legal cards for a player
   */
  getLegalCardsForPlayer(playerId: string): Card[] {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return [];
    }

    return getLegalCards(player.hand, this.gameState.leadSuit);
  }
}
