import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../engine/GameEngine.js';
import type { GameSettings } from '../types/index.js';

/**
 * Service for managing multiple game instances
 * Singleton pattern to maintain game state across requests
 */
export class GameService {
  private static instance: GameService;
  private games: Map<string, GameEngine> = new Map();
  private playerGames: Map<string, string> = new Map(); // playerId -> gameId

  private constructor() {}

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * Creates a new game
   */
  createGame(settings?: Partial<GameSettings>): string {
    const gameId = this.generateGameId();
    const engine = new GameEngine(gameId, settings);
    this.games.set(gameId, engine);
    console.log(`Game created: ${gameId}`);
    return gameId;
  }

  /**
   * Gets a game by ID
   */
  getGame(gameId: string): GameEngine | null {
    return this.games.get(gameId) || null;
  }

  /**
   * Gets the game ID for a player
   */
  getPlayerGame(playerId: string): string | null {
    return this.playerGames.get(playerId) || null;
  }

  /**
   * Registers a player to a game
   */
  registerPlayer(playerId: string, gameId: string): void {
    this.playerGames.set(playerId, gameId);
  }

  /**
   * Unregisters a player from their game
   */
  unregisterPlayer(playerId: string): void {
    this.playerGames.delete(playerId);
  }

  /**
   * Removes a game (cleanup)
   */
  removeGame(gameId: string): boolean {
    const engine = this.games.get(gameId);
    if (!engine) {
      return false;
    }

    // Unregister all players
    const state = engine.getGameState();
    state.players.forEach(player => {
      this.playerGames.delete(player.id);
    });

    this.games.delete(gameId);
    console.log(`Game removed: ${gameId}`);
    return true;
  }

  /**
   * Gets all active games
   */
  getAllGames(): Array<{ gameId: string; status: string; playerCount: number }> {
    const games: Array<{ gameId: string; status: string; playerCount: number }> = [];
    
    this.games.forEach((engine, gameId) => {
      const state = engine.getGameState();
      games.push({
        gameId,
        status: state.status,
        playerCount: state.players.length,
      });
    });

    return games;
  }

  /**
   * Cleans up abandoned games
   */
  cleanupAbandonedGames(maxAgeMs: number = 30 * 60 * 1000): number {
    let cleaned = 0;
    const now = Date.now();

    this.games.forEach((engine, gameId) => {
      const state = engine.getGameState();
      
      // Remove completed games older than maxAgeMs
      if (state.status === 'completed') {
        this.removeGame(gameId);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Generates a unique game ID
   */
  private generateGameId(): string {
    return `game_${uuidv4().substring(0, 8)}`;
  }
}
